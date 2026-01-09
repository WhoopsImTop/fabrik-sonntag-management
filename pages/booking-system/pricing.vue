<template>
  <div class="space-y-6 pb-20">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">Preisverwaltung</h1>
        <p class="text-slate-500 mt-1">Zentrale Übersicht aller Tarife und Konditionen.</p>
      </div>
      <button
        @click="openAddDialog"
        class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Preisplan hinzufügen
      </button>
    </div>

    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tarife suchen..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-md text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
        />
      </div>
      <div class="w-full sm:w-[250px]">
        <select
          v-model="resourceFilter"
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
        >
          <option value="all">Alle Ressourcen</option>
          <option v-for="r in resources" :key="r.id" :value="r.id">{{ r.name }}</option>
        </select>
      </div>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div v-if="loading" class="flex justify-center items-center py-20">
        <svg class="animate-spin h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>

      <div v-else-if="filteredPlans.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="rounded-full bg-slate-100 p-3 mb-4">
          <svg class="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h3 class="text-lg font-semibold text-slate-900">Keine Tarife gefunden</h3>
        <p class="text-slate-500 max-w-sm mt-1">Es wurden keine Preispläne gefunden, die Ihren Kriterien entsprechen.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-medium">
            <tr>
              <th class="px-6 py-3 w-[30%]">Bezeichnung</th>
              <th class="px-6 py-3 w-[20%]">Preis</th>
              <th class="px-6 py-3 w-[15%]">Intervall</th>
              <th class="px-6 py-3 w-[25%]">Zugehörige Ressource</th>
              <th class="px-6 py-3 w-[10%] text-right">Aktion</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="plan in filteredPlans" 
              :key="plan.id" 
              class="group hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4 font-medium text-slate-900">
                {{ plan.name }}
              </td>
              <td class="px-6 py-4 text-slate-700 font-semibold">
                €{{ Number(plan.price).toFixed(2) }}
              </td>
              <td class="px-6 py-4">
                <span 
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
                    getIntervalBadgeClass(plan.billing_interval)
                  ]"
                >
                  {{ getBillingInterval(plan.billing_interval) }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600">
                <div class="flex items-center gap-2">
                  <span class="truncate max-w-[200px]" :title="plan.resource_name">
                    {{ plan.resource_name || '—' }}
                  </span>
                  <NuxtLink 
                    v-if="plan.resource_id" 
                    :to="`/booking-system/resources?id=${plan.resource_id}`"
                    class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity"
                    title="Zur Ressource"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  </NuxtLink>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="editPlan(plan)"
                    class="text-slate-400 hover:text-slate-900 transition-colors p-1"
                    title="Bearbeiten"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button 
                    @click="deletePlan(plan)"
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
            {{ editingPlan ? 'Preisplan bearbeiten' : 'Neuer Preisplan' }}
          </h3>
          <button @click="showDialog = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Bezeichnung</label>
            <input
              v-model="planForm.name"
              type="text"
              placeholder="z.B. Standardtarif"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Ressource</label>
            <select
              v-model="planForm.resource_id"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            >
              <option :value="null">Bitte wählen...</option>
              <option v-for="r in resources" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
            <p class="mt-1 text-xs text-slate-500">Tarife müssen einer Ressource zugeordnet sein.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Preis (€)</label>
              <input
                v-model.number="planForm.price"
                type="number"
                step="0.01"
                min="0"
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 text-right"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Intervall</label>
              <select
                v-model="planForm.billing_interval"
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="HOUR">Stunde</option>
                <option value="DAY">Tag</option>
                <option value="MONTH">Monat</option>
                <option value="ONE_OFF">Einmalig</option>
              </select>
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
            @click="savePlan"
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
const api = useBookingApi()

const loading = ref(true)
const saving = ref(false)
const plans = ref<any[]>([])
const resources = ref<any[]>([])
const searchQuery = ref('')
const resourceFilter = ref<number | 'all'>('all')

const showDialog = ref(false)
const editingPlan = ref(false)
const planForm = ref<any>({
  id: null,
  name: '',
  price: 0,
  billing_interval: 'HOUR',
  resource_id: null
})

// --- Computed ---
const filteredPlans = computed(() => {
  let res = plans.value

  // 1. Resource Filter
  if (resourceFilter.value !== 'all') {
    res = res.filter(p => p.resource_id === resourceFilter.value)
  }

  // 2. Search Query
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    res = res.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.resource_name?.toLowerCase().includes(q)
    )
  }
  
  return res
})

// --- Data Loading ---
const loadData = async () => {
  loading.value = true
  try {
    const [plansData, resourcesData] = await Promise.all([
      api.pricing.getAll(),
      api.resources.getAll()
    ])
    
    // Mapping Resource Name to Plan if backend doesn't provide it flattened
    if (plansData && resourcesData) {
      plans.value = (Array.isArray(plansData) ? plansData : []).map((plan: any) => {
        const r = (Array.isArray(resourcesData) ? resourcesData : []).find((res: any) => res.id === plan.resource_id)
        return {
          ...plan,
          resource_name: r ? r.name : 'Unbekannt'
        }
      })
      resources.value = Array.isArray(resourcesData) ? resourcesData : []
    }
  } finally {
    loading.value = false
  }
}

// --- Actions ---

const openAddDialog = () => {
  editingPlan.value = false
  planForm.value = {
    id: null,
    name: '',
    price: 0,
    billing_interval: 'HOUR',
    resource_id: resourceFilter.value !== 'all' ? resourceFilter.value : null
  }
  showDialog.value = true
}

const editPlan = (plan: any) => {
  editingPlan.value = true
  // Clone data
  planForm.value = { 
    id: plan.id,
    name: plan.name,
    price: plan.price,
    billing_interval: plan.billing_interval,
    resource_id: plan.resource_id
  }
  showDialog.value = true
}

const savePlan = async () => {
  if(!planForm.value.name || !planForm.value.resource_id) return
  
  saving.value = true
  try {
    let result
    if (editingPlan.value) {
      result = await api.pricing.update(planForm.value.id, planForm.value)
    } else {
      result = await api.pricing.create(planForm.value)
    }
    
    if (result) {
      await loadData()
      showDialog.value = false
    }
  } catch(e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const deletePlan = async (plan: any) => {
  if (confirm(`Tarif "${plan.name}" wirklich löschen?`)) {
    await api.pricing.delete(plan.id)
    await loadData()
  }
}

// --- Helpers ---

const getBillingInterval = (interval: string) => {
  const map: Record<string, string> = {
    HOUR: 'Std.',
    DAY: 'Tag',
    MONTH: 'Monat',
    ONE_OFF: 'Einmalig'
  }
  return map[interval] || interval
}

const getIntervalBadgeClass = (interval: string) => {
  switch(interval) {
    case 'MONTH': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
    case 'DAY': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'HOUR': return 'bg-slate-100 text-slate-700 border-slate-200'
    default: return 'bg-gray-50 text-gray-600 border-gray-200'
  }
}

onMounted(() => {
  loadData()
})
</script>