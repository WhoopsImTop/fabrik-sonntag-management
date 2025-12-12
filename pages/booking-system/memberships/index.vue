<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">Mitgliedschaften</h1>
      <button
        class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
        @click="openCreateModal"
      >
        Neue Mitgliedschaft
      </button>
    </div>

    <!-- Memberships Table -->
    <table class="w-full rounded-lg overflow-hidden border border-black/10 shadow-sm bg-white">
      <thead class="bg-neutral-50">
        <tr class="text-left">
          <th class="px-3 py-1.5 text-sm">Name</th>
          <th class="px-3 py-1.5 text-sm">Preis</th>
          <th class="px-3 py-1.5 text-sm">Intervall</th>
          <th class="px-3 py-1.5 text-sm">Beschreibung</th>
          <th class="px-3 py-1.5 text-sm text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="membership in memberships" :key="membership.id" class="border-t border-black/10">
          <td class="px-3 py-2 text-sm font-medium">{{ membership.name }}</td>
          <td class="px-3 py-2 text-sm">{{ membership.price }} €</td>
          <td class="px-3 py-2 text-sm">{{ formatInterval(membership.interval) }}</td>
          <td class="px-3 py-2 text-sm text-gray-500 truncate max-w-xs">{{ membership.description }}</td>
          <td class="px-3 py-2 text-sm flex items-center gap-1 justify-end">
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="editMembership(membership)"
              title="Bearbeiten"
            >
              <UIcon name="i-lucide-edit" size="16" />
            </div>
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-red-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="deleteMembership(membership)"
              title="Löschen"
            >
              <UIcon name="i-lucide-trash-2" size="16" />
            </div>
          </td>
        </tr>
        <tr v-if="memberships.length === 0">
          <td colspan="5" class="px-3 py-4 text-sm text-center text-neutral-500">
            Keine Mitgliedschaften angelegt
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Generic Modal for Create/Edit -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div class="p-6">
          <h3 class="text-lg font-bold mb-4">{{ selectedMembership ? 'Mitgliedschaft bearbeiten' : 'Neue Mitgliedschaft' }}</h3>
          
          <form @submit.prevent="saveMembership">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">Name</label>
                <input v-model="form.name" type="text" class="w-full border rounded p-2 text-sm" required />
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">Preis (€)</label>
                  <input v-model.number="form.price" type="number" step="0.01" class="w-full border rounded p-2 text-sm" required />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1">Intervall</label>
                  <select v-model="form.interval" class="w-full border rounded p-2 text-sm">
                    <option value="month">Monatlich</option>
                    <option value="year">Jährlich</option>
                  </select>
                </div>
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
import { ref, onMounted } from 'vue'; // Explicit import if needed

const memberships = ref([]);
const showModal = ref(false);
const selectedMembership = ref(null);
const form = ref({
  name: '',
  price: 0,
  interval: 'month',
  description: ''
});

const fetchMemberships = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/memberships`);
    if (res.ok) {
      memberships.value = await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch memberships:', error);
  }
};

const openCreateModal = () => {
  selectedMembership.value = null;
  form.value = { name: '', price: 0, interval: 'month', description: '' };
  showModal.value = true;
};

const editMembership = (item) => {
  selectedMembership.value = item;
  form.value = { ...item };
  showModal.value = true;
};

const saveMembership = async () => {
  try {
    const url = selectedMembership.value 
      ? `${import.meta.env.VITE_INTERNAL_API_URL}/memberships/${selectedMembership.value.id}`
      : `${import.meta.env.VITE_INTERNAL_API_URL}/memberships`;
      
    const method = selectedMembership.value ? 'PATCH' : 'POST';
    
    console.log('Sending payload:', JSON.stringify(form.value));

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      },
      body: JSON.stringify(form.value)
    });

    if (res.ok) {
      showModal.value = false;
      fetchMemberships();
    } else {
        const err = await res.json();
        console.error('Save failed:', err);
        alert(`Fehler beim Speichern: ${err.error || res.statusText}`);
    }
  } catch (error) {
    console.error(error);
    alert('Netzwerkfehler beim Speichern');
  }
};

const deleteMembership = async (item) => {
  if (!confirm(`Soll die Mitgliedschaft "${item.name}" wirklich gelöscht werden?`)) return;
  
  try {
    const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/memberships/${item.id}`, {
      method: 'DELETE',
        headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      }
    });
    
    if (res.ok) {
      fetchMemberships();
    } else {
      alert('Fehler beim Löschen');
    }
  } catch (error) {
    console.error(error);
  }
};

const formatInterval = (val) => {
  const map = { month: 'Monatlich', year: 'Jährlich' };
  return map[val] || val;
};

onMounted(() => {
  fetchMemberships();
});
</script>
