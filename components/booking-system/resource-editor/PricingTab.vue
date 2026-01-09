<template>
  <div class="space-y-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-sm font-medium text-slate-900">Preispläne</h3>
        <p class="text-xs text-slate-500">Definieren Sie unterschiedliche Tarife (z.B. Stunden- vs. Tagespreis).</p>
      </div>
      <button 
        @click="addPlan"
        class="text-xs font-medium bg-white hover:bg-slate-50 text-slate-900 px-3 py-1.5 rounded-md transition-colors border border-slate-200 shadow-sm"
      >
        + Neuer Plan
      </button>
    </div>

    <div v-if="plans.length === 0" class="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
      <p class="text-sm text-slate-500">Noch keine Preise hinterlegt.</p>
    </div>

    <div class="space-y-4">
      <div 
        v-for="(plan, index) in plans" 
        :key="index" 
        class="relative grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-lg border border-slate-200 bg-white shadow-sm group hover:border-slate-300 transition-colors"
      >
        <button 
          @click="removePlan(index, plan.id)"
          class="absolute -top-2 -right-2 bg-white rounded-full p-1 text-slate-400 hover:text-red-600 shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Plan entfernen"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div class="md:col-span-5 space-y-1.5">
          <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Name</label>
          <input 
            v-model="plan.name" 
            placeholder="z.B. Standardtarif"
            class="flex h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 transition-colors focus:bg-white" 
          />
        </div>

        <div class="md:col-span-3 space-y-1.5">
          <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Preis (€)</label>
          <input 
            v-model.number="plan.price" 
            type="number"
            min="0"
            step="0.01"
            class="flex h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-right focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 transition-colors focus:bg-white" 
          />
        </div>

        <div class="md:col-span-4 space-y-1.5">
          <label class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Abrechnung</label>
          <select 
            v-model="plan.billing_interval" 
            class="flex h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 transition-colors focus:bg-white"
          >
            <option value="HOUR">Pro Stunde</option>
            <option value="DAY">Pro Tag</option>
            <option value="MONTH">Monatlich</option>
            <option value="ONE_OFF">Einmalig</option>
          </select>
        </div>
      </div>
    </div>

    <div class="flex justify-end pt-4 border-t border-slate-100">
      <button 
        @click="save" 
        :disabled="saving"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-slate-900 text-white hover:bg-slate-900/90 h-9 px-4 py-2 shadow disabled:opacity-50"
      >
        <span v-if="saving" class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        {{ saving ? 'Speichert...' : 'Preise aktualisieren' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ resourceId: number, initialPlans: any[] }>()
const emit = defineEmits(['update'])
const api = useBookingApi()
const saving = ref(false)

// Lokale Kopie erstellen, um Mutation zu vermeiden und Bearbeitung zu ermöglichen
const plans = ref(JSON.parse(JSON.stringify(props.initialPlans || [])))

const addPlan = () => {
  plans.value.push({
    id: null,
    resource_id: props.resourceId,
    name: 'Neuer Tarif',
    price: 0,
    billing_interval: 'HOUR'
  })
}

const removePlan = async (index: number, id: number | null) => {
  if (id) {
    if(!confirm('Diesen Preisplan wirklich löschen?')) return
    try {
      await api.pricing.delete(id)
    } catch(e) { return }
  }
  plans.value.splice(index, 1)
}

const save = async () => {
  saving.value = true
  try {
    for (const plan of plans.value) {
      if (plan.id) {
        await api.pricing.update(plan.id, plan)
      } else {
        await api.pricing.create({ ...plan, resource_id: props.resourceId })
      }
    }
    emit('update') // Daten neu laden, damit wir IDs für neue Pläne bekommen
  } catch(e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>