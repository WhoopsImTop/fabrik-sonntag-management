<script setup lang="ts">
import { ref, onMounted } from 'vue';

const meterApi = useMeterApi();

const meters = ref<any[]>([]);
const loading = ref(false);

const columns = [
  { accessorKey: 'meter_id', header: 'Meter ID' },
  { accessorKey: 'label', header: 'Bezeichnung' },
  { accessorKey: 'medium_code', header: 'Medium Code' },
  { accessorKey: 'aes_key', header: 'AES Key' },
  { accessorKey: 'active', header: 'Status' },
  { id: 'actions' }
];

// Load init
const loadMeters = async () => {
  loading.value = true;
  meters.value = await meterApi.getMeters();
  loading.value = false;
};

onMounted(() => {
  loadMeters();
});

// Single Create / Edit Modal
const isModalOpen = ref(false);
const isEditing = ref(false);
const formState = ref({
  meter_id: '',
  label: '',
  medium_code: '',
  aes_key: '',
  active: true,
  _originalId: ''
});

const openCreateModal = () => {
  isEditing.value = false;
  formState.value = { meter_id: '', label: '', medium_code: '', aes_key: '', active: true, _originalId: '' };
  isModalOpen.value = true;
};

const openEditModal = (meter: any) => {
  isEditing.value = true;
  formState.value = { 
      meter_id: meter.meter_id, 
      label: meter.label || '', 
      medium_code: meter.medium_code || '', 
      aes_key: meter.aes_key || '', 
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

const deleteMeter = async (meter_id: string) => {
  const confirmed = window.confirm(`Möchten Sie den Zähler ${meter_id} wirklich löschen?`);
  if (confirmed) {
    await meterApi.deleteMeter(meter_id);
    loadMeters();
  }
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
           if(!Array.isArray(itemsToImport)) {
               // Wrap single object in array if needed
               itemsToImport = [itemsToImport];
           }
        } catch(e) {
           // Fallback CSV (assuming meter_id,aes_key,medium_code,label)
           const lines = importText.value.split('\n').filter(l => l.trim().length > 0);
           itemsToImport = lines.map(line => {
               const parts = line.split(',');
               return {
                   meter_id: parts[0]?.trim(),
                   aes_key: parts[1]?.trim() || '',
                   medium_code: parts[2]?.trim() || '',
                   label: parts[3]?.trim() || '',
                   active: true
               };
           });
        }
        
        if(itemsToImport.length > 0) {
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
        <UButton
          color="neutral"
          variant="solid"
          icon="i-lucide-upload"
          @click="openImportModal"
        >
          Mass Import
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-plus"
          @click="openCreateModal"
        >
          Neuer Zähler
        </UButton>
      </div>
    </div>

    <div class="flex-1 flex flex-col min-h-0 bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 shadow sm:rounded-lg overflow-hidden relative">
      <UTable
        :data="meters"
        :columns="columns"
        :loading="loading"
        class="h-full"
      >
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
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              size="xs"
              @click="openEditModal(row.original)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              size="xs"
              @click="deleteMeter(row.original.meter_id)"
            />
          </div>
        </template>
      </UTable>
    </div>
    
    <!-- Single Create/Edit Modal -->
    <UModal :open="isModalOpen" @update:open="isModalOpen = $event">
      <template #content>
        <div class="sm:max-w-lg w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col pointer-events-auto">
          <div class="flex items-center justify-between p-4 sm:px-6">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ isEditing ? 'Zähler bearbeiten' : 'Zähler anlegen' }}
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isModalOpen = false" />
          </div>
          <form @submit.prevent="saveMeter" class="space-y-4 p-4 sm:px-6 pb-6 opacity-100 z-50 pointer-events-auto">
              <UFormGroup label="Meter ID" required>
                  <UInput v-model="formState.meter_id" placeholder="12345678" :disabled="isEditing" />
              </UFormGroup>
              
              <UFormGroup label="Bezeichnung">
                  <UInput v-model="formState.label" placeholder="Heizung EG" />
              </UFormGroup>

              <UFormGroup label="Medium Code">
                  <UInput v-model="formState.medium_code" placeholder="z.b. 04 für Wärme" />
              </UFormGroup>

              <UFormGroup label="AES Key">
                  <UInput v-model="formState.aes_key" placeholder="32 Zeichen Hex..." class="font-mono text-xs" />
              </UFormGroup>
              
              <UFormGroup label="Aktiv">
                  <UToggle v-model="formState.active" />
              </UFormGroup>

              <div class="flex justify-end gap-3 mt-4">
                  <UButton color="neutral" variant="soft" @click="isModalOpen = false">Abbrechen</UButton>
                  <UButton type="submit" color="primary">Speichern</UButton>
              </div>
          </form>
        </div>
      </template>
    </UModal>

    <UModal :open="isImportModalOpen" @update:open="isImportModalOpen = $event">
      <template #content>
        <div class="sm:max-w-lg w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden flex flex-col pointer-events-auto">
          <div class="flex items-center justify-between p-4 sm:px-6">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Zähler Massenimport
            </h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isImportModalOpen = false" />
          </div>
          <div class="space-y-4 p-4 sm:px-6 pb-6 opacity-100 z-50 pointer-events-auto">
              <p class="text-sm text-gray-500">
                  Fügen Sie ein JSON Array oder CSV Format (meter_id,aes_key,medium_code,label) ein.
              </p>
              <UFormGroup label="Daten (JSON/CSV)">
                  <UTextarea v-model="importText" class="min-h-[200px]" placeholder="meter_id, aes_key, medium_code, label\n..." />
              </UFormGroup>
  
              <div class="flex justify-end gap-3 mt-4">
                  <UButton color="neutral" variant="soft" @click="isImportModalOpen = false">Abbrechen</UButton>
                  <UButton color="primary" @click="executeImport">Importieren</UButton>
              </div>
          </div>
        </div>
      </template>
    </UModal>

  </div>
</template>
