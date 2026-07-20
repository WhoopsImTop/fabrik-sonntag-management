<template>
  <div class="space-y-10 pb-12">
    <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
      Dashboard
    </h1>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="card in kpiCards"
        :key="card.label"
        class="flex flex-col justify-between border border-neutral-200 bg-white px-5 py-5"
      >
        <p class="text-3xl font-semibold tracking-tight text-neutral-900">
          {{ card.value }}
        </p>
        <p class="mt-3 text-sm text-neutral-500">{{ card.label }}</p>
      </div>
    </div>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold text-neutral-900">
        Aufkommende Buchungen
      </h2>
      <BookingOverviewTable
        :bookings="upcomingBookings"
        :loading="loading"
        empty-text="Keine aufkommenden Buchungen."
        @select="goToBooking"
        @cancel="handleCancel"
        @edit="goToBookingEdit"
      />
    </section>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold text-neutral-900">Email Historie</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-neutral-200 text-neutral-500">
              <th class="pb-3 pr-4 font-medium">Datum</th>
              <th class="pb-3 pr-4 font-medium">Empfänger</th>
              <th class="pb-3 pr-4 font-medium">Betreff</th>
              <th class="pb-3 font-medium">Nachricht</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingEmails">
              <td colspan="4" class="py-10 text-center text-neutral-500">
                Lädt…
              </td>
            </tr>
            <tr v-else-if="!emailHistory.length">
              <td colspan="4" class="py-10 text-center text-neutral-500">
                Noch keine E-Mails protokolliert.
              </td>
            </tr>
            <tr
              v-for="(log, index) in emailHistory"
              :key="log.id || index"
              class="border-b border-neutral-100"
            >
              <td class="py-4 pr-4 whitespace-nowrap text-neutral-700">
                {{ formatEmailDate(log.createdAt || log.created_at) }}
              </td>
              <td class="py-4 pr-4">
                <a
                  v-if="emailRecipient(log)"
                  :href="`mailto:${emailRecipient(log)}`"
                  class="text-brand-accent hover:underline"
                >
                  {{ emailRecipient(log) }}
                </a>
                <span v-else class="text-neutral-400">—</span>
              </td>
              <td class="py-4 pr-4 text-neutral-900">
                {{ log.subject || "—" }}
              </td>
              <td class="max-w-md truncate py-4 text-neutral-500">
                {{ log.message || log.preview || "—" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import BookingOverviewTable from "@/components/booking/BookingOverviewTable.vue";

const api = useBookingApi();
const router = useRouter();
const { confirm } = useConfirm();
const loading = ref(true);
const loadingEmails = ref(false);

const stats = ref({
  bookingsToday: 0,
  openRequests: 0,
  pendingAmount: 0,
});

const upcomingBookings = ref<any[]>([]);
const emailHistory = ref<any[]>([]);

const todayLabel = computed(() => {
  const now = new Date();
  const date = now.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
  });
  return date;
});

const weekdayLabel = computed(() =>
  new Date().toLocaleDateString("de-DE", { weekday: "long" }),
);

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(val);

const kpiCards = computed(() => [
  { value: String(stats.value.bookingsToday), label: "Buchungen Heute" },
  { value: String(stats.value.openRequests), label: "Offene Anfragen" },
  {
    value: formatCurrency(stats.value.pendingAmount),
    label: "Offener Umsatz",
  },
  { value: todayLabel.value, label: weekdayLabel.value },
]);

const formatEmailDate = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) +
    " Uhr"
  );
};

const emailRecipient = (log: any) =>
  log.recipient ||
  log.to ||
  log.email ||
  log.User?.email ||
  log.Booking?.User?.email ||
  "";

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const goToBooking = (booking: any) => {
  router.push(`/booking-system/calendar?id=${booking.id}`);
};

const goToBookingEdit = (booking: any) => {
  router.push(`/booking-system/calendar?id=${booking.id}&edit=1`);
};

const handleCancel = async (booking: any) => {
  const label = booking.resource_name || "diese Buchung";
  const confirmed = await confirm({
    title: "Buchung stornieren?",
    message: `Möchten Sie „${label}“ wirklich stornieren?`,
    confirmLabel: "Ja, stornieren",
    variant: "warning",
  });
  if (!confirmed) return;
  await api.bookings.cancel(booking.id);
  await loadDashboardData();
};

const loadEmailHistory = async (bookings: any[]) => {
  loadingEmails.value = true;
  try {
    const sample = bookings.slice(0, 8);
    const results = await Promise.all(
      sample.map(async (b) => {
        try {
          const logs = await api.communications.getByBooking(b.id);
          return Array.isArray(logs) ? logs : [];
        } catch {
          return [];
        }
      }),
    );
    emailHistory.value = results
      .flat()
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt || b.created_at || 0).getTime() -
          new Date(a.createdAt || a.created_at || 0).getTime(),
      )
      .slice(0, 10);
  } finally {
    loadingEmails.value = false;
  }
};

const loadDashboardData = async () => {
  loading.value = true;
  try {
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 7);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 60);

    const [bookingsData, invoicesData] = await Promise.all([
      api.bookings.getAll({
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString(),
      }),
      api.sales.getAll(),
    ]);

    const bookings = Array.isArray(bookingsData) ? bookingsData : [];

    stats.value.bookingsToday = bookings.filter((b: any) => {
      const start = new Date(b.start_at);
      return isSameDay(start, now) && b.status !== "CANCELLED";
    }).length;

    stats.value.openRequests = bookings.filter(
      (b: any) => b.status === "PENDING",
    ).length;

    if (Array.isArray(invoicesData)) {
      stats.value.pendingAmount = invoicesData
        .filter((i: any) => ["SENT", "OVERDUE", "PENDING"].includes(i.status))
        .reduce(
          (sum: number, i: any) =>
            sum + parseFloat(i.total_amount || i.total || 0),
          0,
        );
    }

    upcomingBookings.value = [...bookings]
      .filter((b: any) => {
        const end = b.end_at ? new Date(b.end_at) : new Date(b.start_at);
        return end >= now && b.status !== "CANCELLED";
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
      )
      .slice(0, 8);

    await loadEmailHistory(upcomingBookings.value);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadDashboardData();
});
</script>
