<template>
  <div class="p-4">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/booking-system/bookings"
        class="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10"
      >
        <UIcon name="i-lucide-arrow-left" size="20" />
      </NuxtLink>
      <h1 class="text-lg font-bold">Buchungsdetails #{{ booking?.id }}</h1>
    </div>

    <div v-if="booking" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Main Info -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Booking Info -->
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Buchungsinformationen</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">Start</label>
              <p class="text-sm">{{ formatDate(booking.startTime) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">Ende</label>
              <p class="text-sm">{{ formatDate(booking.endTime) }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">Status</label>
              <span
                :class="getStatusBadgeClass(booking.status)"
                class="px-2 py-1 rounded-lg text-xs border border-black/10 inline-block"
              >
                {{ getStatusLabel(booking.status) }}
              </span>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">Preis</label>
              <p class="text-sm font-semibold">{{ booking.totalPrice }} {{ booking.currency }}</p>
            </div>
          </div>
          <div v-if="booking.notes" class="mt-4">
            <label class="block text-sm font-medium text-neutral-600 mb-1">Notizen</label>
            <p class="text-sm bg-neutral-50 p-3 rounded-lg">{{ booking.notes }}</p>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Zahlungsinformationen</h2>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">Zahlungsstatus</label>
              <span
                :class="getPaymentStatusClass(booking.paymentStatus)"
                class="px-2 py-1 rounded-lg text-xs border border-black/10 inline-block"
              >
                {{ getPaymentStatusLabel(booking.paymentStatus) }}
              </span>
            </div>
            <div v-if="booking.paymentLink">
              <label class="block text-sm font-medium text-neutral-600 mb-1">Zahlungslink</label>
              <div class="flex items-center gap-2">
                <a
                  :href="booking.paymentLink"
                  target="_blank"
                  class="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {{ booking.paymentLink }}
                </a>
                <button
                  @click="copyPaymentLink"
                  class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-black/10"
                  title="Link kopieren"
                >
                  <UIcon name="i-lucide-copy" size="16" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Resource Info -->
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Ressource</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">Name</label>
              <p class="text-sm">{{ booking.resource?.title || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">Typ</label>
              <p class="text-sm capitalize">{{ booking.resource?.type || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">Kapazität</label>
              <p class="text-sm">{{ booking.resource?.capacity || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- User Info -->
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Nutzer</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">Benutzername</label>
              <p class="text-sm">{{ booking.user?.username || 'N/A' }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-600 mb-1">E-Mail</label>
              <p class="text-sm">{{ booking.user?.email || 'N/A' }}</p>
            </div>
            <div v-if="booking.user?.firstName || booking.user?.lastName">
              <label class="block text-sm font-medium text-neutral-600 mb-1">Name</label>
              <p class="text-sm">
                {{ booking.user?.firstName }} {{ booking.user?.lastName }}
              </p>
            </div>
            <div v-if="booking.user?.phone">
              <label class="block text-sm font-medium text-neutral-600 mb-1">Telefon</label>
              <p class="text-sm">{{ booking.user?.phone }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Sidebar -->
      <div class="space-y-4">
        <!-- Status Change -->
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Status ändern</h2>
          <select
            v-model="newStatus"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm text-sm mb-3"
          >
            <option value="pending">Ausstehend</option>
            <option value="confirmed">Bestätigt</option>
            <option value="cancelled">Storniert</option>
            <option value="completed">Abgeschlossen</option>
          </select>
          <button
            @click="updateStatus"
            :disabled="newStatus === booking.status"
            class="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg text-sm border border-black/10 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Status aktualisieren
          </button>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Aktionen</h2>
          <div class="space-y-2">
            <button
              @click="editBooking"
              class="w-full bg-neutral-100 hover:bg-neutral-200 font-bold py-2 rounded-lg text-sm border border-black/10 shadow-sm"
            >
              Bearbeiten
            </button>
            <button
              v-if="booking.status !== 'cancelled'"
              @click="cancelBooking"
              class="w-full bg-red-100 hover:bg-red-200 text-red-900 font-bold py-2 rounded-lg text-sm border border-black/10 shadow-sm"
            >
              Stornieren
            </button>
          </div>
        </div>

        <!-- Metadata -->
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Metadaten</h2>
          <div class="space-y-2 text-sm">
            <div>
              <label class="block text-xs text-neutral-600">Erstellt am</label>
              <p>{{ formatDate(booking.createdAt) }}</p>
            </div>
            <div>
              <label class="block text-xs text-neutral-600">Aktualisiert am</label>
              <p>{{ formatDate(booking.updatedAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-white rounded-lg p-8 border border-black/10 shadow-sm text-center">
      <p class="text-neutral-500">Buchung wird geladen...</p>
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
      alert('Status erfolgreich aktualisiert');
    } else {
      alert('Fehler beim Aktualisieren des Status');
    }
  } catch (error) {
    console.error('Failed to update status:', error);
    alert('Fehler beim Aktualisieren des Status');
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
    } else {
      alert('Fehler beim Stornieren der Buchung');
    }
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    alert('Fehler beim Stornieren der Buchung');
  }
};

const handleBookingSaved = () => {
  showEditModal.value = false;
  fetchBooking();
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
