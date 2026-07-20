<script setup lang="ts">
import { ref, onMounted } from 'vue';

const meterApi = useMeterApi();

const meters = ref<any[]>([]);
const groups = ref<any[]>([]);
const loading = ref(false);

const columns = [
  { accessorKey: 'meter_id', header: 'Meter ID' },
  { accessorKey: 'label', header: 'Bezeichnung' },
  { accessorKey: 'medium_code', header: 'Medium Code' },
  { id: 'group', header: 'Gruppe' },
  { accessorKey: 'aes_key', header: 'AES Key' },
  { accessorKey: 'readings.length', header: 'Anzahl Zählerstände' },
  { id: 'actions' }
];

// Load init
const loadMeters = async () => {
  loading.value = true;
  meters.value = await meterApi.getMeters();
  loading.value = false;
};

const loadGroups = async () => {
  groups.value = await meterApi.getMeterGroups();
};

onMounted(() => {
  loadMeters();
  loadGroups();
});

// Single Create / Edit Modal
const isModalOpen = ref(false);
const isEditing = ref(false);
const formState = ref({
  meter_id: '',
  label: '',
  medium_code: '',
  aes_key: '',
  estate_number: '',
  estate_description: '',
  meter_group_id: null as number | null,
  active: true,
  _originalId: ''
});

const openCreateModal = () => {
  isEditing.value = false;
  formState.value = { meter_id: '', label: '', medium_code: '', aes_key: '', estate_number: '', estate_description: '', meter_group_id: null, active: true, _originalId: '' };
  isModalOpen.value = true;
};

const openEditModal = (meter: any) => {
  isEditing.value = true;
  formState.value = {
    meter_id: meter.meter_id,
    label: meter.label || '',
    medium_code: meter.medium_code || '',
    aes_key: meter.aes_key || '',
    estate_number: meter.estate_number || '',
    estate_description: meter.estate_description || '',
    meter_group_id: meter.meter_group_id || null,
    active: meter.active,
    _originalId: meter.meter_id
  };
  isModalOpen.value = true;
};

const saveMeter = async () => {
  const payload = {
    meter_id: formState.value.meter_id,
    label: formState.value.label,
    medium_code: formState.value.medium_code,
    aes_key: formState.value.aes_key,
    estate_number: formState.value.estate_number,
    estate_description: formState.value.estate_description,
    meter_group_id: formState.value.meter_group_id,
    active: formState.value.active
  };

  if (isEditing.value) {
    await meterApi.updateMeter(formState.value._originalId, payload);
  } else {
    await meterApi.createMeter(payload);
  }
  isModalOpen.value = false;
  loadMeters();
};

const groupForm = ref({
  id: null as number | null,
  code: '',
  name: '',
  active: true
});
const groupModalOpen = ref(false);
const isEditingGroup = ref(false);

const openCreateGroupModal = () => {
  isEditingGroup.value = false;
  groupForm.value = { id: null, code: '', name: '', active: true };
  groupModalOpen.value = true;
};

const openEditGroupModal = (group: any) => {
  isEditingGroup.value = true;
  groupForm.value = {
    id: group.id,
    code: group.code || '',
    name: group.name || '',
    active: !!group.active
  };
  groupModalOpen.value = true;
};

const saveGroup = async () => {
  const payload = {
    code: groupForm.value.code,
    name: groupForm.value.name,
    active: groupForm.value.active
  };
  if (isEditingGroup.value && groupForm.value.id) {
    await meterApi.updateMeterGroup(groupForm.value.id, payload);
  } else {
    await meterApi.createMeterGroup(payload);
  }
  groupModalOpen.value = false;
  await loadGroups();
  await loadMeters();
};

const deleteGroup = async (group: any) => {
  const confirmed = window.confirm(`Gruppe ${group.code} wirklich löschen?`);
  if (!confirmed) return;
  await meterApi.deleteMeterGroup(group.id);
  await loadGroups();
  await loadMeters();
};

const deleteMeter = async (meter_id: string) => {
  const confirmed = window.confirm(`Möchten Sie den Zähler ${meter_id} wirklich löschen?`);
  if (confirmed) {
    await meterApi.deleteMeter(meter_id);
    loadMeters();
  }
};

const downloadCSV = async (meter_id: string) => {
  await meterApi.downloadCSV(meter_id);
};

// Mass Import Modal
const isImportModalOpen = ref(false);
const importText = ref('');

const openImportModal = () => {
  importText.value = '';
  isImportModalOpen.value = true;
};

const executeImport = async () => {
  try {
    let itemsToImport: any[] = [];

    // Try JSON parsing first
    try {
      itemsToImport = JSON.parse(importText.value);
      if (!Array.isArray(itemsToImport)) {
        // Wrap single object in array if needed
        itemsToImport = [itemsToImport];
      }
    } catch (e) {
      // Fallback CSV (assuming meter_id,aes_key,medium_code,label,estate_number,estate_description)
      const lines = importText.value.split('\n').filter(l => l.trim().length > 0);
      itemsToImport = lines.map(line => {
        const parts = line.split(',');
        return {
          meter_id: parts[0]?.trim(),
          aes_key: parts[1]?.trim() || '',
          medium_code: parts[2]?.trim() || '',
          label: parts[3]?.trim() || '',
          estate_number: parts[4]?.trim() || '',
          estate_description: parts[5]?.trim() || '',
          active: true
        };
      });
    }

    if (itemsToImport.length > 0) {
      await meterApi.massImportMeters(itemsToImport);
      isImportModalOpen.value = false;
      loadMeters();
    }
  } catch (e) {
    alert("Fehler beim Parsen der Import-Daten");
  }
};

</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Zählerverwaltung (AES Keys)</h1>
      <div class="flex gap-2">
        <UiButton color="neutral" variant="solid" icon="i-lucide-upload" @click="openImportModal">
          Mass Import
        </UiButton>
        <UiButton color="primary" variant="solid" icon="i-lucide-plus" @click="openCreateModal">
          Neuer Zähler
        </UiButton>
      </div>
    </div>

    <UiCard class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="font-semibold">Meter-Gruppen</h2>
          <UiButton color="primary" variant="solid" icon="i-lucide-plus" size="xs" @click="openCreateGroupModal">
            Neue Gruppe
          </UiButton>
        </div>
      </template>
      <div v-if="groups.length === 0" class="text-sm text-gray-500">
        Noch keine Gruppen vorhanden.
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        <div v-for="group in groups" :key="group.id" class="border rounded p-2 flex items-center justify-between">
          <div>
            <div class="font-medium">{{ group.code }}</div>
            <div class="text-xs text-gray-500">{{ group.name || 'Ohne Name' }}</div>
          </div>
          <div class="flex gap-1">
            <UiButton color="neutral" variant="ghost" icon="i-lucide-pencil" size="xs" @click="openEditGroupModal(group)" />
            <UiButton color="error" variant="ghost" icon="i-lucide-trash-2" size="xs" @click="deleteGroup(group)" />
          </div>
        </div>
      </div>
    </UiCard>

    <div class="flex-1 flex flex-col min-h-0 overflow-hidden relative">
      <UiTable :data="meters" :columns="columns" :loading="loading" class="h-full">
        <template #group-cell="{ row }">
          <span class="text-sm">
            {{ row.original.group?.code || 'Ohne Gruppe' }}
          </span>
        </template>
        <template #active-cell="{ row }">
          <UiBadge :color="row.original.active ? 'primary' : 'error'">
            {{ row.original.active ? 'Aktiv' : 'Inaktiv' }}
          </UiBadge>
        </template>
        <template #aes_key-cell="{ row }">
          <span class="font-mono text-xs">{{ row.original.aes_key }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UiButton color="neutral" variant="ghost" icon="i-lucide-pencil" size="xs"
              @click="openEditModal(row.original)" />
            <UiButton color="neutral" variant="ghost" icon="i-lucide-download" size="xs"
              @click="downloadCSV(row.original.meter_id)" />
            <UiButton color="error" variant="ghost" icon="i-lucide-trash-2" size="xs"
              @click="deleteMeter(row.original.meter_id)" />
          </div>
        </template>
      </UiTable>
    </div>

    <!-- Single Create/Edit Modal -->
    <UiModal :open="isModalOpen" @update:open="isModalOpen = $event">
      <template #content>
        <div class="dialog-panel max-w-lg pointer-events-auto">
          <div class="dialog-header">
            <h3 class="dialog-title">
              {{ isEditing ? 'Zähler bearbeiten' : 'Zähler anlegen' }}
            </h3>
            <button
              type="button"
              class="dialog-close"
              aria-label="Schließen"
              @click="isModalOpen = false"
            >
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <form @submit.prevent="saveMeter">
            <div class="dialog-body space-y-4">
              <div>
                <label class="dialog-label">
                  Meter ID <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formState.meter_id"
                  placeholder="12345678"
                  :disabled="isEditing"
                  required
                  class="dialog-input"
                />
              </div>

              <div>
                <label class="dialog-label">Bezeichnung</label>
                <input
                  v-model="formState.label"
                  placeholder="Heizung EG"
                  class="dialog-input"
                />
              </div>

              <div>
                <label class="dialog-label">Medium Code</label>
                <input
                  v-model="formState.medium_code"
                  placeholder="z.b. 04 für Wärme"
                  class="dialog-input"
                />
              </div>

              <div>
                <label class="dialog-label">AES Key</label>
                <input
                  v-model="formState.aes_key"
                  placeholder="32 Zeichen Hex..."
                  class="dialog-input font-mono text-xs"
                />
              </div>

              <div>
                <label class="dialog-label">Liegenschaftsnummer</label>
                <input
                  v-model="formState.estate_number"
                  placeholder="Bsp: 1234.56"
                  class="dialog-input"
                />
              </div>

              <div>
                <label class="dialog-label">Liegenschaftsbeschreibung</label>
                <input
                  v-model="formState.estate_description"
                  placeholder="Bsp: Wohnhaus Nord"
                  class="dialog-input"
                />
              </div>

              <div>
                <label class="dialog-label">Gruppe</label>
                <select v-model="formState.meter_group_id" class="dialog-input">
                  <option :value="null">Ohne Gruppe</option>
                  <option v-for="group in groups" :key="group.id" :value="group.id">
                    {{ group.code }}{{ group.name ? ` - ${group.name}` : '' }}
                  </option>
                </select>
              </div>

              <div class="flex flex-row items-center justify-between rounded-none border border-neutral-200 p-3">
                <div class="space-y-0.5">
                  <label class="text-sm font-medium text-neutral-900">Aktiv</label>
                  <p class="dialog-desc !mt-0">Dieser Zähler wird aktiv verwendet</p>
                </div>
                <UiToggle v-model="formState.active" />
              </div>
            </div>

            <div class="dialog-footer">
              <button type="button" @click="isModalOpen = false" class="btn-dialog-cancel">Abbrechen</button>
              <button type="submit" class="btn-dialog-primary">Speichern</button>
            </div>
          </form>
        </div>
      </template>
    </UiModal>

    <UiModal :open="groupModalOpen" @update:open="groupModalOpen = $event">
      <template #content>
        <div class="dialog-panel max-w-lg pointer-events-auto">
          <div class="dialog-header">
            <h3 class="dialog-title">
              {{ isEditingGroup ? 'Gruppe bearbeiten' : 'Gruppe anlegen' }}
            </h3>
            <button
              type="button"
              class="dialog-close"
              aria-label="Schließen"
              @click="groupModalOpen = false"
            >
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <form @submit.prevent="saveGroup">
            <div class="dialog-body space-y-4">
              <div>
                <label class="dialog-label">
                  Gruppen-Code <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="groupForm.code"
                  placeholder="301.05.002"
                  required
                  class="dialog-input"
                />
              </div>
              <div>
                <label class="dialog-label">Name</label>
                <input
                  v-model="groupForm.name"
                  placeholder="Optional"
                  class="dialog-input"
                />
              </div>
            </div>
            <div class="dialog-footer">
              <button type="button" @click="groupModalOpen = false" class="btn-dialog-cancel">Abbrechen</button>
              <button type="submit" class="btn-dialog-primary">Speichern</button>
            </div>
          </form>
        </div>
      </template>
    </UiModal>

    <UiModal :open="isImportModalOpen" @update:open="isImportModalOpen = $event">
      <template #content>
        <div class="dialog-panel max-w-lg pointer-events-auto">
          <div class="dialog-header">
            <h3 class="dialog-title">Zähler Massenimport</h3>
            <button
              type="button"
              class="dialog-close"
              aria-label="Schließen"
              @click="isImportModalOpen = false"
            >
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <div class="dialog-body space-y-4">
            <div>
              <label class="dialog-label">Daten (JSON/CSV)</label>
              <p class="dialog-desc mb-2">
                Fügen Sie ein JSON Array oder CSV Format (meter_id,aes_key,medium_code,label,estate_number,estate_description) ein.
              </p>
              <textarea
                v-model="importText"
                class="dialog-input min-h-[200px]"
                placeholder="meter_id, aes_key, medium_code, label, estate_number, estate_description\n..."
              ></textarea>
            </div>
          </div>
          <div class="dialog-footer">
            <button type="button" @click="isImportModalOpen = false" class="btn-dialog-cancel">Abbrechen</button>
            <button type="button" @click="executeImport" class="btn-dialog-primary">Importieren</button>
          </div>
        </div>
      </template>
    </UiModal>

  </div>
</template>
