<template>
  <div class="space-y-6 pb-20">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">Services & Zusatzleistungen</h1>
        <p class="text-slate-500 mt-1">Verwalten Sie Catering, Technik und weitere buchbare Extras.</p>
      </div>
      <button
        @click="openAddDialog"
        class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Service hinzufügen
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-4">
      <div class="relative flex-1 max-w-sm">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Services suchen..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
        />
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div v-if="loading" class="flex justify-center items-center py-20">
        <svg class="animate-spin h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>

      <div v-else-if="filteredServices.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="rounded-full bg-slate-100 p-3 mb-4">
          <svg class="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        </div>
        <h3 class="text-lg font-semibold text-slate-900">Keine Services gefunden</h3>
        <p class="text-slate-500 max-w-sm mt-1">Legen Sie neue Services an, um sie Ihren Ressourcen hinzuzufügen.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-medium">
            <tr>
              <th class="px-6 py-3 w-[40%]">Service</th>
              <th class="px-6 py-3 w-[20%]">Preis</th>
              <th class="px-6 py-3 w-[25%]">Einheit</th>
              <th class="px-6 py-3 w-[15%] text-right">Aktion</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="service in filteredServices" 
              :key="service.id" 
              class="group hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                    <component :is="getServiceIcon(service.name)" />
                  </div>
                  <div>
                    <div class="font-medium text-slate-900">{{ service.name }}</div>
                    <div class="text-xs text-slate-500">ID: {{ service.id }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="font-semibold text-slate-900">€{{ Number(service.price_per_unit).toFixed(2) }}</span>
              </td>
              <td class="px-6 py-4">
                <span 
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
                    service.pricing_unit === 'PER_HOUR' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  ]"
                >
                  {{ getPricingUnitLabel(service.pricing_unit) }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="editService(service)"
                    class="text-slate-400 hover:text-slate-900 transition-colors p-1"
                    title="Bearbeiten"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button 
                    @click="deleteService(service)"
                    class="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Löschen"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="showDialog = false"></div>
      
      <div class="z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-900">
            {{ editingService ? 'Service bearbeiten' : 'Neuer Service' }}
          </h3>
          <button @click="showDialog = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Bezeichnung</label>
            <input
              v-model="serviceForm.name"
              type="text"
              placeholder="z.B. Catering, Beamer, Flipchart"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Preis (€)</label>
            <input
              v-model.number="serviceForm.price_per_unit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 text-right"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-3">Abrechnungseinheit</label>
            <div class="grid grid-cols-2 gap-3">
              <label 
                class="relative flex cursor-pointer rounded-lg border p-3 shadow-sm focus:outline-none transition-all"
                :class="serviceForm.pricing_unit === 'PER_BOOKING' 
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' 
                  : 'border-slate-200 bg-white hover:border-slate-300'"
              >
                <input 
                  type="radio" 
                  name="pricing_unit" 
                  value="PER_BOOKING" 
                  v-model="serviceForm.pricing_unit" 
                  class="sr-only"
                >
                <span class="flex flex-1">
                  <span class="flex flex-col">
                    <span class="block text-sm font-medium text-slate-900">Pauschal</span>
                    <span class="mt-1 flex items-center text-xs text-slate-500">Pro Buchung</span>
                  </span>
                </span>
                <svg v-if="serviceForm.pricing_unit === 'PER_BOOKING'" class="h-5 w-5 text-slate-900" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
              </label>

              <label 
                class="relative flex cursor-pointer rounded-lg border p-3 shadow-sm focus:outline-none transition-all"
                :class="serviceForm.pricing_unit === 'PER_HOUR' 
                  ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' 
                  : 'border-slate-200 bg-white hover:border-slate-300'"
              >
                <input 
                  type="radio" 
                  name="pricing_unit" 
                  value="PER_HOUR" 
                  v-model="serviceForm.pricing_unit" 
                  class="sr-only"
                >
                <span class="flex flex-1">
                  <span class="flex flex-col">
                    <span class="block text-sm font-medium text-slate-900">Zeitbasiert</span>
                    <span class="mt-1 flex items-center text-xs text-slate-500">Pro Stunde</span>
                  </span>
                </span>
                <svg v-if="serviceForm.pricing_unit === 'PER_HOUR'" class="h-5 w-5 text-slate-900" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
              </label>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            @click="showDialog = false"
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            @click="saveService"
            :disabled="saving"
            class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center"
          >
            <span v-if="saving" class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            Speichern
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue' // Für Render-Function bei Icons

const api = useBookingApi()
const loading = ref(true)
const saving = ref(false)
const services = ref<any[]>([])
const searchQuery = ref('')

const showDialog = ref(false)
const editingService = ref(false)
const serviceForm = ref<any>({
  id: null,
  name: '',
  price_per_unit: 0,
  pricing_unit: 'PER_BOOKING'
})

// --- Computed ---
const filteredServices = computed(() => {
  if (!searchQuery.value) return services.value
  const q = searchQuery.value.toLowerCase()
  return services.value.filter(s => s.name?.toLowerCase().includes(q))
})

// --- Data Loading ---
const loadServices = async () => {
  loading.value = true
  try {
    const data = await api.services.getAll()
    if (data) services.value = Array.isArray(data) ? data : []
  } finally {
    loading.value = false
  }
}

// --- Icons Helper ---
const getServiceIcon = (name: string) => {
  const lowerName = name?.toLowerCase() || ''
  
  // Icon: Coffee / Catering
  if (lowerName.includes('catering') || lowerName.includes('kaffee') || lowerName.includes('essen')) {
    return () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z' }),
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M6 1V4M10 1V4M14 1V4' })
    ])
  }
  
  // Icon: Technik / Beamer
  if (lowerName.includes('beamer') || lowerName.includes('bildschirm') || lowerName.includes('technik') || lowerName.includes('tv')) {
    return () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' })
    ])
  }

  // Icon: Wifi
  if (lowerName.includes('internet') || lowerName.includes('wifi') || lowerName.includes('wlan')) {
    return () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
       h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0' })
    ])
  }

  // Default: Box
  return () => h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' })
  ])
}

const getPricingUnitLabel = (unit: string) => {
  return unit === 'PER_HOUR' ? 'Pro Stunde' : 'Pro Buchung'
}

// --- Actions ---
const openAddDialog = () => {
  editingService.value = false
  serviceForm.value = {
    id: null,
    name: '',
    price_per_unit: 0,
    pricing_unit: 'PER_BOOKING'
  }
  showDialog.value = true
}

const editService = (service: any) => {
  editingService.value = true
  serviceForm.value = { ...service }
  showDialog.value = true
}

const saveService = async () => {
  if (!serviceForm.value.name) return
  
  saving.value = true
  try {
    let result
    if (editingService.value) {
      result = await api.services.update(serviceForm.value.id, serviceForm.value)
    } else {
      result = await api.services.create(serviceForm.value)
    }
    
    if (result) {
      await loadServices()
      showDialog.value = false
    }
  } catch(e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const deleteService = async (service: any) => {
  if (confirm(`Service "${service.name}" wirklich löschen?`)) {
    await api.services.delete(service.id)
    await loadServices()
  }
}

onMounted(() => {
  loadServices()
})
</script>