<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
    
    <div class="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50/50">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Suchen nach Name oder Ressource..." 
          class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
        >
      </div>
      <div>
        <input 
          v-model="dateFilter" 
          type="date" 
          class="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white text-slate-600"
        >
      </div>
      <button 
        v-if="searchQuery || dateFilter" 
        @click="resetFilters"
        class="px-3 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        Reset
      </button>
    </div>

    <div class="overflow-y-auto flex-1">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50 sticky top-0 z-10">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Datum</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ressource</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nutzer</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aktion</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr v-if="filteredAndSortedBookings.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-slate-500 text-sm">
              Keine Buchungen gefunden.
            </td>
          </tr>
          <tr
            v-for="booking in filteredAndSortedBookings"
            :key="booking.id"
            class="hover:bg-slate-50 cursor-pointer transition-colors"
            @click="$emit('select', booking)"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
              <div v-html="formatDateRange(booking.start_at, booking.end_at)"></div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
              {{ booking.resource_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                  {{ booking.user_name?.substring(0,1).toUpperCase() }}
                </div>
                {{ booking.user_name }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="['px-2.5 py-0.5 text-xs font-medium rounded-full border', getStatusBadge(booking)]">
                {{ translateStatus(booking.status) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button class="text-slate-400 hover:text-slate-900">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{ bookings: any[] }>();
defineEmits(["select"]);

// Filter State
const searchQuery = ref("");
const dateFilter = ref("");

const resetFilters = () => {
  searchQuery.value = "";
  dateFilter.value = "";
};

// Filter & Sort Logic
const filteredAndSortedBookings = computed(() => {
  let list = [...props.bookings];

  // 1. Text Search (Name or Resource)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (b) =>
        b.user_name?.toLowerCase().includes(q) ||
        b.resource_name?.toLowerCase().includes(q)
    );
  }

  // 2. Date Filter
  if (dateFilter.value) {
    const filterDate = new Date(dateFilter.value);
    const filterStart = new Date(filterDate);
    filterStart.setHours(0, 0, 0, 0);
    const filterEnd = new Date(filterDate);
    filterEnd.setHours(23, 59, 59, 999);
    list = list.filter((b) => {
      const bookingStart = new Date(b.start_at);
      const bookingEnd = b.end_at ? new Date(b.end_at) : new Date(b.start_at);
      return bookingStart <= filterEnd && bookingEnd >= filterStart;
    });
  }

  // 3. Sort (Neueste zuerst)
  return list.sort(
    (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
  );
});

// Helpers
const formatDateRange = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const dateOpts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

  if (s.toDateString() === e.toDateString()) {
    return `<span class="font-medium">${s.toLocaleDateString("de-DE", dateOpts)}</span><br><span class="text-slate-500 text-xs">${s.toLocaleTimeString("de-DE", timeOpts)} - ${e.toLocaleTimeString("de-DE", timeOpts)}</span>`;
  } else {
    return `<span class="font-medium">${s.toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit' })}</span> <span class="text-xs text-slate-400">bis</span> <span class="font-medium">${e.toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit' })}</span><br><span class="text-slate-500 text-xs">${s.toLocaleTimeString("de-DE", timeOpts)} - ${e.toLocaleTimeString("de-DE", timeOpts)}</span>`;
  }
};

const getStatusBadge = (b: any) => {
  switch (b.status) {
    case "CANCELLED": return "bg-slate-50 text-slate-500 border-slate-200";
    case "PENDING": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "CONFIRMED": return "bg-green-50 text-green-700 border-green-200";
    default: return "bg-white text-slate-700 border-slate-200";
  }
};

const translateStatus = (status: string) => {
  const map: Record<string, string> = {
    'CONFIRMED': 'Bestätigt',
    'PENDING': 'Ausstehend',
    'CANCELLED': 'Storniert'
  };
  return map[status] || status;
};
</script>
