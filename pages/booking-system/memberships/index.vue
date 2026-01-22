<template>
  <div class="space-y-6 pb-20">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">Mitgliedschaften</h1>
        <p class="text-slate-500 mt-1">Verwalten Sie Status-Level und automatische Rabattregeln.</p>
      </div>
      <button
        @click="openTypeModal()"
        class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
      >
        <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Neuer Typ
      </button>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-20">
      <svg class="animate-spin h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>

    <div v-else-if="types.length === 0" class="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-slate-200 border-dashed">
      <div class="rounded-full bg-slate-50 p-3 mb-4">
        <svg class="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
      </div>
      <h3 class="text-lg font-semibold text-slate-900">Keine Mitgliedschaften</h3>
      <p class="text-slate-500 max-w-sm mt-1">Legen Sie Status-Level an, um Kunden Rabatte zu gewähren.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="type in types"
        :key="type.id"
        class="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
      >
        <div class="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-bold text-slate-900">{{ type.name }}</h3>
              <p class="text-sm text-slate-500 mt-1 line-clamp-2">{{ type.description || 'Keine Beschreibung' }}</p>
            </div>
            <div class="flex gap-1">
              <button 
                @click="openTypeModal(type)"
                class="text-slate-400 hover:text-slate-900 p-1 rounded transition-colors"
                title="Bearbeiten"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </button>
              <button 
                @click="deleteType(type)"
                class="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                title="Löschen"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="p-6 flex-1 flex flex-col">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Aktive Rabatte</h4>
          
          <div v-if="type.DiscountRules && type.DiscountRules.length > 0" class="space-y-2 flex-1">
            <div
              v-for="rule in type.DiscountRules"
              :key="rule.id"
              class="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition-colors group/rule"
            >
              <div class="flex items-center gap-2">
                 <div class="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
                   <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                 </div>
                 <span class="text-sm font-medium text-slate-700">
                    {{ getCategoryName(rule.target_resource_category_id) }}
                 </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-900 shadow-sm">
                   {{ rule.discount_percent ? `-${rule.discount_percent * 100}%` : `-€${rule.discount_fixed}` }}
                </span>
                <button 
                  @click="deleteRule(rule.id)"
                  class="text-slate-300 hover:text-red-500 opacity-0 group-hover/rule:opacity-100 transition-all"
                  title="Regel entfernen"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>
          
          <div v-else class="flex-1 flex items-center justify-center py-4 border border-dashed border-slate-200 rounded-lg">
            <p class="text-xs text-slate-400 italic">Keine Rabattregeln definiert</p>
          </div>

          <button
            @click="openRuleModal(type)"
            class="mt-4 w-full inline-flex items-center justify-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Regel hinzufügen
          </button>
        </div>
      </div>
    </div>

    <div v-if="showTypeModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="showTypeModal = false"></div>
      
      <div class="z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-900">
            {{ isEditingType ? 'Mitgliedschaft bearbeiten' : 'Neuer Mitgliedschaftstyp' }}
          </h3>
          <button @click="showTypeModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <form @submit.prevent="saveType" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Bezeichnung</label>
            <input
              v-model="typeForm.name"
              type="text"
              placeholder="z.B. Premium Member"
              required
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Beschreibung</label>
            <textarea
              v-model="typeForm.description"
              rows="3"
              placeholder="Vorteile dieser Mitgliedschaft..."
              class="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            ></textarea>
          </div>
          
          <div class="flex justify-end pt-2">
             <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-sm"
            >
              {{ isEditingType ? 'Speichern' : 'Erstellen' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showRuleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog">
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="showRuleModal = false"></div>
      
      <div class="z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-900">Rabatt hinzufügen</h3>
          <button @click="showRuleModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="px-6 py-2 bg-slate-50/30 border-b border-slate-100 text-sm text-slate-600">
           Für Mitgliedschaft: <span class="font-semibold text-slate-900">{{ selectedType?.name }}</span>
        </div>
        
        <form @submit.prevent="createRule" class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">Kategorie</label>
            <select
              v-model="newRule.target_resource_category_id"
              required
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            >
              <option :value="null">Bitte wählen...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
            <p class="mt-1 text-xs text-slate-500">Auf welche Ressourcen-Kategorie gilt der Rabatt?</p>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Prozentual (%)</label>
              <div class="relative">
                <input
                  v-model.number="newRule.discount_percent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  placeholder="0.10"
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                />
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span class="text-gray-400 text-xs">%</span>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">z.B. 0.10 für 10%</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Fixbetrag (€)</label>
              <input
                v-model.number="newRule.discount_fixed"
                type="number"
                step="0.01"
                min="0"
                placeholder="5.00"
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              />
              <p class="text-[10px] text-slate-400 mt-1">Absoluter Abzug</p>
            </div>
          </div>
          
          <div class="flex justify-end pt-2">
             <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors shadow-sm"
            >
              Regel speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useBookingApi()

const loading = ref(true)
const types = ref<any[]>([])
const categories = ref<any[]>([])

// Type Modal
const showTypeModal = ref(false)
const isEditingType = ref(false)
const typeForm = ref<any>({ id: null, name: '', description: '' })

// Rule Modal
const showRuleModal = ref(false)
const selectedType = ref<any>(null)
const newRule = ref({
  membership_type_id: 0,
  target_resource_category_id: null,
  discount_percent: null,
  discount_fixed: null
})

const getCategoryName = (id: number) => {
  const cat = categories.value.find(c => c.id === id)
  return cat ? cat.name : 'Alle Kategorien'
}

const loadData = async () => {
  loading.value = true
  try {
    const [typesData, catsData] = await Promise.all([
      api.memberships.getTypes(),
      api.resources.getCategories()
    ])
    
    if (typesData) types.value = Array.isArray(typesData) ? typesData : []
    if (catsData) categories.value = Array.isArray(catsData) ? catsData : []
  } finally {
    loading.value = false
  }
}

// --- TYPE Actions ---

const openTypeModal = (type?: any) => {
  if (type) {
    isEditingType.value = true
    typeForm.value = { ...type }
  } else {
    isEditingType.value = false
    typeForm.value = { id: null, name: '', description: '' }
  }
  showTypeModal.value = true
}

const saveType = async () => {
  if(!typeForm.value.name) return
  let result
  
  if (isEditingType.value && typeForm.value.id) {
    result = await api.memberships.updateType(typeForm.value.id, typeForm.value)
  } else {
    result = await api.memberships.createType(typeForm.value)
  }
  
  if (result) {
    showTypeModal.value = false
    await loadData()
  }
}

const deleteType = async (type: any) => {
  if(confirm(`Möchten Sie den Typ "${type.name}" wirklich löschen?`)) {
    const res = await api.memberships.deleteType(type.id)
    if (res) await loadData()
  }
}

// --- RULE Actions ---

const openRuleModal = (type: any) => {
  selectedType.value = type
  newRule.value = {
    membership_type_id: type.id,
    target_resource_category_id: categories.value[0]?.id || null,
    discount_percent: null,
    discount_fixed: null
  }
  showRuleModal.value = true
}

const createRule = async () => {
  if(!newRule.value.target_resource_category_id) return
  const percent = typeof newRule.value.discount_percent === 'number' ? newRule.value.discount_percent : null
  const fixed = typeof newRule.value.discount_fixed === 'number' ? newRule.value.discount_fixed : null
  if (percent && fixed) {
    alert('Bitte entweder Prozent oder Fixbetrag setzen, nicht beides.')
    return
  }
  if (percent != null) {
    newRule.value.discount_percent = Math.max(0, Math.min(1, percent))
  }
  const result = await api.memberships.createRule(newRule.value)
  if (result) {
    showRuleModal.value = false
    await loadData()
  }
}

const deleteRule = async (ruleId: number) => {
  if(confirm("Möchten Sie diese Rabattregel wirklich entfernen?")) {
    const res = await api.memberships.deleteRule(ruleId)
    if(res) await loadData()
  }
}

onMounted(() => {
  loadData()
})
</script>
