<template>
  <div class="space-y-6 pb-20">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
          Tasks
        </h1>
        <p class="mt-1 text-neutral-500">
          Checklisten-Vorlagen für Ressourcen – werden bei Buchungen materialisiert.
        </p>
      </div>
      <button type="button" class="btn-dialog-primary gap-2" @click="openAddDialog">
        <UiIcon name="i-lucide-plus" class="size-4" />
        Task hinzufügen
      </button>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative max-w-sm flex-1">
        <UiIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tasks suchen…"
          class="w-full rounded-none border border-neutral-200 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>
    </div>

    <div class="w-full overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Titel</th>
            <th class="pb-3 pr-4 font-medium">Ressourcen</th>
            <th class="pb-3 pr-4 font-medium">Status</th>
            <th class="pb-3 pr-4 font-medium">Reihenfolge</th>
            <th class="pb-3 font-medium text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="py-12 text-center text-neutral-500">Lädt…</td>
          </tr>
          <tr v-else-if="filteredTasks.length === 0">
            <td colspan="5" class="py-12 text-center text-neutral-500">
              Keine Tasks gefunden.
              <button
                type="button"
                class="ml-1 font-medium text-brand-accent hover:underline"
                @click="openAddDialog"
              >
                Neuen Task anlegen
              </button>
            </td>
          </tr>
          <tr
            v-for="task in filteredTasks"
            :key="task.id"
            class="group border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
          >
            <td class="py-4 pr-4">
              <div class="font-medium text-neutral-900">{{ task.title }}</div>
              <div
                v-if="task.description"
                class="mt-0.5 max-w-xs truncate text-xs text-neutral-500"
              >
                {{ task.description }}
              </div>
            </td>
            <td class="py-4 pr-4 text-neutral-700">
              <span v-if="taskResources(task).length">
                {{ taskResources(task).map((r) => r.name).join(", ") }}
              </span>
              <span v-else class="text-neutral-400">—</span>
            </td>
            <td class="py-4 pr-4">
              <span
                :class="
                  task.is_active ? 'text-emerald-600' : 'text-neutral-400'
                "
              >
                {{ task.is_active ? "Aktiv" : "Inaktiv" }}
              </span>
            </td>
            <td class="py-4 pr-4 text-neutral-700">
              {{ task.sort_order ?? 0 }}
            </td>
            <td class="py-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="p-1.5 text-neutral-400 transition-colors hover:text-neutral-900"
                  title="Bearbeiten"
                  @click="editTask(task)"
                >
                  <IconEdit class="size-3 text-neutral-600" />
                </button>
                <button
                  type="button"
                  class="p-1.5 text-neutral-400 transition-colors hover:text-red-600"
                  title="Löschen"
                  @click="deleteTask(task)"
                >
                  <IconTrash class="size-4 text-neutral-600" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showDialog"
      class="dialog-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0" @click="showDialog = false" />

      <div class="dialog-panel max-w-xl">
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ editingTask ? "Task bearbeiten" : "Neuer Task" }}
          </h3>
          <button
            type="button"
            class="dialog-close"
            aria-label="Schließen"
            @click="showDialog = false"
          >
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="dialog-body space-y-5">
          <div>
            <label class="dialog-label">Titel</label>
            <input
              v-model="taskForm.title"
              type="text"
              placeholder="z.B. Küche aufräumen, Schlüssel zurückgeben"
              class="dialog-input"
            />
          </div>

          <div>
            <label class="dialog-label">Beschreibung</label>
            <textarea
              v-model="taskForm.description"
              rows="3"
              placeholder="Optionale Anleitung für das Team…"
              class="dialog-input min-h-20"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="dialog-label">Reihenfolge</label>
              <input
                v-model.number="taskForm.sort_order"
                type="number"
                min="0"
                step="1"
                class="dialog-input"
              />
            </div>
            <div class="flex items-end pb-1">
              <button
                type="button"
                role="switch"
                :aria-checked="taskForm.is_active"
                :class="[
                  taskForm.is_active ? 'bg-neutral-900' : 'bg-neutral-200',
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-neutral-400',
                ]"
                @click="taskForm.is_active = !taskForm.is_active"
              >
                <span
                  aria-hidden="true"
                  :class="[
                    taskForm.is_active ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  ]"
                />
              </button>
              <span class="ml-3 text-sm font-medium text-neutral-900">
                Aktiv
              </span>
            </div>
          </div>

          <div>
            <label class="dialog-label">Ressourcen</label>
            <p class="mb-2 text-xs text-neutral-500">
              Task erscheint in Buchungen der ausgewählten Ressourcen.
            </p>
            <div
              class="max-h-40 space-y-2 overflow-y-auto border border-neutral-200 p-3"
            >
              <p
                v-if="resources.length === 0"
                class="text-sm text-neutral-400"
              >
                Keine Ressourcen vorhanden.
              </p>
              <label
                v-for="resource in resources"
                :key="resource.id"
                class="flex cursor-pointer items-center gap-2 text-sm text-neutral-800"
              >
                <input
                  v-model="taskForm.resource_ids"
                  type="checkbox"
                  :value="resource.id"
                  class="rounded-none border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                />
                {{ resource.name }}
              </label>
            </div>
          </div>

          <div>
            <label class="dialog-label">Anleitungsdateien</label>
            <ul v-if="existingFiles.length" class="mb-2 space-y-1">
              <li
                v-for="file in existingFiles"
                :key="file.id"
                class="flex items-center justify-between gap-2 text-sm"
              >
                <a
                  :href="getFileUrl(file.file_path)"
                  target="_blank"
                  rel="noopener"
                  class="truncate text-brand-accent hover:underline"
                >
                  {{ file.original_name }}
                </a>
                <button
                  type="button"
                  class="shrink-0 text-neutral-400 hover:text-red-600"
                  title="Datei löschen"
                  :disabled="!taskForm.id || deletingFileId === file.id"
                  @click="removeFile(file)"
                >
                  <UiIcon name="i-lucide-x" class="size-3.5" />
                </button>
              </li>
            </ul>
            <ul v-if="pendingFiles.length" class="mb-2 space-y-1">
              <li
                v-for="(file, idx) in pendingFiles"
                :key="`${file.name}-${idx}`"
                class="flex items-center justify-between gap-2 text-sm text-neutral-600"
              >
                <span class="truncate">{{ file.name }} (ausstehend)</span>
                <button
                  type="button"
                  class="shrink-0 text-neutral-400 hover:text-red-600"
                  title="Entfernen"
                  @click="pendingFiles.splice(idx, 1)"
                >
                  <UiIcon name="i-lucide-x" class="size-3.5" />
                </button>
              </li>
            </ul>
            <label
              class="inline-flex cursor-pointer items-center gap-2 border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <UiIcon name="i-lucide-upload" class="size-3.5" />
              Datei hinzufügen
              <input
                type="file"
                class="hidden"
                @change="onFileSelected"
              />
            </label>
          </div>
        </div>

        <div class="dialog-footer">
          <button
            type="button"
            class="btn-dialog-cancel"
            @click="showDialog = false"
          >
            Abbrechen
          </button>
          <button
            type="button"
            class="btn-dialog-primary"
            :disabled="saving || !taskForm.title?.trim()"
            @click="saveTask"
          >
            <span
              v-if="saving"
              class="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            Speichern
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useBookingApi();
const { confirm } = useConfirm();

const loading = ref(true);
const saving = ref(false);
const deletingFileId = ref<number | null>(null);
const tasks = ref<any[]>([]);
const resources = ref<any[]>([]);
const searchQuery = ref("");

const showDialog = ref(false);
const editingTask = ref(false);
const pendingFiles = ref<File[]>([]);
const existingFiles = ref<any[]>([]);

const taskForm = ref({
  id: null as number | null,
  title: "",
  description: "",
  sort_order: 0,
  is_active: true,
  resource_ids: [] as number[],
});

const filteredTasks = computed(() => {
  const list = [...tasks.value].sort(
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.id ?? 0) - (b.id ?? 0),
  );
  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(
    (t) =>
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q),
  );
});

const taskResources = (task: any) =>
  task.Resources || task.resources || [];

const getFileUrl = (filePath: string) => {
  if (!filePath) return "#";
  const path = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${import.meta.env.VITE_INTERNAL_IMAGE_URL || ""}${path}`;
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const data = await api.tasks.getAll();
    if (data) tasks.value = Array.isArray(data) ? data : [];
  } finally {
    loading.value = false;
  }
};

const loadResources = async () => {
  const data = await api.resources.getAll();
  if (data) resources.value = Array.isArray(data) ? data : [];
};

const resetForm = () => {
  taskForm.value = {
    id: null,
    title: "",
    description: "",
    sort_order: 0,
    is_active: true,
    resource_ids: [],
  };
  pendingFiles.value = [];
  existingFiles.value = [];
};

const openAddDialog = () => {
  editingTask.value = false;
  resetForm();
  showDialog.value = true;
};

const editTask = (task: any) => {
  editingTask.value = true;
  const assigned = taskResources(task);
  taskForm.value = {
    id: task.id,
    title: task.title || "",
    description: task.description || "",
    sort_order: task.sort_order ?? 0,
    is_active: task.is_active !== false,
    resource_ids: assigned.map((r: any) => r.id),
  };
  existingFiles.value = [...(task.files || [])];
  pendingFiles.value = [];
  showDialog.value = true;
};

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) pendingFiles.value.push(file);
  input.value = "";
};

const removeFile = async (file: any) => {
  if (!taskForm.value.id) return;
  const ok = await confirm({
    title: "Datei löschen",
    message: `„${file.original_name}“ löschen?`,
    confirmLabel: "Ja, löschen",
    variant: "danger",
  });
  if (!ok) return;

  deletingFileId.value = file.id;
  try {
    const result = await api.tasks.deleteFile(taskForm.value.id, file.id);
    if (result !== null) {
      existingFiles.value = existingFiles.value.filter((f) => f.id !== file.id);
    }
  } finally {
    deletingFileId.value = null;
  }
};

const uploadPendingFiles = async (taskId: number) => {
  for (const file of pendingFiles.value) {
    await api.tasks.uploadFile(taskId, file);
  }
  pendingFiles.value = [];
};

const saveTask = async () => {
  if (!taskForm.value.title?.trim()) return;

  saving.value = true;
  try {
    const payload = {
      title: taskForm.value.title.trim(),
      description: taskForm.value.description || null,
      sort_order: Number(taskForm.value.sort_order) || 0,
      is_active: !!taskForm.value.is_active,
      resource_ids: taskForm.value.resource_ids,
    };

    let result;
    if (editingTask.value && taskForm.value.id) {
      result = await api.tasks.update(taskForm.value.id, payload);
    } else {
      result = await api.tasks.create(payload);
    }

    if (result?.id && pendingFiles.value.length) {
      await uploadPendingFiles(result.id);
    }

    if (result) {
      await loadTasks();
      showDialog.value = false;
    }
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
};

const deleteTask = async (task: any) => {
  const confirmed = await confirm({
    title: "Task löschen?",
    message: `Möchten Sie „${task.title}“ wirklich löschen?`,
    confirmLabel: "Ja, löschen",
    variant: "danger",
  });
  if (!confirmed) return;
  await api.tasks.delete(task.id);
  await loadTasks();
};

onMounted(async () => {
  await Promise.all([loadTasks(), loadResources()]);
});
</script>
