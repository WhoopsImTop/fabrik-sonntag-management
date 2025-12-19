<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">Buchungsverwaltung</h1>
      <button
        class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
        @click="openCreateModal"
      >
        Neue Buchung
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <select
            v-model="filters.status"
            @change="fetchBookings"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm text-sm"
          >
            <option value="">Alle</option>
            <option value="REQUESTED">Ausstehend</option>
            <option value="CONFIRMED">Bestätigt</option>
            <option value="CANCELLED">Storniert</option>
            <option value="COMPLETED">Abgeschlossen</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Ressource</label>
          <select
            v-model="filters.resourceId"
            @change="fetchBookings"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm text-sm"
          >
            <option value="">Alle</option>
            <option v-for="resource in resources" :key="resource.id" :value="resource.id">
              {{ resource.name }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="resetFilters"
            class="w-full bg-neutral-100 hover:bg-neutral-200 font-bold py-2 rounded-lg text-sm border border-black/10 shadow-sm"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>
    </div>

    <!-- Bookings Table -->
    <table class="w-full rounded-lg overflow-hidden border border-black/10 shadow-sm bg-white">
      <thead class="bg-neutral-50">
        <tr class="text-left">
          <th class="px-3 py-1.5 text-sm">ID</th>
          <th class="px-3 py-1.5 text-sm">Nutzer</th>
          <th class="px-3 py-1.5 text-sm">Ressource</th>
          <th class="px-3 py-1.5 text-sm">Start</th>
          <th class="px-3 py-1.5 text-sm">Ende</th>
          <th class="px-3 py-1.5 text-sm">Status</th>
          <th class="px-3 py-1.5 text-sm text-right">Preis</th>
          <th class="px-3 py-1.5 text-sm text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="booking in bookings" :key="booking.id" class="border-t border-black/10">
          <td class="px-3 py-2 text-sm">#{{ booking.id }}</td>
          <td class="px-3 py-2 text-sm">{{ booking.user?.firstName || '' }} {{ booking.user?.lastName || 'N/A' }}</td>
          <td class="px-3 py-2 text-sm">{{ booking.resource?.name || 'N/A' }}</td>
          <td class="px-3 py-2 text-sm">{{ formatDate(booking.startTime) }}</td>
          <td class="px-3 py-2 text-sm">{{ formatDate(booking.endTime) }}</td>
          <td class="px-3 py-2 text-sm">
            <span
              :class="getStatusBadgeClass(booking.status)"
              class="px-2 py-1 rounded-lg text-xs border border-black/10"
            >
              {{ getStatusLabel(booking.status) }}
            </span>
          </td>
          <td class="px-3 py-2 text-sm text-right">{{ parseFloat(booking.totalPrice).toFixed(2) }} €</td>
          <td class="px-3 py-2 text-sm flex items-center gap-1 justify-end">
            <NuxtLink
              :to="`/booking-system/bookings/${booking.id}`"
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              title="Details"
            >
              <UIcon name="i-lucide-eye" size="16" />
            </NuxtLink>
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="editBooking(booking)"
              title="Bearbeiten"
            >
              <UIcon name="i-lucide-edit" size="16" />
            </div>
            <div
              v-if="booking.status !== 'cancelled'"
              class="p-1 rounded-lg bg-neutral-50 hover:bg-red-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="cancelBooking(booking)"
              title="Stornieren"
            >
              <UIcon name="i-lucide-x-circle" size="16" />
            </div>
          </td>
        </tr>
        <tr v-if="bookings.length === 0">
          <td colspan="9" class="px-3 py-4 text-sm text-center text-neutral-500">
            Keine Buchungen gefunden
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Booking Form Dialog -->
    <AppDialogBookingForm
      v-if="showBookingModal"
      :booking="selectedBooking"
      @close="closeModal"
      @saved="handleBookingSaved"
    />
  </div>
</template>

<script setup>
const bookings = ref([]);
const resources = ref([]);
const showBookingModal = ref(false);
const selectedBooking = ref(null);

const filters = ref({
  status: '',
  resourceId: ''
});

const fetchBookings = async () => {
  try {
    const params = new URLSearchParams();
    if (filters.value.status) params.append('status', filters.value.status);
    if (filters.value.resourceId) params.append('resourceId', filters.value.resourceId);

    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/admin/bookings?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      }
    );
    const data = await res.json();
    bookings.value = data.bookings;
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
  }
};

const fetchResources = async () => {
  try {
    const res = await fetch(
      import.meta.env.VITE_INTERNAL_API_URL + '/resources',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      }
    );
    const data = await res.json();
    resources.value = data;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
  }
};

const resetFilters = () => {
  filters.value = {
    status: '',
    resourceId: ''
  };
  fetchBookings();
};

const openCreateModal = () => {
  selectedBooking.value = null;
  showBookingModal.value = true;
};

const editBooking = (booking) => {
  selectedBooking.value = booking;
  showBookingModal.value = true;
};

const cancelBooking = async (booking) => {
  if (!confirm(`Buchung #${booking.id} wirklich stornieren?`)) return;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/admin/bookings/${booking.id}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({ status: 'CANCELLED' })
      }
    );

    if (res.ok) {
      await fetchBookings();
    } else {
      alert('Fehler beim Stornieren der Buchung');
    }
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    alert('Fehler beim Stornieren der Buchung');
  }
};

const closeModal = () => {
  showBookingModal.value = false;
  selectedBooking.value = null;
};

const handleBookingSaved = () => {
  closeModal();
  fetchBookings();
};

const getStatusBadgeClass = (status) => {
  const classes = {
    'REQUESTED': 'bg-yellow-100 text-yellow-900',
    'CONFIRMED': 'bg-green-100 text-green-900',
    'CANCELLED': 'bg-red-100 text-red-900',
    'COMPLETED': 'bg-blue-100 text-blue-900'
  };
  return classes[status] || 'bg-neutral-100 text-neutral-900';
};

const getStatusLabel = (status) => {
  const labels = {
    'REQUESTED': 'Ausstehend',
    'CONFIRMED': 'Bestätigt',
    'CANCELLED': 'Storniert',
    'COMPLETED': 'Abgeschlossen'
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

onMounted(() => {
  fetchBookings();
  fetchResources();
});
</script>

<style scoped></style>
