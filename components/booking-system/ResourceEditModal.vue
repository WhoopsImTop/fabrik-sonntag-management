<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog">
    <div class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

    <div class="z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
      
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Ressource bearbeiten</h2>
          <p class="text-sm text-slate-500 font-medium" v-if="resourceData">
            {{ resourceData.name }}
          </p>
        </div>
        <button 
          @click="$emit('close')"
          class="rounded-md p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div v-if="loading" class="flex-1 flex items-center justify-center min-h-[300px]">
        <svg class="animate-spin h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>

      <div v-else-if="resourceData" class="flex-1 flex flex-col overflow-hidden">
        
        <div class="px-6 pt-4 border-b border-slate-100">
          <div class="flex space-x-6">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              class="pb-3 text-sm font-medium border-b-2 transition-all"
              :class="activeTab === tab.id 
                ? 'border-slate-900 text-slate-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-6 pb-6 pt-4">
          
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