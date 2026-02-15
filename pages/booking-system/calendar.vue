<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 font-sans">
    <BookingVoucherModal v-if="showVoucherModal" @close="showVoucherModal=false"/>
    <header
      class="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between flex-shrink-0 z-20 gap-4"
    >
      <div class="flex items-center gap-4">
        <div>
          <h1 class="text-xl font-semibold text-slate-900 tracking-tight">
            Buchungsverwaltung
          </h1>
          <p class="text-sm text-slate-500">Alle Reservierungen verwalten</p>
        </div>

        <div class="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

        <select
          v-model="selectedResourceId"
          class="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2 min-w-[180px]"
        >
          <option value="all">Alle Ressourcen</option>
          <option v-for="res in resources" :key="res.id" :value="res.id">
            {{ res.name }}
          </option>
        </select>
      </div>

      <div class="flex items-center space-x-4">
        <div class="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
          <button
            v-for="view in ['calendar', 'list']"
            :key="view"
            @click="currentView = view"
            :class="[
              'px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all',
              currentView === view
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            ]"
          >
            {{ view === "calendar" ? "Kalender" : "Liste" }}
          </button>
        </div>

        <div
          v-if="currentView === 'calendar'"
          class="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm"
        >
          <button
            @click="changeMonth(-1)"
            class="p-2 hover:bg-slate-50 text-slate-600 border-r border-slate-100"
          >
            <span class="sr-only">Prev</span>←
          </button>
          <span
            class="px-4 py-1.5 text-sm font-medium text-slate-900 min-w-[140px] text-center"
            >{{ currentMonthLabel }}</span
          >
          <button
            @click="changeMonth(1)"
            class="p-2 hover:bg-slate-50 text-slate-600 border-l border-slate-100"
          >
            <span class="sr-only">Next</span>→
          </button>
        </div>

        <button
          @click="openCreateModal()"
          class="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
        >
          <span>+</span> Buchung
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-hidden relative flex">
      <div
        v-if="loading"
        class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center"
      >
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"
        ></div>
      </div>

      <div class="flex-1 p-6 overflow-hidden">
        <BookingCalendar
          v-if="currentView === 'calendar'"
          :bookings="filteredBookings"
          :currentDate="currentDate"
          @select="selectBooking"
          @create="openCreateModal"
          @drop-booking="handleDrop"
          @drag-start="handleDragStart"
        />

        <BookingList
          v-else
          :bookings="filteredBookings"
          @select="selectBooking"
        />
      </div>

      <transition
        enter-active-class="transform transition ease-in-out duration-300"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transform transition ease-in-out duration-300"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <div
          v-if="selectedBooking"
          class="absolute inset-y-0 right-0 w-96 z-20 shadow-xl"
        >
          <BookingDetails
            :booking="selectedBooking"
            @close="selectedBooking = null"
            @edit="openEditModal"
            @cancel="handleCancel"
            @delete="handleDeletion"
            @update-status="refreshData"
            @welcome-email="showVoucherModal = true"
          />
        </div>
      </transition>
    </main>

    <BookingFormModal
      :isOpen="isModalOpen"
      :editData="editingBooking"
      :initialDate="createDate"
      @close="closeModal"
      @saved="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import BookingCalendar from "@/components/booking/BookingCalendar.vue";
import BookingList from "@/components/booking/BookingList.vue";
import BookingDetails from "@/components/booking/BookingDetails.vue";
import BookingFormModal from "@/components/booking/BookingFormModal.vue";

const api = useBookingApi();

// State
const loading = ref(false);
const currentView = ref("calendar");
const currentDate = ref(new Date());
const bookings = ref([]);
const resources = ref([]);
const selectedResourceId = ref("all");
const selectedBooking = ref(null);
const draggedBooking = ref<any | null>(null);
const createDate = ref<Date | null>(null);
const route = useRoute();
const showVoucherModal = ref(false);

// Modal State
const isModalOpen = ref(false);
const editingBooking = ref(null);

// Computed
const currentMonthLabel = computed(() =>
  currentDate.value.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  }),
);

const filteredBookings = computed(() => {
  if (selectedResourceId.value === "all") return bookings.value;
  return bookings.value.filter(
    (b: any) => b.resource_id == selectedResourceId.value,
  );
});

// Actions
const loadBookings = async () => {
  loading.value = true;
  try {
    let params: any = {};

    if (currentView.value === "calendar") {
      const start = new Date(currentDate.value);
      start.setMonth(start.getMonth() - 2);
      const end = new Date(currentDate.value);
      end.setMonth(end.getMonth() + 2);

      params.start = start.toISOString();
      params.end = end.toISOString();
    }
    // else: params bleibt leer -> Backend liefert alles

    const [bookingsData, resourcesData] = await Promise.all([
      api.bookings.getAll(params),
      api.resources.getAll(),
    ]);

    bookings.value = bookingsData || [];
    resources.value = resourcesData || [];
  } finally {
    loading.value = false;
  }
};

// Reload when view changes (to switch between partial load and full load)
watch(currentView, () => {
  loadBookings();
});

const changeMonth = (delta: number) => {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() + delta);
  currentDate.value = d;
  if (currentView.value === "calendar") {
    loadBookings();
  }
};

const selectBooking = (b: any) => (selectedBooking.value = b);

const openCreateModal = (date?: Date) => {
  editingBooking.value = null;
  createDate.value = date || null;
  isModalOpen.value = true;
};

const openEditModal = (b: any) => {
  console.log(b);
  editingBooking.value = b;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingBooking.value = null;
  createDate.value = null;
};

const refreshData = async () => {
  await loadBookings();
  if (selectedBooking.value) {
    const updated = bookings.value.find(
      (b: any) => b.id === selectedBooking.value.id,
    );
    if (updated) selectedBooking.value = updated;
  }
};

const handleCancel = async (b: any) => {
  refreshData();
};

const handleDeletion = async (b: any) => {
  if (confirm("Wirklich löschen?")) {
    await api.bookings.delete(b.id);
    refreshData();
  }
};

const handleDrop = async ({ date, event }: any) => {
  if (!draggedBooking.value || !date) return;
  const originalStart = new Date(draggedBooking.value.start_at);
  const originalEnd = draggedBooking.value.end_at
    ? new Date(draggedBooking.value.end_at)
    : new Date(draggedBooking.value.start_at);
  const durationMs = originalEnd.getTime() - originalStart.getTime();
  const newStart = new Date(date);
  newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
  const newEnd = new Date(
    newStart.getTime() + Math.max(durationMs, 60 * 60 * 1000),
  );
  try {
    await api.bookings.update(draggedBooking.value.id, {
      start_at: formatDatetime(newStart),
      end_at: formatDatetime(newEnd),
    });
    await refreshData();
  } finally {
    draggedBooking.value = null;
  }
};

const handleDragStart = ({ booking }: any) => {
  draggedBooking.value = booking;
};

const formatDatetime = (d: Date) => {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

onMounted(async () => {
  await loadBookings();

  const rawId = route.query.id;
  const id = rawId !== undefined ? Number(rawId) : null;

  if (!id || Number.isNaN(id)) {
    console.warn("Ungültige Booking-ID:", rawId);
    return;
  }

  const foundBooking = bookings.value.find((booking) => booking.id === id);

  if (!foundBooking) {
    console.warn("Keine Buchung mit dieser ID gefunden:", id);
    return;
  }

  selectedBooking.value = foundBooking;
});
</script>
