<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">Services</h1>
      <button
        class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
        @click="openCreateModal"
      >
        Neuer Service
      </button>
    </div>

    <!-- Services Table -->
    <table class="w-full rounded-lg overflow-hidden border border-black/10 shadow-sm bg-white">
      <thead class="bg-neutral-50">
        <tr class="text-left">
          <th class="px-3 py-1.5 text-sm">Name</th>
          <th class="px-3 py-1.5 text-sm">Preis / Einheit</th>
          <th class="px-3 py-1.5 text-sm">Beschreibung</th>
          <th class="px-3 py-1.5 text-sm text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="service in services" :key="service.id" class="border-t border-black/10">
          <td class="px-3 py-2 text-sm font-medium">{{ service.name }}</td>
          <td class="px-3 py-2 text-sm">{{ service.price }} €</td>
          <td class="px-3 py-2 text-sm text-gray-500 truncate max-w-xs">{{ service.description }}</td>
          <td class="px-3 py-2 text-sm flex items-center gap-1 justify-end">
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="editService(service)"
              title="Bearbeiten"
            >
              <UIcon name="i-lucide-edit" size="16" />
            </div>
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-red-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="deleteService(service)"
              title="Löschen"
            >
              <UIcon name="i-lucide-trash-2" size="16" />
            </div>
          </td>
        </tr>
        <tr v-if="services.length === 0">
          <td colspan="4" class="px-3 py-4 text-sm text-center text-neutral-500">
            Keine Services angelegt
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div class="p-6">
          <h3 class="text-lg font-bold mb-4">{{ selectedService ? 'Service bearbeiten' : 'Neuer Service' }}</h3>
          
          <form @submit.prevent="saveService">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Name</label>
                <input v-model="form.name" type="text" class="w-full border rounded p-2 text-sm" required placeholder="z.B. Beamer, Catering" />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1">Preis (€)</label>
                <input v-model.number="form.price" type="number" step="0.01" class="w-full border rounded p-2 text-sm" required />
                <p class="text-xs text-gray-500 mt-1">Einzelpreis pro Einheit</p>
              </div>

              <div>
                <label class="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea v-model="form.description" class="w-full border rounded p-2 text-sm" rows="3"></textarea>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-2">
              <button type="button" @click="showModal = false" class="px-4 py-2 text-sm border rounded hover:bg-gray-50">Abbrechen</button>
              <button type="submit" class="px-4 py-2 text-sm bg-yellow-400 hover:bg-yellow-500 text-white rounded font-bold">Speichern</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const services = ref([]);
const showModal = ref(false);
const selectedService = ref(null);
const form = ref({
  name: '',
  price: 0,
  description: ''
});

const fetchServices = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/services`);
        if (res.ok) {
            services.value = await res.json();
        }
    } catch (e) {
        console.error(e);
    }
};

const openCreateModal = () => {
    selectedService.value = null;
    form.value = { name: '', price: 0, description: '' };
    showModal.value = true;
};

const editService = (item) => {
    selectedService.value = item;
    form.value = { ...item };
    showModal.value = true;
};

const saveService = async () => {
    try {
        const url = selectedService.value 
            ? `${import.meta.env.VITE_INTERNAL_API_URL}/services/${selectedService.value.id}`
            : `${import.meta.env.VITE_INTERNAL_API_URL}/services`;
        
        const method = selectedService.value ? 'PATCH' : 'POST';
        
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            },
            body: JSON.stringify(form.value)
        });
        
        if (res.ok) {
            fetchServices();
            showModal.value = false;
        } else {
            alert('Fehler beim Speichern');
        }
    } catch (e) {
        console.error(e);
        alert('Netzwerkfehler');
    }
};

const deleteService = async (item) => {
    if (!confirm('Wirklich löschen?')) return;
    try {
         const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/services/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
        });
        if (res.ok) fetchServices();
    } catch (e) {
        console.error(e);
    }
};

onMounted(() => fetchServices());
</script>
