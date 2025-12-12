<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 mb-8">
      <div class="flex items-center gap-4">
        <NuxtLink
          to="/booking-system/bookings"
          class="p-2.5 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition-colors shadow-sm"
        >
          <UIcon name="i-lucide-arrow-left" size="20" />
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold text-neutral-900 flex items-center gap-3">
            Buchung #{{ booking?.id }}
            <span v-if="booking" :class="getStatusBadgeClass(booking.status)" class="px-3 py-1 rounded-full text-xs font-medium border border-current/10">
                {{ getStatusLabel(booking.status) }}
            </span>
          </h1>
          <p class="text-neutral-500 text-sm mt-1" v-if="booking">Erstellt am {{ formatDate(booking.createdAt) }}</p>
        </div>
      </div>
    </div>

    <div v-if="booking" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      <!-- Column 1: Booking & Resource (What is booked) -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div class="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
                <UIcon name="i-lucide-calendar-clock" class="text-neutral-500" />
                <h2 class="font-semibold text-neutral-900">Buchungsdetails</h2>
            </div>
            <div class="p-6 space-y-6 flex-1">
                <!-- Resource Highlight -->
                <div class="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                     <p class="text-xs font-medium text-blue-600 mb-1 uppercase tracking-wider">Ressource</p>
                    <div class="flex items-center gap-3">
                         <div class="p-2 bg-white rounded-md text-blue-600 shadow-sm">
                             <UIcon name="i-lucide-box" size="20" />
                         </div>
                         <div>
                             <p class="font-bold text-neutral-900 text-lg">{{ booking.resource?.title || 'Unbekannt' }}</p>
                             <p class="text-xs text-neutral-500 capitalize">{{ booking.resource?.type }} • Kapazität: {{ booking.resource?.capacity }}</p>
                         </div>
                    </div>
                </div>

                <!-- Times -->
                <div class="space-y-4">
                    <div class="flex gap-4">
                        <div class="flex-1">
                             <label class="text-xs text-neutral-500 font-medium mb-1 block">Start</label>
                             <div class="flex items-center gap-2 text-sm text-neutral-900">
                                 <UIcon name="i-lucide-log-in" size="14" class="text-green-600" />
                                 {{ formatDate(booking.startTime) }}
                             </div>
                        </div>
                         <div class="flex-1">
                             <label class="text-xs text-neutral-500 font-medium mb-1 block">Ende</label>
                             <div class="flex items-center gap-2 text-sm text-neutral-900">
                                 <UIcon name="i-lucide-log-out" size="14" class="text-red-600" />
                                 {{ formatDate(booking.endTime) }}
                             </div>
                        </div>
                    </div>
                    
                    <div>
                         <label class="text-xs text-neutral-500 font-medium mb-1 block">Gesamtpreis</label>
                         <p class="text-2xl font-bold tracking-tight text-neutral-900">{{ booking.totalPrice }} <span class="text-base font-normal text-neutral-500">{{ booking.currency }}</span></p>
                    </div>
                </div>

                <!-- Notes -->
                <div v-if="booking.notes">
                    <label class="text-xs text-neutral-500 font-medium mb-1 block">Notizen</label>
                    <div class="bg-yellow-50 text-yellow-900 p-3 rounded-lg text-sm border border-yellow-100 flex gap-2 items-start">
                         <UIcon name="i-lucide-message-square" size="16" class="mt-0.5 shrink-0 opactiy-50" />
                         <p>{{ booking.notes }}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Column 2: User Info (Who booked) -->
      <div class="space-y-6">
          <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div class="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
                <UIcon name="i-lucide-user" class="text-neutral-500" />
                <h2 class="font-semibold text-neutral-900">Kundeninformationen</h2>
            </div>
            <div class="p-6 space-y-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 text-lg font-bold">
                        {{ (booking.user?.firstName?.[0] || booking.user?.username?.[0] || '?').toUpperCase() }}
                    </div>
                    <div>
                        <p class="font-bold text-lg text-neutral-900">
                            {{ booking.user?.firstName }} {{ booking.user?.lastName }}
                        </p>
                        <p class="text-sm text-neutral-500">@{{ booking.user?.username }}</p>
                    </div>
                </div>

                <div class="space-y-4 pt-4 border-t border-neutral-100">
                    <div>
                         <label class="text-xs text-neutral-500 font-medium mb-1 block">E-Mail Adresse</label>
                         <div class="flex items-center gap-2 group">
                             <UIcon name="i-lucide-mail" size="16" class="text-neutral-400" />
                             <a :href="'mailto:' + booking.user?.email" class="text-sm text-neutral-900 hover:text-blue-600 transition-colors break-all">
                                 {{ booking.user?.email }}
                             </a>
                         </div>
                    </div>
                    
                    <div v-if="booking.user?.phone">
                         <label class="text-xs text-neutral-500 font-medium mb-1 block">Telefonnummer</label>
                         <div class="flex items-center gap-2">
                             <UIcon name="i-lucide-phone" size="16" class="text-neutral-400" />
                             <a :href="'tel:' + booking.user?.phone" class="text-sm text-neutral-900 hover:text-blue-600 transition-colors">
                                 {{ booking.user?.phone }}
                             </a>
                         </div>
                    </div>
                    
                    <div v-if="booking.user?.company">
                          <label class="text-xs text-neutral-500 font-medium mb-1 block">Firma</label>
                         <div class="flex items-center gap-2 text-sm text-neutral-900">
                             <UIcon name="i-lucide-building-2" size="16" class="text-neutral-400" />
                             {{ booking.user?.company || 'Keine Firma' }}
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Column 3: Actions (What to do) -->
      <div class="space-y-6">
         <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div class="p-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center gap-2">
                <UIcon name="i-lucide-settings-2" class="text-neutral-500" />
                <h2 class="font-semibold text-neutral-900">Verwaltung</h2>
            </div>
            
            <div class="p-6 space-y-6">
                <!-- Status Switcher -->
                <div>
                     <label class="text-xs text-neutral-500 font-medium mb-2 block">Buchungsstatus</label>
                     <div class="space-y-3">
                         <select
                            v-model="newStatus"
                            class="w-full p-2.5 bg-neutral-50 border rounded-lg border-neutral-200 text-sm focus:ring-2 focus:ring-black/5 outline-none transition-all"
                        >
                            <option value="pending">⏳ Ausstehend</option>
                            <option value="confirmed">✅ Bestätigt</option>
                            <option value="cancelled">❌ Storniert</option>
                            <option value="completed">🏁 Abgeschlossen</option>
                        </select>
                        <button
                            @click="updateStatus"
                            :disabled="newStatus === booking.status"
                            class="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2.5 rounded-lg text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            <UIcon name="i-lucide-refresh-cw" size="14" />
                            Status speichern
                        </button>
                     </div>
                </div>

                <div class="bg-neutral-100 h-px w-full"></div>

                <!-- Invoice Section -->
                <div>
                    <label class="text-xs text-neutral-500 font-medium mb-2 block">Rechnung & Finanzen</label>
                    <div class="flex items-center gap-2 mb-3" v-if="booking.invoices && booking.invoices.length > 0">
                        <NuxtLink 
                            :to="`/booking-system/invoices/${booking.invoices[0].id}`"
                            class="flex-1 bg-white border border-neutral-200 text-neutral-700 font-medium py-2 rounded-lg text-sm shadow-sm hover:bg-neutral-50 flex items-center justify-center gap-2"
                        >
                            <UIcon name="i-lucide-file-text" size="14" />
                            Rechnung öffnen
                        </NuxtLink>
                         <span :class="getPaymentStatusClass(booking.paymentStatus)" class="px-2 py-1 rounded text-xs font-medium border border-current/10">
                            {{ getPaymentStatusLabel(booking.paymentStatus) }}
                        </span>
                    </div>
                    <div v-else class="text-sm text-neutral-500 italic mb-3">
                        Keine Rechnung erstellt.
                    </div>
                </div>

                <div class="bg-neutral-100 h-px w-full"></div>

                <!-- Quick Actions -->
                <div class="space-y-3">
                    <label class="text-xs text-neutral-500 font-medium block">Aktionen</label>
                    <button
                        @click="editBooking"
                        class="w-full bg-white hover:bg-neutral-50 text-neutral-700 font-medium py-2.5 rounded-lg text-sm border border-neutral-200 shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                         <UIcon name="i-lucide-edit" size="14" />
                        Details bearbeiten
                    </button>
                    
                    <button
                        v-if="booking.status !== 'cancelled'"
                        @click="cancelBooking"
                        class="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2.5 rounded-lg text-sm border border-red-100 shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                         <UIcon name="i-lucide-x-circle" size="14" />
                        Buchung stornieren
                    </button>
                </div>
                
                 <div class="bg-neutral-100 h-px w-full"></div>
                 
                 <div class="text-xs text-neutral-400 space-y-1 pt-2">
                     <p>Zuletzt aktualisiert: {{ formatDate(booking.updatedAt) }}</p>
                 </div>
            </div>
         </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center min-h-[400px]">
        <div class="text-center">
             <UIcon name="i-lucide-loader-2" class="animate-spin text-neutral-400 mb-2 mx-auto" size="32" />
             <p class="text-neutral-500">Lade Buchungsdetails...</p>
        </div>
    </div>

    <!-- Edit Modal -->
    <AppDialogBookingForm
      v-if="showEditModal"
      :booking="booking"
      @close="showEditModal = false"
      @saved="handleBookingSaved"
    />
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const booking = ref(null);
const newStatus = ref('');
const showEditModal = ref(false);
const toast = useToast();

const fetchBooking = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/bookings/${route.params.id}`
    );
    const data = await res.json();
    booking.value = data;
    newStatus.value = data.status;
  } catch (error) {
    console.error('Failed to fetch booking:', error);
    toast.add({
      title: 'Fehler',
      description: 'Buchungsdetails konnten nicht geladen werden.',
      color: 'red',
      icon: 'i-lucide-alert-circle'
    });
  }
};

const updateStatus = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/bookings/${booking.value.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({ status: newStatus.value })
      }
    );

    if (res.ok) {
      await fetchBooking();
      toast.add({
        title: 'Erfolg',
        description: 'Status erfolgreich aktualisiert',
        color: 'green',
        icon: 'i-lucide-check-circle'
      });
    } else {
      toast.add({
        title: 'Fehler',
        description: 'Fehler beim Aktualisieren des Status',
        color: 'red',
        icon: 'i-lucide-x-circle'
      });
    }
  } catch (error) {
    console.error('Failed to update status:', error);
    toast.add({
      title: 'Fehler',
      description: 'Verbindungsfehler beim Aktualisieren des Status',
      color: 'red',
      icon: 'i-lucide-wifi-off'
    });
  }
};

const editBooking = () => {
  showEditModal.value = true;
};

const cancelBooking = async () => {
  if (!confirm('Buchung wirklich stornieren?')) return;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/bookings/${booking.value.id}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      }
    );

    if (res.ok) {
      await fetchBooking();
      toast.add({
        title: 'Erfolg',
        description: 'Buchung erfolgreich storniert',
        color: 'green',
        icon: 'i-lucide-check-circle'
      });
    } else {
      toast.add({
        title: 'Fehler',
        description: 'Fehler beim Stornieren der Buchung',
        color: 'red',
        icon: 'i-lucide-x-circle'
      });
    }
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    toast.add({
      title: 'Fehler',
      description: 'Verbindungsfehler beim Stornieren',
      color: 'red',
      icon: 'i-lucide-wifi-off'
    });
  }
};

const handleBookingSaved = () => {
  showEditModal.value = false;
  fetchBooking();
  toast.add({
    title: 'Gespeichert',
    description: 'Buchung wurde erfolgreich bearbeitet',
    color: 'green',
    icon: 'i-lucide-save'
  });
};

const getStatusBadgeClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-900',
    confirmed: 'bg-green-100 text-green-900',
    cancelled: 'bg-red-100 text-red-900',
    completed: 'bg-blue-100 text-blue-900'
  };
  return classes[status] || 'bg-neutral-100 text-neutral-900';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Ausstehend',
    confirmed: 'Bestätigt',
    cancelled: 'Storniert',
    completed: 'Abgeschlossen'
  };
  return labels[status] || status;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getPaymentStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-900',
    paid: 'bg-green-100 text-green-900',
    failed: 'bg-red-100 text-red-900',
    refunded: 'bg-blue-100 text-blue-900'
  };
  return classes[status] || 'bg-neutral-100 text-neutral-900';
};

const getPaymentStatusLabel = (status) => {
  const labels = {
    pending: 'Ausstehend',
    paid: 'Bezahlt',
    failed: 'Fehlgeschlagen',
    refunded: 'Erstattet'
  };
  return labels[status] || status;
};

const copyPaymentLink = async () => {
  try {
    await navigator.clipboard.writeText(booking.value.paymentLink);
    alert('Zahlungslink in Zwischenablage kopiert');
  } catch (error) {
    console.error('Failed to copy:', error);
    alert('Fehler beim Kopieren des Links');
  }
};

onMounted(() => {
  fetchBooking();
});
</script>

<style scoped></style>
