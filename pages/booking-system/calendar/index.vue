<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">Kalenderansicht</h1>
      <div class="flex items-center gap-2">
        <select
          v-model="selectedResourceId"
          @change="fetchBookings"
          class="p-2 border rounded-lg border-black/10 shadow-sm text-sm"
        >
          <option value="">Alle Ressourcen</option>
          <option v-for="resource in resources" :key="resource.id" :value="resource.id">
            {{ resource.title }}
          </option>
        </select>
        <select
          v-model="viewMode"
          class="p-2 border rounded-lg border-black/10 shadow-sm text-sm"
        >
          <option value="month">Monat</option>
          <option value="week">Woche</option>
          <option value="day">Tag</option>
        </select>
      </div>
    </div>

    <!-- Month Navigation -->
    <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm mb-4">
      <div class="flex items-center justify-between">
        <button
          @click="previousPeriod"
          class="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-black/10"
        >
          <UIcon name="i-lucide-chevron-left" size="20" />
        </button>
        <h2 class="text-lg font-semibold">{{ currentPeriodLabel }}</h2>
        <button
          @click="nextPeriod"
          class="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-black/10"
        >
          <UIcon name="i-lucide-chevron-right" size="20" />
        </button>
      </div>
    </div>

    <!-- Calendar View -->
    <div v-if="viewMode === 'month'" class="bg-white rounded-lg border border-black/10 shadow-sm overflow-hidden">
      <!-- Weekday Headers -->
      <div class="grid grid-cols-7 bg-neutral-50 border-b border-black/10">
        <div
          v-for="day in ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']"
          :key="day"
          class="p-2 text-center text-sm font-semibold border-r border-black/10 last:border-r-0"
        >
          {{ day }}
        </div>
      </div>
      <!-- Calendar Days -->
      <div class="grid grid-cols-7">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="[
            'min-h-24 p-2 border-r border-b border-black/10',
            day.isCurrentMonth ? 'bg-white' : 'bg-neutral-50',
            day.isToday ? 'bg-yellow-50' : ''
          ]"
        >
          <div class="text-sm font-semibold mb-1" :class="day.isCurrentMonth ? '' : 'text-neutral-400'">
            {{ day.date.getDate() }}
          </div>
          <div class="space-y-1">
            <div
              v-for="booking in getBookingsForDay(day.date)"
              :key="booking.id"
              :class="getBookingClass(booking.status)"
              class="text-xs p-1 rounded cursor-pointer truncate"
              @click="viewBooking(booking)"
              :title="`${booking.resource?.title} - ${booking.user?.username}`"
            >
              {{ formatTime(booking.startTime) }} {{ booking.resource?.title }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Week/Day View -->
    <div v-else class="bg-white rounded-lg border border-black/10 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-neutral-50">
            <tr>
              <th class="px-3 py-2 text-sm text-left border-r border-black/10">Zeit</th>
              <th
                v-for="day in viewDays"
                :key="day.toISOString()"
                class="px-3 py-2 text-sm text-left border-r border-black/10 last:border-r-0"
              >
                {{ formatDayHeader(day) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="hour in 24" :key="hour" class="border-t border-black/10">
              <td class="px-3 py-2 text-sm border-r border-black/10 bg-neutral-50">
                {{ String(hour - 1).padStart(2, '0') }}:00
              </td>
              <td
                v-for="day in viewDays"
                :key="day.toISOString()"
                class="px-3 py-2 text-sm border-r border-black/10 last:border-r-0 relative"
              >
                <div
                  v-for="booking in getBookingsForHour(day, hour - 1)"
                  :key="booking.id"
                  :class="getBookingClass(booking.status)"
                  class="text-xs p-1 rounded cursor-pointer mb-1"
                  @click="viewBooking(booking)"
                >
                  {{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}<br />
                  {{ booking.resource?.title }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
const router = useRouter();
const currentDate = ref(new Date());
const viewMode = ref('month');
const selectedResourceId = ref('');
const resources = ref([]);
const bookings = ref([]);

const currentPeriodLabel = computed(() => {
  if (viewMode.value === 'month') {
    return currentDate.value.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  } else if (viewMode.value === 'week') {
    return `KW ${getWeekNumber(currentDate.value)} ${currentDate.value.getFullYear()}`;
  } else {
    return currentDate.value.toLocaleDateString('de-DE', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  }
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get Monday of the week containing the first day
  const startDate = new Date(firstDay);
  const dayOfWeek = startDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + diff);
  
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 42; i++) {
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

const viewDays = computed(() => {
  if (viewMode.value === 'day') {
    return [new Date(currentDate.value)];
  } else {
    // Week view
    const days = [];
    const startOfWeek = new Date(currentDate.value);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  }
});

const fetchResources = async () => {
  try {
    const res = await fetch(import.meta.env.VITE_INTERNAL_API_URL + '/resources');
    const data = await res.json();
    resources.value = data;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
  }
};

const fetchBookings = async () => {
  try {
    let startDate, endDate;
    
    if (viewMode.value === 'month') {
      startDate = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1);
      endDate = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0);
    } else if (viewMode.value === 'week') {
      const start = new Date(currentDate.value);
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      start.setDate(start.getDate() + diff);
      startDate = start;
      endDate = new Date(start);
      endDate.setDate(endDate.getDate() + 6);
    } else {
      startDate = new Date(currentDate.value);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentDate.value);
      endDate.setHours(23, 59, 59, 999);
    }

    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    if (selectedResourceId.value) {
      params.append('resourceId', selectedResourceId.value);
    }

    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/bookings/range?${params.toString()}`
    );
    const data = await res.json();
    bookings.value = data;
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
  }
};

const getBookingsForDay = (date) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return bookings.value.filter(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return (start >= dayStart && start <= dayEnd) || 
           (end >= dayStart && end <= dayEnd) ||
           (start <= dayStart && end >= dayEnd);
  });
};

const getBookingsForHour = (date, hour) => {
  const hourStart = new Date(date);
  hourStart.setHours(hour, 0, 0, 0);
  const hourEnd = new Date(date);
  hourEnd.setHours(hour, 59, 59, 999);

  return bookings.value.filter(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return (start >= hourStart && start <= hourEnd) || 
           (end >= hourStart && end <= hourEnd) ||
           (start <= hourStart && end >= hourEnd);
  });
};

const getBookingClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-900 border border-yellow-300',
    confirmed: 'bg-green-100 text-green-900 border border-green-300',
    cancelled: 'bg-red-100 text-red-900 border border-red-300',
    completed: 'bg-blue-100 text-blue-900 border border-blue-300'
  };
  return classes[status] || 'bg-neutral-100 text-neutral-900 border border-neutral-300';
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

const formatDayHeader = (date) => {
  return date.toLocaleDateString('de-DE', { 
    weekday: 'short', 
    day: '2-digit', 
    month: '2-digit' 
  });
};

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const previousPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
  } else if (viewMode.value === 'week') {
    currentDate.value.setDate(currentDate.value.getDate() - 7);
  } else {
    currentDate.value.setDate(currentDate.value.getDate() - 1);
  }
  fetchBookings();
};

const nextPeriod = () => {
  if (viewMode.value === 'month') {
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
  } else if (viewMode.value === 'week') {
    currentDate.value.setDate(currentDate.value.getDate() + 7);
  } else {
    currentDate.value.setDate(currentDate.value.getDate() + 1);
  }
  fetchBookings();
};

const viewBooking = (booking) => {
  router.push(`/booking-system/bookings/${booking.id}`);
};

watch(viewMode, () => {
  fetchBookings();
});

onMounted(() => {
  fetchResources();
  fetchBookings();
});
</script>

<style scoped></style>
