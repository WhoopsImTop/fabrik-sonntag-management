<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">Abonnements</h1>
        <p class="text-neutral-500 mt-1">Verwalten Sie wiederkehrende Rechnungen und Langzeitmieten.</p>
      </div>
      <button
        @click="router.push('/booking-system/subscriptions/new')"
        class="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Neues Abo
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <p class="text-sm font-medium text-neutral-500">Aktive Abos</p>
        <h3 class="text-2xl font-bold text-neutral-900 mt-1">{{ activeCount }}</h3>
      </div>
       <div class="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <p class="text-sm font-medium text-neutral-500">Monatliches Volumen</p>
        <h3 class="text-2xl font-bold text-neutral-900 mt-1">€{{ formatMoney(monthlyVolume) }}</h3>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Abos suchen..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>
      <select
        v-model="statusFilter"
        class="px-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
      >
        <option value="all">Alle Status</option>
        <option value="ACTIVE">Aktiv</option>
        <option value="PAUSED">Pausiert</option>
        <option value="CANCELLED">Beendet</option>
      </select>
    </div>

    <div class="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      <div v-if="loading" class="p-12 flex justify-center">
        <svg class="animate-spin w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>

      <div v-else-if="filteredSubscriptions.length === 0" class="p-12 text-center">
        <h3 class="text-lg font-medium text-neutral-900">Keine Abonnements vorhanden</h3>
        <p class="text-neutral-500 mt-1">Erstellen Sie das erste Abo für wiederkehrende Zahlungen.</p>
      </div>

      <table v-else class="min-w-full divide-y divide-neutral-200">
        <thead class="bg-neutral-50/50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Beschreibung</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Kunde</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Intervall</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Nächste Abrechnung</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase">Status</th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase">Aktion</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200 bg-white">
          <tr v-for="sub in filteredSubscriptions" :key="sub.id" class="hover:bg-neutral-50">
            <td class="px-6 py-4 text-sm font-medium text-neutral-900">
              {{ sub.description || 'Ohne Titel' }}
              <div class="text-xs text-neutral-500 font-normal mt-0.5" v-if="sub.LineItems?.length">
                {{ sub.LineItems.length }} Positionen
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-neutral-900">
              {{ sub.User?.username || 'Unbekannt' }}
              <div class="text-xs text-neutral-500">{{ sub.User?.email }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-neutral-900">
              <span class="px-2 py-1 rounded bg-gray-100 text-xs">{{ sub.interval }}</span>
            </td>
            <td class="px-6 py-4 text-sm text-neutral-900">
              {{ formatDate(sub.next_billing_date) }}
            </td>
            <td class="px-6 py-4">
              <span :class="['px-2.5 py-0.5 rounded-full text-xs font-medium border', getStatusClass(sub.status)]">
                {{ getStatusLabel(sub.status) }}
              </span>
            </td>
            <td class="px-6 py-4 text-right text-sm font-medium flex justify-end gap-2">
              <button @click="router.push(`/booking-system/subscriptions/${sub.id}`)" class="text-neutral-600 hover:text-neutral-900">Bearbeiten</button>
              
              <button 
                v-if="sub.status === 'ACTIVE'"
                @click="cancelSubscription(sub)" 
                class="text-orange-600 hover:text-orange-800"
                title="Abo beenden"
              >
                Beenden
              </button>
              
              <button @click="deleteSubscription(sub.id)" class="text-red-600 hover:text-red-800 ml-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Router importieren für die Navigation
const router = useRouter()
const api = useBookingApi()

// State
const loading = ref(true)
const subscriptions = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('all')

// --- Computed ---
const activeCount = computed(() => subscriptions.value.filter(s => s.status === 'ACTIVE').length)
const filteredSubscriptions = computed(() => {
  let list = subscriptions.value
  if (statusFilter.value !== 'all') {
    list = list.filter(s => s.status === statusFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s =>
      s.description?.toLowerCase().includes(q) ||
      s.User?.username?.toLowerCase().includes(q) ||
      s.User?.email?.toLowerCase().includes(q)
    )
  }
  return list
})

const monthlyVolume = computed(() => {
  return subscriptions.value
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, sub) => {
      const subTotal = sub.LineItems?.reduce((iSum: number, item: any) => iSum + (Number(item.amount) * Number(item.quantity)), 0) || 0
      const factor = sub.interval === 'YEARLY' ? 1/12 : 1
      return sum + (subTotal * factor)
    }, 0)
})

// --- Helpers ---
const formatMoney = (val: any) => Number(val || 0).toFixed(2)
const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('de-DE') : '-'

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700 border-green-200',
    PAUSED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200'
  }
  return map[status] || 'bg-gray-50 text-gray-700'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: 'Aktiv',
    PAUSED: 'Pausiert',
    CANCELLED: 'Beendet'
  }
  return map[status] || status
}

// --- Actions ---
const loadData = async () => {
  loading.value = true
  try {
    const subsData = await api.subscriptions.getAll()
    subscriptions.value = subsData || []
  } finally {
    loading.value = false
  }
}

// HIER WURDEN MODAL-FUNKTIONEN (openModal, save, addItem etc.) ENTFERNT

const cancelSubscription = async (sub: any) => {
  if(!confirm('Möchten Sie dieses Abo wirklich beenden? Der Status wird auf "Beendet" gesetzt.')) return
  
  await api.subscriptions.update(sub.id, { status: 'CANCELLED' })
  await loadData()
}

const deleteSubscription = async (id: number) => {
  if(!confirm('Achtung: Soll das Abo wirklich gelöscht werden?')) return
  await api.subscriptions.delete(id)
  await loadData()
}

onMounted(() => {
  loadData()
})
</script>
