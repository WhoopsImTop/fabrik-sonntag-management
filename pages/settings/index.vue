<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Einstellungen</h1>
    
    <div class="bg-white rounded-lg shadow-sm border border-black/5 p-6 max-w-xl">
      
      <!-- Invoice Settings -->
      <div class="mb-6">
        <h2 class="font-bold text-gray-700 mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-file-text" size="20" />
          Rechnungseinstellungen
        </h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Rechnungsnummer Startwert</label>
            <div class="flex gap-2">
              <input 
                v-model.number="invoiceCounter" 
                type="number" 
                class="flex-1 p-3 border rounded text-sm border-gray-300 focus:outline-none focus:border-blue-500" 
                placeholder="z.B. 1000"
              />
              <button 
                @click="saveInvoiceCounter" 
                class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded shadow-sm text-sm"
              >
                Speichern
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-1">Die nächste Rechnung erhält diese Nummer. Format: RE-YYYY-NNNNNN</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const invoiceCounter = ref(1000);

const fetchSettings = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/settings`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
    });
    if (res.ok) {
      const data = await res.json();
      invoiceCounter.value = parseInt(data.invoiceCounter || '1000', 10);
    }
  } catch (e) {
    console.error('Failed to fetch settings', e);
  }
};

const saveInvoiceCounter = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/settings`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt')}` 
      },
      body: JSON.stringify({ key: 'invoiceCounter', value: String(invoiceCounter.value) })
    });
    if (res.ok) {
      alert('Gespeichert!');
    } else {
      alert('Fehler beim Speichern');
    }
  } catch (e) {
    console.error(e);
    alert('Fehler beim Speichern');
  }
};

onMounted(() => fetchSettings());
</script>
