<template>
  <div class="space-y-6 pb-20">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">Ressourcen</h1>
        <p class="text-slate-500 mt-1">Verwalten Sie Räume, Arbeitsplätze und Equipment.</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="showCategoryDialog = true"
          class="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          Kategorie +
        </button>
        <button
          @click="openWizard"
          class="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Ressource erstellen
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Ressourcen suchen..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
        />
      </div>
      <select v-model="categoryFilter" class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none">
        <option value="all">Alle Kategorien</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <svg class="animate-spin w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
    </div>

    <div v-else-if="filteredResources.length === 0" class="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
      <p class="text-slate-500">Keine Ressourcen gefunden.</p>
      <button @click="openWizard" class="mt-4 text-blue-600 hover:underline text-sm font-medium">Neue Ressource anlegen</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div 
        v-for="resource in filteredResources" 
        :key="resource.id"
        class="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
      >
        <div class="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">
                {{ resource.ResourceCategory?.name || 'Allgemein' }}
              </span>
            </div>
            <h3 class="font-bold text-slate-900 text-lg">{{ resource.name }}</h3>
          </div>
          <button @click="openEditModal(resource.id)" class="text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded hover:bg-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
        </div>

        <div class="p-5 flex-1 space-y-4">
          <div class="flex items-center gap-4 text-sm text-slate-600">
             <div class="flex items-center gap-1.5" title="Kapazität">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span>{{ resource.capacity || 0 }} Pers.</span>
             </div>
             <div class="flex items-center gap-1.5" title="Standort">
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span class="truncate max-w-[150px]">{{ resource.location_data || '-' }}</span>
             </div>
          </div>
          
          <div v-if="resource.PricingPlans?.length > 0" class="pt-3 border-t border-slate-100">
            <div class="space-y-1">
              <div v-for="plan in resource.PricingPlans.slice(0, 2)" :key="plan.id" class="flex justify-between text-sm">
                 <span class="text-slate-600 text-xs">{{ plan.name }}</span>
                 <span class="font-medium text-slate-900 text-xs">€{{ plan.price }}</span>
              </div>
              <p v-if="resource.PricingPlans.length > 2" class="text-[10px] text-slate-400">+ {{ resource.PricingPlans.length - 2 }} weitere Tarife</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showWizard" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" @click.self="showWizard = false">
       <div class="w-full max-w-4xl animate-in zoom-in-95 duration-200">
         <BookingSystemResourceWizard @completed="onWizardCompleted" @cancel="showWizard = false" />
       </div>
    </div>

    <BookingSystemResourceEditModal
      :show="showEditModal"
      :resource-id="selectedResourceId"
      @close="closeEditModal"
      @refresh-list="loadData"
    />

    <div v-if="showCategoryDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" @click.self="showCategoryDialog = false">
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 class="text-lg font-bold mb-4 text-slate-900">Neue Kategorie</h3>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-slate-700">Name</label>
                <input v-model="categoryForm.name" placeholder="z.B. Meetingraum" class="w-full border-slate-300 rounded-md mt-1 text-sm px-3 py-2">
              </div>
              <div class="flex justify-end gap-2 pt-2">
                  <button @click="showCategoryDialog = false" class="px-3 py-2 text-sm text-slate-500 hover:text-slate-900">Abbrechen</button>
                  <button @click="saveCategory" class="px-3 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800">Erstellen</button>
              </div>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const api = useBookingApi()

const loading = ref(true)
const resources = ref<any[]>([])
const categories = ref<any[]>([])
const searchQuery = ref('')
const categoryFilter = ref('all')

const showWizard = ref(false)
const showEditModal = ref(false)
const showCategoryDialog = ref(false)
const selectedResourceId = ref<number | null>(null)
const categoryForm = ref({ name: '' })

// Computed
const filteredResources = computed(() => {
  let res = resources.value
  if (categoryFilter.value !== 'all') {
    res = res.filter(r => r.category_id == categoryFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    res = res.filter(r => r.name?.toLowerCase().includes(q))
  }
  return res
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    const [resData, catData] = await Promise.all([
      api.resources.getAll(),
      api.resources.getCategories()
    ])
    resources.value = resData || []
    categories.value = catData || []
  } finally {
    loading.value = false
  }
}

const openWizard = () => showWizard.value = true
const onWizardCompleted = async () => {
  showWizard.value = false
  await loadData()
}

const openEditModal = (id: number) => {
  selectedResourceId.value = id
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedResourceId.value = null
}

const saveCategory = async () => {
    if(!categoryForm.value.name) return
    await api.resources.createCategory(categoryForm.value)
    showCategoryDialog.value = false
    categoryForm.value.name = ''
    loadData()
}

onMounted(() => {
  loadData()
})
</script>