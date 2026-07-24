<template>
  <div class="space-y-6 pb-20">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">Preisverwaltung</h1>
        <p class="text-slate-500 mt-1">Zentrale Übersicht aller Tarife und Konditionen.</p>
      </div>
      <button
        @click="openAddDialog"
        class="inline-flex items-center justify-center rounded-none bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
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

    <div class="w-full overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Bezeichnung</th>
            <th class="pb-3 pr-4 font-medium">Preis</th>
            <th class="pb-3 pr-4 font-medium">Intervall</th>
            <th class="pb-3 pr-4 font-medium">Zugehörige Ressource</th>
            <th class="pb-3 font-medium text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="py-12 text-center text-neutral-500">Lädt…</td>
          </tr>
          <tr v-else-if="filteredPlans.length === 0">
            <td colspan="5" class="py-12 text-center text-neutral-500">
              Keine Tarife gefunden
            </td>
          </tr>
          <tr
            v-for="plan in filteredPlans"
            :key="plan.id"
            class="group border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
          >
            <td class="py-4 pr-4 font-medium text-neutral-900">
              {{ plan.name }}
            </td>
            <td class="py-4 pr-4 font-medium text-neutral-900">
              €{{ Number(plan.price).toFixed(2) }}
            </td>
            <td class="py-4 pr-4 text-neutral-700">
              <div class="flex flex-col gap-0.5">
                <span>{{ getBillingInterval(plan.billing_interval) }}</span>
                <span
                  v-if="plan.quota_amount && plan.quota_amount > 0"
                  class="text-xs text-neutral-500"
                >
                  {{ plan.quota_amount }}x {{ plan.quota_unit === 'BOOKINGS' ? 'Buchungen' : plan.quota_unit === 'HOURS' ? 'Stunden' : 'Tage' }}
                </span>
              </div>
            </td>
            <td class="py-4 pr-4 text-neutral-700">
              <div class="flex items-center gap-2">
                <span class="truncate max-w-[200px]" :title="plan.resource_name">
                  {{ plan.resource_name || '—' }}
                </span>
                <NuxtLink
                  v-if="plan.resource_id"
                  :to="`/booking-system/resources?id=${plan.resource_id}`"
                  class="text-brand-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Zur Ressource"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </NuxtLink>
              </div>
            </td>
            <td class="py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="editPlan(plan)"
                  class="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                  title="Bearbeiten"
                >
                  <IconEdit class="size-3 text-neutral-600" />
                </button>
                <button
                  @click="deletePlan(plan)"
                  class="text-neutral-400 hover:text-red-600 transition-colors p-1"
                  title="Löschen"
                >
                  <IconTrash class="size-4 text-neutral-600" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDialog" class="dialog-overlay" role="dialog" aria-modal="true">
      <div class="absolute inset-0" @click="showDialog = false"></div>

      <div class="dialog-panel max-w-md">
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ editingPlan ? 'Preisplan bearbeiten' : 'Neuer Preisplan' }}
          </h3>
          <button type="button" class="dialog-close" aria-label="Schließen" @click="showDialog = false">
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="dialog-body space-y-5">
          <div>
            <label class="dialog-label">Bezeichnung</label>
            <input
              v-model="planForm.name"
              type="text"
              placeholder="z.B. Standardtarif"
              class="dialog-input"
            />
          </div>

          <div>
            <label class="dialog-label">Ressource</label>
            <select v-model="planForm.resource_id" class="dialog-input">
              <option :value="null">Bitte wählen...</option>
              <option v-for="r in resources" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
            <p class="mt-1 text-xs text-neutral-500">Tarife müssen einer Ressource zugeordnet sein.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="dialog-label">Preis (€)</label>
              <input
                v-model.number="planForm.price"
                type="number"
                step="0.01"
                min="0"
                class="dialog-input text-right"
              />
            </div>
            <div>
              <label class="dialog-label">Intervall</label>
              <select v-model="planForm.billing_interval" class="dialog-input">
                <option value="HOUR">Stunde</option>
                <option value="DAY">Tag</option>
                <option value="MONTH">Monat</option>
                <option value="ONE_OFF">Einmalig</option>
              </select>
            </div>
          </div>

          <div class="pt-4 border-t border-neutral-200">
            <div class="flex items-center gap-2 mb-3">
              <input
                v-model="planForm.isQuotaPackage"
                type="checkbox"
                id="isQuotaPackage"
                class="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
              />
              <label for="isQuotaPackage" class="text-sm font-medium text-neutral-700">
                Kontingent-Paket
              </label>
            </div>
            <p class="text-xs text-neutral-500 mb-4">
              Wenn aktiviert, wird beim Kauf dieses Plans ein Kontingent erstellt, das der Nutzer später verwenden kann.
            </p>

            <div v-if="planForm.isQuotaPackage" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="dialog-label">Kontingent-Menge</label>
                  <input
                    v-model.number="planForm.quota_amount"
                    type="number"
                    min="1"
                    placeholder="z.B. 12"
                    class="dialog-input"
                  />
                </div>
                <div>
                  <label class="dialog-label">Einheit</label>
                  <select v-model="planForm.quota_unit" class="dialog-input">
                    <option value="BOOKINGS">Buchungen</option>
                    <option value="HOURS">Stunden</option>
                    <option value="DAYS">Tage</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="dialog-label">Gültigkeitsdauer (Tage, optional)</label>
                <input
                  v-model.number="planForm.quota_validity_days"
                  type="number"
                  min="1"
                  placeholder="Leer = unbegrenzt"
                  class="dialog-input"
                />
                <p class="mt-1 text-xs text-neutral-500">Lassen Sie das Feld leer für unbegrenzte Gültigkeit.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button type="button" class="btn-dialog-cancel" @click="showDialog = false">
            Abbrechen
          </button>
          <button
            type="button"
            class="btn-dialog-primary"
            :disabled="saving"
            @click="savePlan"
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
  resource_id: null,
  isQuotaPackage: false,
  quota_amount: null,
  quota_unit: 'BOOKINGS',
  quota_validity_days: null
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
    resource_id: resourceFilter.value !== 'all' ? resourceFilter.value : null,
    isQuotaPackage: false,
    quota_amount: null,
    quota_unit: 'BOOKINGS',
    quota_validity_days: null
  }
  showDialog.value = true
}

const editPlan = (plan: any) => {
  editingPlan.value = true
  // Clone data
  const hasQuota = !!(plan.quota_amount && Number(plan.quota_amount) > 0)
  planForm.value = { 
    id: plan.id,
    name: plan.name || '',
    price: Number(plan.price) || 0,
    billing_interval: plan.billing_interval || 'HOUR',
    resource_id: plan.resource_id || null,
    isQuotaPackage: hasQuota,
    quota_amount: hasQuota ? Number(plan.quota_amount) : null,
    quota_unit: hasQuota ? (plan.quota_unit || 'BOOKINGS') : 'BOOKINGS',
    quota_validity_days: hasQuota ? (plan.quota_validity_days ? Number(plan.quota_validity_days) : null) : null
  }
  showDialog.value = true
}

const savePlan = async () => {
  if(!planForm.value.name || !planForm.value.resource_id) return
  
  // Validierung: Wenn Kontingent-Paket aktiviert, muss quota_amount gesetzt sein
  if (planForm.value.isQuotaPackage && (!planForm.value.quota_amount || planForm.value.quota_amount < 1)) {
    alert('Bitte geben Sie eine Kontingent-Menge an (mindestens 1)')
    return
  }
  
  saving.value = true
  try {
    // Bereite Daten vor: Entferne isQuotaPackage Flag, setze quota Felder nur wenn aktiviert
    const submitData: any = {
      name: planForm.value.name,
      price: Number(planForm.value.price),
      billing_interval: planForm.value.billing_interval,
      resource_id: Number(planForm.value.resource_id)
    }

    // Kontingent-Felder immer explizit setzen
    if (planForm.value.isQuotaPackage && planForm.value.quota_amount) {
      submitData.quota_amount = Number(planForm.value.quota_amount)
      submitData.quota_unit = planForm.value.quota_unit || 'BOOKINGS'
      submitData.quota_validity_days = planForm.value.quota_validity_days ? Number(planForm.value.quota_validity_days) : null
    } else {
      // Wenn nicht aktiviert, setze auf null um zu löschen
      submitData.quota_amount = null
      submitData.quota_unit = null
      submitData.quota_validity_days = null
    }

    console.log('Sending pricing plan data:', JSON.stringify(submitData, null, 2))

    let result
    if (editingPlan.value) {
      result = await api.pricing.update(planForm.value.id, submitData)
    } else {
      result = await api.pricing.create(submitData)
    }
    
    if (result) {
      await loadData()
      showDialog.value = false
    }
  } catch(e) {
    console.error('Error saving plan:', e)
    alert('Fehler beim Speichern: ' + (e as any)?.message || 'Unbekannter Fehler')
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

onMounted(() => {
  loadData()
})
</script>