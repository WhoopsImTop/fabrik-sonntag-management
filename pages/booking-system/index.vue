<template>
  <div class="space-y-8 pb-12">
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight"
        >
          Dashboard
        </h1>
        <p class="text-slate-500 mt-1">
          Willkommen zurück! Hier ist der aktuelle Status.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span
          class="text-sm text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-md shadow-sm"
        >
          {{ new Date().toLocaleDateString("de-DE", { dateStyle: "full" }) }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <app-stat-card
        title="Aktive Buchungen"
        :value="stats.activeBookings"
        color="blue"
      >
        <template #icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        </template>
      </app-stat-card>

      <app-stat-card
        title="Verfügbare Räume"
        :value="stats.availableResources"
        color="green"
      >
        <template #icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5"
          >
            <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18" />
          </svg>
        </template>
      </app-stat-card>

      <app-stat-card
        title="Offener Umsatz"
        :value="formatCurrency(stats.pendingAmount)"
        color="yellow"
      >
        <template #icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </template>
      </app-stat-card>

      <app-stat-card
        title="Nutzer gesamt"
        :value="stats.totalUsers"
        color="purple"
      >
        <template #icon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-5 h-5"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </template>
      </app-stat-card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        <div
          class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div
            class="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
          >
            <h2 class="text-lg font-semibold text-slate-900">
              Neueste Buchungen
            </h2>
            <NuxtLink
              to="/booking-system/bookings"
              class="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Alle anzeigen
            </NuxtLink>
          </div>

          <div v-if="loading" class="flex justify-center py-12">
            <svg
              class="animate-spin w-8 h-8 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>

          <div
            v-else-if="recentBookings.length === 0"
            class="text-center py-12 text-slate-500"
          >
            Keine aktuellen Buchungen.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th class="px-6 py-3">Ressource / User</th>
                  <th class="px-6 py-3">Zeitraum</th>
                  <th class="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="booking in recentBookings"
                  :key="booking.id"
                  class="hover:bg-slate-50/50 transition-colors"
                >
                  <td class="px-6 py-4">
                    <div class="font-medium text-slate-900">
                      {{ booking.resource_name }}
                    </div>
                    <div class="text-xs text-slate-500 mt-0.5">
                      {{ booking.user_name }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-slate-600">
                    <div class="flex items-center gap-1.5">
                      <svg
                        class="w-3.5 h-3.5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {{ formatDate(booking.start_at) }}
                    </div>
                    <div class="text-xs text-slate-400 mt-1 pl-5">
                      {{ booking.duration }}
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span
                      :class="[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        getStatusClass(booking.status),
                      ]"
                    >
                      {{ getStatusLabel(booking.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="space-y-8">
        <div
          class="bg-slate-900 text-white rounded-xl shadow-lg p-6 overflow-hidden relative"
        >
          <div
            class="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"
          ></div>
          <div
            class="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-xl"
          ></div>

          <h2 class="text-lg font-bold mb-4 relative z-10">Schnellzugriff</h2>
          <div class="grid grid-cols-2 gap-3 relative z-10">
            <NuxtLink
              to="/booking-system/bookings"
              class="flex flex-col items-center justify-center p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10 text-center group"
            >
              <svg
                class="w-6 h-6 mb-2 text-blue-300 group-hover:text-blue-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span class="text-xs font-medium">Neue Buchung</span>
            </NuxtLink>
            <NuxtLink
              to="/booking-system/users"
              class="flex flex-col items-center justify-center p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10 text-center group"
            >
              <svg
                class="w-6 h-6 mb-2 text-purple-300 group-hover:text-purple-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="20" x2="20" y1="8" y2="14" />
                <line x1="23" x2="17" y1="11" y2="11" />
              </svg>
              <span class="text-xs font-medium">Neuer User</span>
            </NuxtLink>
            <NuxtLink
              to="/booking-system/invoices"
              class="flex flex-col items-center justify-center p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10 text-center group"
            >
              <svg
                class="w-6 h-6 mb-2 text-amber-300 group-hover:text-amber-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" x2="12" y1="18" y2="12" />
                <line x1="9" x2="15" y1="15" y2="15" />
              </svg>
              <span class="text-xs font-medium">Rechnung</span>
            </NuxtLink>
            <NuxtLink
              to="/booking-system/resources"
              class="flex flex-col items-center justify-center p-4 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10 text-center group"
            >
              <svg
                class="w-6 h-6 mb-2 text-emerald-300 group-hover:text-emerald-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              <span class="text-xs font-medium">Ressourcen</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import AppStatCard from "@/components/app/StatCard.vue";
// Falls du den Nuxt UI Icon Component nutzt, kann er in StatCard verwendet werden,
// hier nutzen wir Slots mit SVGs für maximale Kontrolle.

const api = useBookingApi();
const loading = ref(true);

const stats = ref({
  activeBookings: 0,
  availableResources: 0,
  pendingAmount: 0,
  totalUsers: 0,
});

const recentBookings = ref<any[]>([]);

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(val);
};

const getStatusClass = (status: string) => {
  if (status === "CONFIRMED")
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
  if (status === "PENDING")
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20";
  if (status === "CANCELLED")
    return "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20";
  return "bg-slate-50 text-slate-600";
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    CONFIRMED: "Bestätigt",
    PENDING: "Ausstehend",
    CANCELLED: "Storniert",
  };
  return map[status] || status;
};

const loadDashboardData = async () => {
  loading.value = true;
  try {
    // 1. Bookings
    const rangeEnd = new Date();
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - 30);
    const bookingsData = await api.bookings.getAll({
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    });
    if (bookingsData && Array.isArray(bookingsData)) {
      // Sort by date desc
      const sorted = [...bookingsData].sort(
        (a: any, b: any) =>
          new Date(b.createdAt || b.start_at).getTime() -
          new Date(a.createdAt || a.start_at).getTime()
      );

      recentBookings.value = sorted.slice(0, 5).map((b: any) => ({
        ...b,
        duration: (() => {
          const start = new Date(b.start_at);
          const end = b.end_at ? new Date(b.end_at) : new Date(b.start_at);
          const hours = Math.max(1, Math.round((end.getTime() - start.getTime()) / 3600000));
          return `${hours}h`;
        })(),
      }));

      // Active = End date in future & not cancelled
      stats.value.activeBookings = bookingsData.filter(
        (b: any) => {
          const start = new Date(b.start_at);
          const end = b.end_at ? new Date(b.end_at) : new Date(start.getTime() + 3600000);
          return end > new Date() && b.status !== "CANCELLED";
        }
      ).length;
    }

    // 2. Resources
    const resourcesData = await api.resources.getAll();
    if (resourcesData && Array.isArray(resourcesData)) {
      stats.value.availableResources = resourcesData.filter(
        (r: any) => r.is_available
      ).length;

    }

    // 3. Invoices (Fixed API Call)
    // api.sales.getAll() statt getAllInvoices()
    const invoicesData = await api.sales.getAll();
    if (invoicesData && Array.isArray(invoicesData)) {
      // Pending Amount: Sum of invoices not PAID and not DRAFT (so SENT/OVERDUE)
      stats.value.pendingAmount = invoicesData
        .filter((i: any) => ["SENT", "OVERDUE", "PENDING"].includes(i.status))
        .reduce(
          (sum: number, i: any) =>
            sum + parseFloat(i.total_amount || i.total || 0),
          0
        );
    }

    // 4. Users
    const usersData = await api.users.getAll();
    if (usersData && Array.isArray(usersData)) {
      stats.value.totalUsers = usersData.length;
    }
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
