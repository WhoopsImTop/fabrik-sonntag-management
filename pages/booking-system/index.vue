<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-6">Buchungssystem Dashboard</h1>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <app-stat-card
        title="Gesamtbuchungen"
        :value="stats.totalBookings"
        icon="i-lucide-calendar"
        color="blue"
      />
      <app-stat-card
        title="Aktive Buchungen"
        :value="stats.activeBookings"
        icon="i-lucide-calendar-check"
        color="green"
      />
      <app-stat-card
        title="Ausstehend"
        :value="stats.pendingBookings"
        icon="i-lucide-clock"
        color="yellow"
      />
      <app-stat-card
        title="Umsatz (Monat)"
        :value="`${stats.revenueThisMonth.toFixed(2)} €`"
        icon="i-lucide-euro"
        color="purple"
      />
    </div>

    <!-- Recent Bookings -->
    <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
      <h2 class="text-lg font-semibold mb-4">Aktuelle Buchungen</h2>
      <table class="w-full">
        <thead class="bg-neutral-50">
          <tr class="text-left">
            <th class="px-3 py-1.5 text-sm">Nutzer</th>
            <th class="px-3 py-1.5 text-sm">Ressource</th>
            <th class="px-3 py-1.5 text-sm">Zeitraum</th>
            <th class="px-3 py-1.5 text-sm">Status</th>
            <th class="px-3 py-1.5 text-sm text-right">Preis</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in recentBookings" :key="booking.id" class="border-t border-black/10">
            <td class="px-3 py-2 text-sm">
              {{ booking.user?.firstName || '' }} {{ booking.user?.lastName || 'N/A' }}
            </td>
            <td class="px-3 py-2 text-sm">{{ booking.resource?.name || 'N/A' }}</td>
            <td class="px-3 py-2 text-sm">
              {{ formatDate(booking.startTime) }} - {{ formatDate(booking.endTime) }}
            </td>
            <td class="px-3 py-2 text-sm">
              <span
                :class="getStatusBadgeClass(booking.status)"
                class="px-2 py-1 rounded-lg text-xs border border-black/10"
              >
                {{ getStatusLabel(booking.status) }}
              </span>
            </td>
            <td class="px-3 py-2 text-sm text-right">{{ parseFloat(booking.totalPrice).toFixed(2) }} €</td>
          </tr>
          <tr v-if="recentBookings.length === 0">
            <td colspan="5" class="px-3 py-4 text-sm text-center text-neutral-500">
              Keine Buchungen vorhanden
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const stats = ref({
  totalBookings: 0,
  activeBookings: 0,
  pendingBookings: 0,
  revenueThisMonth: 0
});

const recentBookings = ref([]);

const fetchDashboardData = async () => {
  try {
    // Fetch all bookings from new admin API
    const bookingsRes = await fetch(
      import.meta.env.VITE_INTERNAL_API_URL + '/admin/bookings',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      }
    );
    const allBookings = await bookingsRes.json();

    // Calculate stats
    stats.value.totalBookings = allBookings.length;
    stats.value.activeBookings = allBookings.filter(b => b.status === 'CONFIRMED').length;
    stats.value.pendingBookings = allBookings.filter(b => b.status === 'REQUESTED').length;
    
    // Calculate revenue for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    stats.value.revenueThisMonth = allBookings
      .filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear &&
               b.status !== 'CANCELLED';
      })
      .reduce((sum, b) => sum + parseFloat(b.totalPrice || 0), 0);

    // Get recent bookings (last 10)
    recentBookings.value = allBookings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
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

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped></style>