<template>
  <div
    class="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-white font-sans"
  >
    <BookingVoucherModal
      v-if="showVoucherModal"
      :initial-email="selectedBooking?.User?.email || ''"
      :user-id="selectedBooking?.user_id"
      :booking-id="selectedBooking?.id"
      @close="showVoucherModal = false"
      @success="handleWelcomeEmailSuccess"
    />

    <header class="z-20 shrink-0 border-b border-neutral-200 pb-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
          Buchungskalender
        </h1>

        <div class="flex flex-wrap items-center gap-3">
          <div
            class="inline-flex overflow-hidden rounded-none border border-neutral-200"
            role="group"
            aria-label="Ansicht wählen"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1.5 py-2 text-sm font-medium transition-colors"
              :class="
                currentView === 'list'
                  ? 'bg-neutral-900 px-3 text-white'
                  : 'bg-white px-2.5 text-neutral-500 hover:text-neutral-800'
              "
              :aria-pressed="currentView === 'list'"
              aria-label="Listenansicht"
              @click="currentView = 'list'"
            >
              <UiIcon name="i-lucide-list" class="size-4" />
              <span v-if="currentView === 'list'">Listenansicht</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 border-l border-neutral-200 py-2 text-sm font-medium transition-colors"
              :class="
                currentView === 'calendar'
                  ? 'bg-neutral-900 px-3 text-white'
                  : 'bg-white px-2.5 text-neutral-500 hover:text-neutral-800'
              "
              :aria-pressed="currentView === 'calendar'"
              aria-label="Kalenderansicht"
              @click="currentView = 'calendar'"
            >
              <UiIcon name="i-lucide-calendar" class="size-4" />
              <span v-if="currentView === 'calendar'">Kalenderansicht</span>
            </button>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-none bg-brand-accent px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:brightness-95"
            @click="openCreateModal()"
          >
            <UiIcon name="i-lucide-plus" class="size-4" />
            Buchung Hinzufügen
          </button>
        </div>
      </div>

      <div class="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          v-model="selectedResourceId"
          class="min-w-[180px] rounded-none border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        >
          <option value="all">Alle Ressourcen</option>
          <option v-for="res in resources" :key="res.id" :value="res.id">
            {{ res.name }}
          </option>
        </select>

        <div
          v-if="currentView === 'calendar'"
          class="flex items-center justify-center gap-3"
        >
          <button
            type="button"
            class="p-1 text-neutral-600 hover:text-neutral-900"
            @click="changeMonth(-1)"
          >
            <UiIcon name="i-lucide-chevron-left" class="size-5" />
          </button>
          <span class="min-w-[140px] text-center text-sm font-medium text-neutral-900">
            {{ currentMonthLabel }}
          </span>
          <button
            type="button"
            class="p-1 text-neutral-600 hover:text-neutral-900"
            @click="changeMonth(1)"
          >
            <UiIcon name="i-lucide-chevron-right" class="size-5" />
          </button>
        </div>
        <div v-else class="hidden sm:block sm:min-w-[180px]" />
      </div>
    </header>

    <main class="relative flex min-h-0 flex-1 overflow-hidden">
      <div
        v-if="loading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-white/80"
      >
        <div
          class="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-900"
        />
      </div>

      <div class="flex-1 overflow-hidden pt-6">
        <BookingCalendar
          v-if="currentView === 'calendar'"
          :bookings="filteredBookings"
          :currentDate="currentDate"
          @select="selectBooking"
          @create="openCreateModal"
          @drop-booking="handleDrop"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
        />

        <BookingList
          v-else
          :bookings="filteredBookings"
          @select="selectBooking"
          @cancel="handleCancelBooking"
          @edit="openEditModal"
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
          class="absolute inset-y-0 right-0 z-20 flex h-full w-[480px] max-w-[90vw] flex-col overflow-hidden shadow-xl sm:w-[480px]"
        >
          <BookingDetails
            ref="bookingDetailsRef"
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
const bookingDetailsRef = ref<InstanceType<typeof BookingDetails> | null>(null);

const handleWelcomeEmailSuccess = () => {
  showVoucherModal.value = false;
  bookingDetailsRef.value?.reloadCommunications?.();
};

const isModalOpen = ref(false);
const editingBooking = ref(null);

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

const { confirm } = useConfirm();

const handleCancel = async (_b: any) => {
  refreshData();
};

const handleCancelBooking = async (b: any) => {
  const label = b.resource_name || "diese Buchung";
  const confirmed = await confirm({
    title: "Buchung stornieren?",
    message: `Möchten Sie „${label}“ wirklich stornieren?`,
    confirmLabel: "Ja, stornieren",
    variant: "warning",
  });
  if (!confirmed) return;
  await api.bookings.cancel(b.id);
  await refreshData();
};

const handleDeletion = async (b: any) => {
  await api.bookings.delete(b.id);
  refreshData();
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatDateLabel = (d: Date) =>
  d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const handleDrop = async ({ date }: any) => {
  if (!draggedBooking.value || !date) return;

  const booking = draggedBooking.value;
  const originalStart = new Date(booking.start_at);
  const originalEnd = booking.end_at
    ? new Date(booking.end_at)
    : new Date(booking.start_at);

  if (sameDay(originalStart, date)) {
    draggedBooking.value = null;
    return;
  }

  const durationMs = originalEnd.getTime() - originalStart.getTime();
  const newStart = new Date(date);
  newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), 0, 0);
  const newEnd = new Date(
    newStart.getTime() + Math.max(durationMs, 60 * 60 * 1000),
  );

  const resourceLabel = booking.resource_name || "Buchung";
  const confirmed = await confirm({
    title: "Buchung verschieben?",
    message: `Möchten Sie „${resourceLabel}“ wirklich von ${formatDateLabel(originalStart)} nach ${formatDateLabel(newStart)} verschieben? Die Uhrzeit bleibt gleich.`,
    confirmLabel: "Ja, verschieben",
    cancelLabel: "Abbrechen",
    variant: "warning",
  });

  if (!confirmed) {
    draggedBooking.value = null;
    return;
  }

  try {
    await api.bookings.update(booking.id, {
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

const handleDragEnd = ({ dropped }: { dropped?: boolean } = {}) => {
  if (!dropped) draggedBooking.value = null;
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
    return;
  }

  const foundBooking = bookings.value.find((booking: any) => booking.id === id);

  if (!foundBooking) {
    return;
  }

  selectedBooking.value = foundBooking;

  if (route.query.edit === "1" || route.query.edit === "true") {
    openEditModal(foundBooking);
  }
});
</script>
