<template>
  <div class="bg-white h-full flex flex-col">
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <UiIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
        />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Suchen nach Name oder Ressource…"
          class="w-full rounded-none border border-neutral-200 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>
      <input
        v-model="dateFilter"
        type="date"
        class="rounded-none border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400"
      />
      <button
        v-if="searchQuery || dateFilter"
        type="button"
        class="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900"
        @click="resetFilters"
      >
        Zurücksetzen
      </button>
    </div>

    <BookingOverviewTable
      :bookings="filteredAndSortedBookings"
      empty-text="Keine Buchungen gefunden."
      @select="$emit('select', $event)"
      @cancel="$emit('cancel', $event)"
      @edit="$emit('edit', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import BookingOverviewTable from "@/components/booking/BookingOverviewTable.vue";

const props = defineProps<{ bookings: any[] }>();
defineEmits<{
  select: [booking: any];
  cancel: [booking: any];
  edit: [booking: any];
}>();

const searchQuery = ref("");
const dateFilter = ref("");

const resetFilters = () => {
  searchQuery.value = "";
  dateFilter.value = "";
};

const filteredAndSortedBookings = computed(() => {
  let list = [...props.bookings];

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (b) =>
        b.user_name?.toLowerCase().includes(q) ||
        b.resource_name?.toLowerCase().includes(q) ||
        b.User?.details?.first_name?.toLowerCase().includes(q) ||
        b.User?.details?.last_name?.toLowerCase().includes(q) ||
        b.User?.details?.company?.toLowerCase().includes(q),
    );
  }

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

  return list.sort(
    (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime(),
  );
});
</script>
