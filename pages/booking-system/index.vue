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

    <!-- Calendar View -->


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
            <td class="px-3 py-2 text-sm">{{ booking.user?.username || 'N/A' }}</td>
            <td class="px-3 py-2 text-sm">{{ booking.resource?.title || 'N/A' }}</td>
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
            <td class="px-3 py-2 text-sm text-right">{{ booking.totalPrice }} €</td>
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
  revenueThisMonth: 0,
  totalRevenue: 0
});

const recentBookings = ref([]);

const fetchDashboardData = async () => {
  try {
    const res = await fetch(import.meta.env.VITE_INTERNAL_API_URL + '/stats/dashboard');
    const data = await res.json();

    stats.value = data.overview;
    // statusDistribution.value = data.statusDistribution; // Removed
    recentBookings.value = data.recentBookings;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
};

// Calendar Logic
const calendarDate = ref(new Date());
const calendarBookings = ref([]);

const calendarDays = computed(() => {
  const year = calendarDate.value.getFullYear();
  const month = calendarDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = new Date(firstDay);
  const dayOfWeek = startDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + diff);
  
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 42; i++) { // 6 weeks
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      isToday: date.getTime() === today.getTime()
    });
  }
  return days;
});

const fetchCalendarBookings = async () => {
    try {
        const year = calendarDate.value.getFullYear();
        const month = calendarDate.value.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        // Add buffer for prev/next month days shown
        startDate.setDate(startDate.getDate() - 7);
        endDate.setDate(endDate.getDate() + 7);

        const params = new URLSearchParams({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        const res = await fetch(
            `${import.meta.env.VITE_INTERNAL_API_URL}/bookings/range?${params.toString()}`
        );
        const data = await res.json();
        calendarBookings.value = data;
    } catch (e) {
        console.error("Failed to fetch calendar bookings", e);
    }
}

const getBookingsForDay = (date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return calendarBookings.value.filter(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    // Simple overlap check
    return start < dayEnd && end > dayStart;
  });
};

const getStatusDotColor = (status) => {
    const colors = {
        pending: 'bg-yellow-400',
        confirmed: 'bg-green-400',
        cancelled: 'bg-red-400',
        completed: 'bg-blue-400'
    };
    return colors[status] || 'bg-neutral-400';
};

const calendarPrevMonth = () => {
    calendarDate.value = new Date(calendarDate.value.getFullYear(), calendarDate.value.getMonth() - 1, 1);
    fetchCalendarBookings();
};

const calendarNextMonth = () => {
     calendarDate.value = new Date(calendarDate.value.getFullYear(), calendarDate.value.getMonth() + 1, 1);
     fetchCalendarBookings();
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-400',
    confirmed: 'bg-green-400',
    cancelled: 'bg-red-400',
    completed: 'bg-blue-400'
  };
  return colors[status] || 'bg-neutral-400';
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

onMounted(() => {
  fetchDashboardData();
  fetchCalendarBookings();
});
</script>

<style scoped></style>