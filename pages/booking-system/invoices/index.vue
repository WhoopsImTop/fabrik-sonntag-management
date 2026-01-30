<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
          Rechnungen
        </h1>
        <p class="text-neutral-500 mt-1">
          Verwalten Sie Rechnungen, Zahlungen und Mahnungen.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="router.push('/booking-system/invoices/new')"
          class="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <svg
            class="w-4 h-4 mr-2"
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
          Erstellen
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-500">Gesamtumsatz</p>
            <h3 class="text-2xl font-bold text-neutral-900 mt-1">
              €{{ formatMoney(stats.totalRevenue) }}
            </h3>
          </div>
          <div class="p-3 bg-green-50 rounded-lg">
            <svg
              class="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div class="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-500">Offen</p>
            <h3 class="text-2xl font-bold text-neutral-900 mt-1">
              €{{ formatMoney(stats.pendingAmount) }}
            </h3>
          </div>
          <div class="p-3 bg-yellow-50 rounded-lg">
            <svg
              class="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div class="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-500">Überfällig</p>
            <h3 class="text-2xl font-bold text-neutral-900 mt-1">
              €{{ formatMoney(stats.overdueAmount) }}
            </h3>
          </div>
          <div class="p-3 bg-red-50 rounded-lg">
            <svg
              class="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <span
          class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Suchen nach Nummer, Kunde..."
          class="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow"
        />
      </div>
      <select
        v-model="statusFilter"
        class="px-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
      >
        <option value="all">Alle Status</option>
        <option value="DRAFT">Entwurf</option>
        <option value="PENDING">Ausstehend</option>
        <option value="SENT">Versendet</option>
        <option value="PAID">Bezahlt</option>
        <option value="OVERDUE">Überfällig</option>
      </select>
    </div>

    <div
      class="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden"
    >
      <div v-if="loading" class="p-12 flex justify-center">
        <svg
          class="animate-spin w-8 h-8 text-neutral-400"
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

      <div v-else-if="filteredInvoices.length === 0" class="p-12 text-center">
        <div
          class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4"
        >
          <svg
            class="w-6 h-6 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-neutral-900">
          Keine Rechnungen gefunden
        </h3>
        <p class="text-neutral-500 mt-1">
          Versuche es mit anderen Suchbegriffen oder erstelle eine neue
          Rechnung.
        </p>
      </div>

      <table v-else class="min-w-full divide-y divide-neutral-200">
        <thead class="bg-neutral-50/50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider"
            >
              Nr. / Datum
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider"
            >
              Kunde
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider"
            >
              Betrag
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider"
            >
              Aktion
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200 bg-white">
          <tr
            v-for="invoice in filteredInvoices"
            :key="invoice.id"
            class="hover:bg-neutral-50 transition-colors cursor-pointer group"
            @click="goToDetail(invoice.id)"
          >
            <td class="px-6 py-4">
              <div class="text-sm font-medium text-neutral-900">
                {{ invoice.invoice_number }}
              </div>
              <div class="text-xs text-neutral-500">
                {{ formatDate(invoice.created_at) }}
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm text-neutral-900">
                {{
                  invoice.User?.details?.company ||
                  `${invoice.User?.details?.first_name ?? ""} ${invoice.User?.details?.last_name ?? ""}`.trim() ||
                  "Unbekannt"
                }}
              </div>
              <div class="text-xs text-neutral-500">
                {{ invoice.User?.email || invoice.customer_email }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-neutral-900">
                €{{ formatMoney(invoice.total_amount || invoice.total) }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                  getStatusClass(invoice.status),
                ]"
              >
                {{ getStatusLabel(invoice.status) }}
              </span>
            </td>
            <td class="px-6 py-4 text-right text-sm font-medium">
              <button
                class="text-neutral-400 hover:text-neutral-900 p-2 rounded-full hover:bg-neutral-100 transition-colors"
                @click.stop="goToDetail(invoice.id)"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const api = useBookingApi();

const loading = ref(true);
const invoices = ref<any[]>([]);
const searchQuery = ref("");
const statusFilter = ref("all");

const stats = ref({
  totalRevenue: 0,
  pendingAmount: 0,
  overdueAmount: 0,
});

// --- Computed & Helpers ---

const filteredInvoices = computed(() => {
  let filtered = invoices.value;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (inv) =>
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.User?.username?.toLowerCase().includes(q) ||
        inv.User?.email?.toLowerCase().includes(q),
    );
  }

  if (statusFilter.value !== "all") {
    filtered = filtered.filter((inv) => inv.status === statusFilter.value);
  }

  return filtered;
});

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    PAID: "bg-green-50 text-green-700 border-green-200",
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    SENT: "bg-blue-50 text-blue-700 border-blue-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
    DRAFT: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return classes[status] || classes.DRAFT;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PAID: "Bezahlt",
    PENDING: "Ausstehend",
    SENT: "Versendet",
    OVERDUE: "Überfällig",
    DRAFT: "Entwurf",
  };
  return labels[status] || status;
};

const formatMoney = (val: any) => Number(val || 0).toFixed(2);

const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// --- Actions ---

const loadInvoices = async () => {
  loading.value = true;
  try {
    const data = await api.sales.getAll();
    if (Array.isArray(data)) {
      invoices.value = data;
      calculateStats(data);
    }
  } finally {
    loading.value = false;
  }
};

const calculateStats = (data: any[]) => {
  stats.value.totalRevenue = data
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
  stats.value.pendingAmount = data
    .filter((i) => ["PENDING", "SENT", "DRAFT"].includes(i.status))
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
  stats.value.overdueAmount = data
    .filter((i) => i.status === "OVERDUE")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
};

const goToDetail = (id: number) => {
  router.push(`/booking-system/invoices/${id}`);
};

onMounted(() => {
  loadInvoices();
});
</script>
