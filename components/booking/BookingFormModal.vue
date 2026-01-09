<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
    <div class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

    <div class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
      <div class="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-lg w-full border border-slate-100">
        
        <div class="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">
              {{ isEdit ? 'Buchung bearbeiten' : 'Neue Buchung' }}
            </h3>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ isEdit ? 'Zeitraum oder Details ändern.' : 'Ressource reservieren.' }}
            </p>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="px-6 py-6 space-y-5">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wide">Ressource</label>
              <select 
                v-model="form.resource_id" 
                :disabled="isEdit" 
                class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5 disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Wählen...</option>
                <option v-for="res in resources" :key="res.id" :value="res.id">{{ res.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wide">Nutzer</label>
              <select 
                v-model="form.user_id" 
                class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5"
              >
                <option value="">Wählen...</option>
                <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username }}</option>
              </select>
            </div>
          </div>

          <div class="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4">
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Startzeit</label>
                <input 
                  :value="form.start_at" 
                  @input="handleStartChange"
                  type="datetime-local" 
                  class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2 font-mono"
                >
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Endzeit</label>
                <input 
                  v-model="form.end_at" 
                  @change="recalcDuration"
                  type="datetime-local" 
                  class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2 font-mono"
                >
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <div class="flex flex-wrap gap-2">
                <button @click="shiftTime(1, 'day')" type="button" class="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1">
                  <span>+1 Tag</span>
                </button>
                <button @click="shiftTime(1, 'week')" type="button" class="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1">
                  <span>+1 Woche</span>
                </button>
                <button @click="shiftTime(1, 'hour')" type="button" class="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1">
                  <span>+1 Std</span>
                </button>
              </div>
              <div class="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-1 rounded">
                Dauer: {{ durationString }}
              </div>
            </div>
          </div>

          <div v-if="!isEdit" class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wide">Tarif</label>
              <select 
                v-model="form.plan_id" 
                class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5"
              >
                <option value="">Standard (Manuell)</option>
                <option v-for="p in availablePlans" :key="p.id" :value="p.id">
                  {{ p.name }} ({{ p.price }}€)
                </option>
              </select>
            </div>
          </div>

          <div v-if="isEdit" class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
             <div>
               <label class="block text-xs font-medium text-slate-700 mb-1">Status</label>
               <select v-model="form.status" class="w-full border-slate-200 rounded-lg text-sm p-2 focus:ring-slate-900 focus:border-slate-900">
                 <option value="CONFIRMED">Bestätigt</option>
                 <option value="PENDING">Ausstehend</option>
                 <option value="CANCELLED">Storniert</option>
               </select>
             </div>
             <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Preis (Override)</label>
                <input v-model.number="form.manual_price" type="number" step="0.01" class="w-full border-slate-200 rounded-lg text-sm p-2">
             </div>
          </div>

        </div>

        <div class="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          <button 
            @click="$emit('close')" 
            class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
          >
            Abbrechen
          </button>
          <button 
            @click="submit" 
            :disabled="loading || !form.resource_id || !form.user_id"
            class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <span v-if="loading" class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
            {{ isEdit ? 'Speichern' : 'Buchen' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{ isOpen: boolean, editData?: any }>()
const emit = defineEmits(['close', 'saved'])
const api = useBookingApi()

const loading = ref(false)
const resources = ref<any[]>([])
const users = ref<any[]>([])
const pricingPlans = ref<any[]>([])

// Form Data
const form = ref({
  resource_id: '',
  user_id: '',
  start_at: '',
  end_at: '',
  plan_id: '',
  status: 'CONFIRMED',
  manual_price: null as number | null
})

// Interne State für Dauer (in Millisekunden)
const currentDurationMs = ref(60 * 60 * 1000) // Default 1h

const isEdit = computed(() => !!props.editData)

// --- SMART DATE LOGIC ---

// 1. Wenn Startdatum geändert wird -> Enddatum automatisch anpassen (Dauer behalten)
const handleStartChange = (e: Event) => {
  const newStartVal = (e.target as HTMLInputElement).value
  if (!newStartVal) return
  
  form.value.start_at = newStartVal
  
  // Neues Ende berechnen basierend auf alter Dauer
  const startDate = new Date(newStartVal)
  const newEndDate = new Date(startDate.getTime() + currentDurationMs.value)
  form.value.end_at = formatDatetime(newEndDate)
}

// 2. Wenn Enddatum manuell geändert wird -> Dauer neu berechnen
const recalcDuration = () => {
  if (form.value.start_at && form.value.end_at) {
    const s = new Date(form.value.start_at).getTime()
    const e = new Date(form.value.end_at).getTime()
    if (e > s) {
      currentDurationMs.value = e - s
    }
  }
}

// 3. Helper: Verschieben
const shiftTime = (amount: number, unit: 'hour' | 'day' | 'week') => {
  if (!form.value.start_at || !form.value.end_at) return
  
  const s = new Date(form.value.start_at)
  const e = new Date(form.value.end_at)
  
  if (unit === 'hour') {
    s.setHours(s.getHours() + amount)
    e.setHours(e.getHours() + amount)
  } else if (unit === 'day') {
    s.setDate(s.getDate() + amount)
    e.setDate(e.getDate() + amount)
  } else if (unit === 'week') {
    s.setDate(s.getDate() + (amount * 7))
    e.setDate(e.getDate() + (amount * 7))
  }
  
  form.value.start_at = formatDatetime(s)
  form.value.end_at = formatDatetime(e)
}

// 4. Anzeige Dauer String
const durationString = computed(() => {
  const ms = currentDurationMs.value
  const minutes = Math.floor((ms / (1000 * 60)) % 60)
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  
  let str = ''
  if (days > 0) str += `${days}d `
  if (hours > 0) str += `${hours}h `
  if (minutes > 0) str += `${minutes}m`
  return str || '0m'
})

const formatDatetime = (d: Date) => {
  const pad = (n: number) => n < 10 ? '0' + n : n
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// --- DATA LOADING & SUBMIT ---

// Plans for Resource
const availablePlans = computed(() => {
  if (!form.value.resource_id) return []
  return pricingPlans.value.filter(p => p.resource_id == form.value.resource_id)
})

onMounted(async () => {
  const [resData, usrData, plansData] = await Promise.all([
    api.resources.getAll(),
    api.users.getAll(),
    api.pricing.getAll()
  ])
  resources.value = resData || []
  users.value = usrData || []
  pricingPlans.value = plansData || []
  
  // Default Times for Create Mode
  if (!props.editData && !form.value.start_at) {
    const now = new Date()
    now.setMinutes(0, 0, 0)
    now.setHours(now.getHours() + 1)
    form.value.start_at = formatDatetime(now)
    const end = new Date(now)
    end.setHours(end.getHours() + 1)
    form.value.end_at = formatDatetime(end)
    currentDurationMs.value = 60 * 60 * 1000
  }
})

// Edit Watcher
watch(() => props.editData, (newVal) => {
  if (newVal) {
    form.value = {
      resource_id: newVal.resource_id,
      user_id: newVal.user_id,
      start_at: newVal.start_at.slice(0, 16),
      end_at: newVal.end_at.slice(0, 16),
      plan_id: newVal.pricing_plan_id,
      status: newVal.status,
      manual_price: newVal.total_price // oder invoice amount
    }
    // Duration setzen
    recalcDuration()
  } else {
    // Reset defaults (optional)
    form.value.resource_id = ''
    form.value.user_id = ''
  }
}, { immediate: true })

const submit = async () => {
  loading.value = true
  try {
    if (isEdit.value) {
      await api.bookings.update(props.editData.id, form.value)
    } else {
      await api.bookings.create(form.value)
    }
    emit('saved')
    emit('close')
  } catch (e) {
    console.error(e)
    alert('Fehler beim Speichern. Ist der Zeitraum frei?')
  } finally {
    loading.value = false
  }
}
</script>