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
        <UButton color="neutral" variant="solid" icon="i-lucide-upload" @click="openImportModal">
          Mass Import
        </UButton>
        <UButton color="primary" variant="solid" icon="i-lucide-plus" @click="openCreateModal">
          Neuer Zähler
        </UButton>
      </div>
    </div>

    <UCard class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <h2 class="font-semibold">Meter-Gruppen</h2>
          <UButton color="primary" variant="solid" icon="i-lucide-plus" size="xs" @click="openCreateGroupModal">
            Neue Gruppe
          </UButton>
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
            <UButton color="neutral" variant="ghost" icon="i-lucide-pencil" size="xs" @click="openEditGroupModal(group)" />
            <UButton color="error" variant="ghost" icon="i-lucide-trash-2" size="xs" @click="deleteGroup(group)" />
          </div>
        </div>
      </div>
    </UCard>

    <div
      class="flex-1 flex flex-col min-h-0 bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 shadow sm:rounded-lg overflow-hidden relative">
      <UTable :data="meters" :columns="columns" :loading="loading" class="h-full">
        <template #group-cell="{ row }">
          <span class="text-sm">
            {{ row.original.group?.code || 'Ohne Gruppe' }}
          </span>
        </template>
        <template #active-cell="{ row }">
          <UBadge :color="row.original.active ? 'primary' : 'error'">
            {{ row.original.active ? 'Aktiv' : 'Inaktiv' }}
          </UBadge>
        </template>
        <template #aes_key-cell="{ row }">
          <span class="font-mono text-xs">{{ row.original.aes_key }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton color="neutral" variant="ghost" icon="i-lucide-pencil" size="xs"
              @click="openEditModal(row.original)" />
            <UButton color="neutral" variant="ghost" icon="i-lucide-download" size="xs"
              @click="downloadCSV(row.original.meter_id)" />
            <UButton color="error" variant="ghost" icon="i-lucide-trash-2" size="xs"
              @click="deleteMeter(row.original.meter_id)" />
          </div>
        </template>
      </UTable>
    </div>

    <!-- Single Create/Edit Modal -->
    <UModal :open="isModalOpen" @update:open="isModalOpen = $event">
      <template #content>
        <div
          class="sm:max-w-lg w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col pointer-events-auto">
          <div class="flex items-center justify-between p-4 sm:px-6">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ isEditing ? 'Zähler bearbeiten' : 'Zähler anlegen' }}
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
              @click="isModalOpen = false" />
          </div>
          <form @submit.prevent="saveMeter" class="space-y-4 p-4 sm:px-6 pb-6 opacity-100 z-50 pointer-events-auto">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
                Meter ID <span class="text-red-500">*</span>
              </label>
              <input v-model="formState.meter_id" placeholder="12345678" :disabled="isEditing" required
                class="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">Bezeichnung</label>
              <input v-model="formState.label" placeholder="Heizung EG"
                class="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">Medium Code</label>
              <input v-model="formState.medium_code" placeholder="z.b. 04 für Wärme"
                class="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">AES Key</label>
              <input v-model="formState.aes_key" placeholder="32 Zeichen Hex..." 
                class="font-mono flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-xs shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">Liegenschaftsnummer</label>
              <input v-model="formState.estate_number" placeholder="Bsp: 1234.56"
                class="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">Liegenschaftsbeschreibung</label>
              <input v-model="formState.estate_description" placeholder="Bsp: Wohnhaus Nord"
                class="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">Gruppe</label>
              <select v-model="formState.meter_group_id"
                class="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 dark:border-gray-800 dark:focus-visible:ring-gray-300">
                <option :value="null">Ohne Gruppe</option>
                <option v-for="group in groups" :key="group.id" :value="group.id">
                  {{ group.code }}{{ group.name ? ` - ${group.name}` : '' }}
                </option>
              </select>
            </div>

            <div class="flex flex-row items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 p-3 shadow-sm">
              <div class="space-y-0.5">
                <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">Aktiv</label>
                <p class="text-[0.8rem] text-gray-500 dark:text-gray-400">Dieser Zähler wird aktiv verwendet</p>
              </div>
              <UToggle v-model="formState.active" />
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button type="button" @click="isModalOpen = false" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-transparent hover:bg-gray-100 hover:text-gray-900 h-9 px-4 py-2 dark:border-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-50 shadow-sm">Abbrechen</button>
              <button type="submit" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-gray-50 hover:bg-gray-900/90 h-9 px-4 py-2 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 shadow">Speichern</button>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <UModal :open="groupModalOpen" @update:open="groupModalOpen = $event">
      <template #content>
        <div class="sm:max-w-lg w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col pointer-events-auto">
          <div class="flex items-center justify-between p-4 sm:px-6">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ isEditingGroup ? 'Gruppe bearbeiten' : 'Gruppe anlegen' }}
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
              @click="groupModalOpen = false" />
          </div>
          <form @submit.prevent="saveGroup" class="space-y-4 p-4 sm:px-6 pb-6">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
                Gruppen-Code <span class="text-red-500">*</span>
              </label>
              <input v-model="groupForm.code" placeholder="301.05.002" required
                class="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">Name</label>
              <input v-model="groupForm.name" placeholder="Optional"
                class="flex h-9 w-full rounded-md border border-gray-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300" />
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button type="button" @click="groupModalOpen = false" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-200 bg-transparent hover:bg-gray-100 h-9 px-4 py-2 dark:border-gray-800 dark:hover:bg-gray-800 shadow-sm">Abbrechen</button>
              <button type="submit" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-gray-900 text-gray-50 hover:bg-gray-900/90 h-9 px-4 py-2 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 shadow">Speichern</button>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <UModal :open="isImportModalOpen" @update:open="isImportModalOpen = $event">
      <template #content>
        <div
          class="sm:max-w-lg w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col pointer-events-auto">
          <div class="flex items-center justify-between p-4 sm:px-6">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Zähler Massenimport
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1"
              @click="isImportModalOpen = false" />
          </div>
          <div class="space-y-4 p-4 sm:px-6 pb-6 opacity-100 z-50 pointer-events-auto">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
                Daten (JSON/CSV)
              </label>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Fügen Sie ein JSON Array oder CSV Format (meter_id,aes_key,medium_code,label,estate_number,estate_description) ein.
              </p>
              <textarea v-model="importText" 
                class="flex min-h-[200px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:placeholder:text-gray-400 dark:focus-visible:ring-gray-300"
                placeholder="meter_id, aes_key, medium_code, label, estate_number, estate_description\n..."></textarea>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button type="button" @click="isImportModalOpen = false" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-transparent hover:bg-gray-100 hover:text-gray-900 h-9 px-4 py-2 dark:border-gray-800 dark:hover:bg-gray-800 dark:hover:text-gray-50 shadow-sm">Abbrechen</button>
              <button type="button" @click="executeImport" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 bg-gray-900 text-gray-50 hover:bg-gray-900/90 h-9 px-4 py-2 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 shadow">Importieren</button>
            </div>
          </div>
        </div>
      </template>
    </UModal>

  </div>
</template>
