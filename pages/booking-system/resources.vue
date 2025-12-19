<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">Buchungssystem Resourcen</h1>
      <button
        class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
        @click="openModal"
      >
        Resource hinzufügen
      </button>
    </div>

    <table
      class="w-full rounded-lg overflow-hidden border border-black/10 shadow-sm"
    >
      <thead class="bg-neutral-50">
        <tr class="text-left">
          <th class="px-3 py-1.5 text-sm">Name</th>
          <th class="px-3 py-1.5 text-sm">Kategorie</th>
          <th class="px-3 py-1.5 text-sm">Kapazität</th>
          <th class="px-3 py-1.5 text-sm">Preispläne</th>
          <th class="px-3 py-1.5 text-sm text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in resourceData" :key="item.id">
          <td class="px-3 py-1.5 text-sm">{{ item.name }}</td>
          <td class="px-3 py-1.5 text-sm">{{ item.category?.name || 'N/A' }}</td>
          <td class="px-3 py-1.5 text-sm">{{ item.capacity }}</td>
          <td class="px-3 py-1.5 text-sm">
            <span
              v-for="plan in item.pricingPlans"
              :key="plan.id"
              class="inline-block bg-blue-100 text-blue-900 px-2 py-0.5 rounded-lg border border-black/10 text-xs mr-1"
            >
              {{ plan.interval }}: €{{ plan.price }}
            </span>
            <span v-if="!item.pricingPlans?.length" class="text-neutral-400">
              Keine Preise
            </span>
          </td>
          <td class="px-3 py-1.5 text-sm flex items-center gap-1 justify-end">
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="editResource(item)"
            >
              <img src="/edit.svg" alt="edit" title="edit" class="w-4 h-4" />
            </div>
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-red-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="deleteResource(item)"
            >
              <img
                src="/trash.svg"
                alt="delete"
                title="delete"
                class="w-4 h-4"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <app-dialog-resource-form
      v-if="showResourceModal"
      :form="selectedFormData"
      @closeModal="closeModal"
    />
  </div>
</template>

<script setup>
const resourceData = ref([]);
const selectedFormData = ref(null);
const showResourceModal = ref(false);

const closeModal = () => {
  showResourceModal.value = false;
  getResources(); // Refresh list after closing modal
};

const openModal = () => {
  selectedFormData.value = null; // Reset form for new resource
  showResourceModal.value = true;
};

const getResources = async () => {
  try {
    const res = await fetch(
      import.meta.env.VITE_INTERNAL_API_URL + '/admin/resources',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      }
    );
    const data = await res.json();
    resourceData.value = data;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
    resourceData.value = [];
  }
};

const deleteResource = async (item) => {
  if (!confirm(`Möchten Sie die Resource "${item.name}" wirklich löschen?`)) {
    return;
  }

  try {
    const res = await fetch(
      import.meta.env.VITE_INTERNAL_API_URL + '/admin/resources/' + item.id,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      }
    );

    if (res.ok) {
      alert('Resource erfolgreich gelöscht');
      getResources();
    } else {
      const error = await res.json();
      alert('Fehler beim Löschen: ' + (error.error || 'Unbekannter Fehler'));
    }
  } catch (error) {
    console.error('Delete error:', error);
    alert('Fehler beim Löschen der Resource');
  }
};

const editResource = (item) => {
  selectedFormData.value = item;
  showResourceModal.value = true;
};

onMounted(() => {
  getResources();
});
</script>

<style></style>
