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
          class="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-none hover:bg-slate-50 transition-colors shadow-sm"
        >
          Kategorie +
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-none bg-brand-accent px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:brightness-95"
          @click="openWizard"
        >
          <UiIcon name="i-lucide-plus" class="size-4" />
          Ressource erstellen
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <UiIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Ressourcen suchen…"
          class="w-full rounded-none border border-neutral-200 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>
      <select
        v-model="categoryFilter"
        class="rounded-none border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
      >
        <option value="all">Alle Kategorien</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Name</th>
            <th class="pb-3 pr-4 font-medium">Kategorie</th>
            <th class="pb-3 pr-4 font-medium">Kapazität</th>
            <th class="pb-3 pr-4 font-medium">Standort</th>
            <th class="pb-3 pr-4 font-medium">Tarife</th>
            <th class="pb-3 font-medium text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="py-12 text-center text-neutral-500">Lädt…</td>
          </tr>
          <tr v-else-if="filteredResources.length === 0">
            <td colspan="6" class="py-12 text-center text-neutral-500">
              Keine Ressourcen gefunden.
              <button
                type="button"
                class="ml-1 font-medium text-brand-accent hover:underline"
                @click="openWizard"
              >
                Neue Ressource anlegen
              </button>
            </td>
          </tr>
          <tr
            v-for="resource in filteredResources"
            :key="resource.id"
            class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
            @click="openEditModal(resource.id)"
          >
            <td class="py-4 pr-4 font-medium text-neutral-900">
              {{ resource.name }}
            </td>
            <td class="py-4 pr-4 text-neutral-600">
              {{ resource.ResourceCategory?.name || "Allgemein" }}
            </td>
            <td class="py-4 pr-4 text-neutral-600">
              {{ resource.capacity || 0 }} Pers.
            </td>
            <td class="py-4 pr-4 text-neutral-600">
              {{ resource.location_data || "—" }}
            </td>
            <td class="py-4 pr-4 text-neutral-600">
              <template v-if="resource.PricingPlans?.length">
                {{ resource.PricingPlans.length }}
                {{ resource.PricingPlans.length === 1 ? "Tarif" : "Tarife" }}
              </template>
              <span v-else class="text-neutral-600">—</span>
            </td>
            <td class="py-4 text-right">
              <button
                type="button"
                class="font-medium text-brand-accent hover:underline"
                @click.stop="openEditModal(resource.id)"
              >
                <IconEdit class="size-3 text-neutral-600" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showWizard" class="dialog-overlay overflow-y-auto" @click.self="showWizard = false">
       <div class="w-full max-w-4xl">
         <BookingSystemResourceWizard @completed="onWizardCompleted" @cancel="showWizard = false" />
       </div>
    </div>

    <BookingSystemResourceEditModal
      :show="showEditModal"
      :resource-id="selectedResourceId"
      @close="closeEditModal"
      @refresh-list="loadData"
    />

    <div v-if="showCategoryDialog" class="dialog-overlay" role="dialog" aria-modal="true" @click.self="showCategoryDialog = false">
        <div class="dialog-panel max-w-sm">
            <div class="dialog-header">
              <h3 class="dialog-title">Neue Kategorie</h3>
              <button type="button" class="dialog-close" aria-label="Schließen" @click="showCategoryDialog = false">
                <UiIcon name="i-lucide-x" class="size-5" />
              </button>
            </div>
            <div class="dialog-body space-y-4">
              <div>
                <label class="dialog-label">Name</label>
                <input v-model="categoryForm.name" placeholder="z.B. Meetingraum" class="dialog-input">
              </div>
            </div>
            <div class="dialog-footer">
              <button type="button" class="btn-dialog-cancel" @click="showCategoryDialog = false">Abbrechen</button>
              <button type="button" class="btn-dialog-primary" @click="saveCategory">Erstellen</button>
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