<template>
  <div v-if="show" class="dialog-overlay" role="dialog" aria-modal="true">
    <div class="absolute inset-0" @click="$emit('close')"></div>

    <div class="dialog-panel max-w-2xl">
      <div class="dialog-header">
        <div class="min-w-0 flex-1">
          <h2 class="dialog-title">Ressource bearbeiten</h2>
          <p class="dialog-desc" v-if="resourceData">
            {{ resourceData.name }}
          </p>
        </div>
        <button
          type="button"
          class="dialog-close"
          aria-label="Schließen"
          @click="$emit('close')"
        >
          <UiIcon name="i-lucide-x" class="size-5" />
        </button>
      </div>

      <div v-if="loading" class="flex flex-1 items-center justify-center min-h-[300px]">
        <svg class="animate-spin h-8 w-8 text-neutral-200" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>

      <div v-else-if="resourceData" class="flex flex-1 flex-col overflow-hidden">
        <div class="border-b border-neutral-200 px-6 pt-4">
          <div class="flex space-x-6">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              type="button"
              @click="activeTab = tab.id"
              class="pb-3 text-sm font-medium border-b-2 transition-all"
              :class="activeTab === tab.id
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="dialog-body">
          <DetailsTab
            v-if="activeTab === 'details'"
            :resource="resourceData"
            :categories="categories"
            @update="refreshData"
            @delete="handleDelete"
          />

          <PricingTab
            v-if="activeTab === 'pricing'"
            :resource-id="resourceId"
            :initial-plans="resourceData.PricingPlans"
            @update="refreshData"
          />

          <ServicesTab
            v-if="activeTab === 'services'"
            :resource-id="resourceId"
            :current-services="resourceData.Services"
            :all-services="allServices"
            @update="refreshData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DetailsTab from './resource-editor/DetailsTab.vue'
import PricingTab from './resource-editor/PricingTab.vue'
import ServicesTab from './resource-editor/ServicesTab.vue'

const props = defineProps<{
  show: boolean
  resourceId: number | null
}>()

const emit = defineEmits(['close', 'refresh-list'])
const api = useBookingApi()

const loading = ref(true)
const activeTab = ref('details')
const resourceData = ref<any>(null)
const categories = ref<any[]>([])
const allServices = ref<any[]>([])

const tabs = [
  { id: 'details', label: 'Basisdaten' },
  { id: 'pricing', label: 'Preise & Tarife' },
  { id: 'services', label: 'Zusatzleistungen' }
]

// Data Fetching logic
const fetchData = async (id: number) => {
  loading.value = true
  try {
    const [res, cats, svcs] = await Promise.all([
      api.resources.getAll(), // TODO: Optimize to getOne(id) if API supports it
      api.resources.getCategories(),
      api.services.getAll()
    ])

    if (Array.isArray(res)) {
      resourceData.value = res.find((r: any) => r.id === id)
    }
    categories.value = cats || []
    allServices.value = svcs || []

  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// Watchers
watch(() => props.resourceId, async (newId) => {
  if (newId && props.show) {
    activeTab.value = 'details'
    await fetchData(newId)
  }
}, { immediate: true })

watch(() => props.show, async (isOpen) => {
  if (isOpen && props.resourceId) {
    await fetchData(props.resourceId)
  }
})

const refreshData = async () => {
  if (props.resourceId) await fetchData(props.resourceId)
  emit('refresh-list')
}

const handleDelete = async () => {
  if (!confirm('Ressource unwiderruflich löschen?')) return
  if (props.resourceId) {
    await api.resources.delete(props.resourceId)
    emit('refresh-list')
    emit('close')
  }
}
</script>