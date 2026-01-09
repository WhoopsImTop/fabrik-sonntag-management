<template>
  <div class="space-y-6 py-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Name</label>
        <input 
          v-model="form.name" 
          type="text" 
          placeholder="z.B. Konferenzraum A"
          class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" 
        />
      </div>
      
      <div class="space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Kategorie</label>
        <select 
          v-model="form.category_id" 
          class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
        >
          <option :value="null">Bitte wählen...</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Kapazität</label>
        <input 
          v-model.number="form.capacity" 
          type="number" 
          min="0"
          class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" 
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Standort</label>
        <input 
          v-model="form.location_data" 
          type="text" 
          placeholder="z.B. 1. OG, Raum 102"
          class="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" 
        />
      </div>

      <div class="col-span-full space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Beschreibung</label>
        <textarea 
          v-model="form.description" 
          rows="4" 
          placeholder="Beschreiben Sie die Ausstattung..."
          class="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
        ></textarea>
      </div>
    </div>

    <div class="flex items-center justify-between border-t border-slate-100 pt-6">
      <button 
        @click="$emit('delete')" 
        class="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md transition-colors flex items-center gap-2"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        Ressource löschen
      </button>
      
      <button 
        @click="save" 
        :disabled="saving"
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 bg-slate-900 text-white hover:bg-slate-900/90 h-9 px-4 py-2 shadow disabled:opacity-50"
      >
        <span v-if="saving" class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
        {{ saving ? 'Speichert...' : 'Änderungen speichern' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  resource: any
  categories: any[]
}>()

const emit = defineEmits(['update', 'delete'])
const api = useBookingApi()
const saving = ref(false)

// Lokale Kopie für das Formular, um Mutation der Props zu vermeiden
const form = ref({ ...props.resource })

const save = async () => {
  saving.value = true
  try {
    await api.resources.update(props.resource.id, form.value)
    emit('update') // Parent benachrichtigen zum Neuladen
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>