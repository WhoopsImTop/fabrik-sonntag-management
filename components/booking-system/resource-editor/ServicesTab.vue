<template>
  <div class="space-y-6 py-4">
    <div>
      <h3 class="text-sm font-medium text-slate-900">Verfügbare Services</h3>
      <p class="text-xs text-slate-500">Wählen Sie Services, die für diese Ressource gebucht werden können.</p>
    </div>

    <div v-if="allServices.length === 0" class="text-sm text-slate-500 p-4 border border-slate-200 rounded-lg bg-slate-50">
      Keine Services im System definiert. <NuxtLink to="/booking-system/services" class="text-blue-600 underline font-medium">Jetzt anlegen</NuxtLink>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <label 
        v-for="svc in allServices" 
        :key="svc.id"
        class="relative flex cursor-pointer rounded-lg border p-3 shadow-sm focus:outline-none transition-all duration-200 select-none group"
        :class="selectedIds.includes(svc.id) 
          ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' 
          : 'border-slate-200 bg-white hover:border-slate-300'"
      >
        <input 
          type="checkbox" 
          :value="svc.id" 
          v-model="selectedIds" 
          class="sr-only" 
        />
        <div class="flex w-full items-center justify-between">
          <div class="text-sm">
            <p class="font-medium text-slate-900">{{ svc.name }}</p>
            <p class="text-slate-500 text-xs">
              {{ svc.price_per_unit }}€ 
              <span class="opacity-75">{{ svc.pricing_unit === 'PER_HOUR' ? '/ Std' : '/ Buchung' }}</span>
            </p>
          </div>
          <div v-if="selectedIds.includes(svc.id)" class="text-slate-900">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
          </div>
          <div v-else class="text-slate-200 group-hover:text-slate-300">
             <div class="w-5 h-5 border-2 border-current rounded-full"></div>
          </div>
        </div>
      </label>
    </div>

    <div class="flex justify-end pt-4 border-t border-slate-100">
      <button 
        @click="save" 
        :disabled="saving"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-white hover:bg-slate-900/90 h-9 px-4 py-2 shadow disabled:opacity-50"
      >
        <span v-if="saving" class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        {{ saving ? 'Speichert...' : 'Services verknüpfen' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  resourceId: number
  currentServices: any[]
  allServices: any[]
}>()

const emit = defineEmits(['update'])
const api = useBookingApi()
const saving = ref(false)

// Init selection from props (Array of IDs)
const selectedIds = ref(props.currentServices ? props.currentServices.map((s: any) => s.id) : [])

const save = async () => {
  saving.value = true
  try {
    // Bulk Update Call
    await api.services.updateResourceServices(props.resourceId, selectedIds.value)
    emit('update')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>