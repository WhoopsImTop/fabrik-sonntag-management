<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div v-if="exportForAccounting"
        class="dialog-overlay z-[100]"
        role="dialog"
        aria-modal="true">
        <div class="absolute inset-0" @click="closeExportModal"></div>
        <div class="dialog-panel max-w-2xl">
          <div class="dialog-header">
            <h3 class="dialog-title">Buchhaltungsexport</h3>
            <button type="button" class="dialog-close" aria-label="Schließen" @click="closeExportModal">
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>

          <div class="dialog-body">
            <div v-if="validationErrors.length > 0" class="space-y-4">
              <div class="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p class="font-semibold">Aktion erforderlich:</p>
                <p>
                  Die folgenden Nutzer haben noch keine Debitorennummer. Bitte
                  ergänzen Sie diese, um den Export fortzusetzen.
                </p>
              </div>

              <div class="space-y-3">
                <div v-for="user in validationErrors" :key="user.id"
                  class="flex flex-col gap-3 border border-neutral-200 bg-neutral-50 p-3 sm:flex-row sm:items-center">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-neutral-900">
                      {{ user.details?.first_name }}
                      {{ user.details?.last_name }}
                    </p>
                    <p class="text-xs text-neutral-500">{{ user.email }}</p>
                  </div>
                  <div class="sm:w-48">
                    <input v-model="user.new_debitor_number" placeholder="Debitoren-Nr."
                      class="dialog-input" />
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="grid grid-cols-2 gap-4">
              <div>
                <label class="dialog-label">Von</label>
                <input type="date" class="dialog-input" v-model="exportStartDate" />
              </div>
              <div>
                <label class="dialog-label">Bis</label>
                <input type="date" class="dialog-input" v-model="exportEndDate" />
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn-dialog-cancel" @click="closeExportModal">
              Abbrechen
            </button>
            <button
              v-if="validationErrors.length > 0"
              type="button"
              class="btn-dialog-primary"
              :disabled="isPatching"
              @click="patchUsersAndRetry"
            >
              {{ isPatching ? "Speichere Daten..." : "Speichern & Erneut versuchen" }}
            </button>
            <button
              v-else
              type="button"
              class="btn-dialog-primary"
              :disabled="!exportStartDate || !exportEndDate"
              @click="exportAccountingData"
            >
              Daten Exportieren
            </button>
          </div>
        </div>
      </div>
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
          type="button"
          class="btn-dialog-cancel"
          @click="exportForAccounting = true"
        >
          Export
        </button>
        <button
          type="button"
          class="btn-dialog-primary"
          @click="router.push('/booking-system/invoices/new')"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Neue Rechnung
        </button>
        <button
          v-if="selectedInvoices.length > 0"
          type="button"
          class="btn-dialog-primary"
          :disabled="bulkDownloading"
          @click="handleBulkDownload"
        >
          <svg v-if="bulkDownloading" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {{ selectedInvoices.length }} herunterladen
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white p-6 border border-neutral-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-500">Gesamtumsatz</p>
            <h3 class="text-2xl font-bold text-neutral-900 mt-1">
              €{{ formatMoney(stats.totalRevenue) }}
            </h3>
          </div>
        </div>
      </div>
      <div class="bg-white p-6 border border-neutral-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-500">Offen</p>
            <h3 class="text-2xl font-bold text-neutral-900 mt-1">
              €{{ formatMoney(stats.pendingAmount) }}
            </h3>
          </div>
        </div>
      </div>
      <div class="bg-white p-6 border border-neutral-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-neutral-500">Überfällig</p>
            <h3 class="text-2xl font-bold text-neutral-900 mt-1">
              €{{ formatMoney(stats.overdueAmount) }}
            </h3>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input v-model="searchQuery" type="text" placeholder="Suchen nach Nummer, Kunde..."
          class="w-full pl-10 pr-4 py-2 bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow" />
      </div>
      <select v-model="statusFilter"
        class="px-4 py-2 bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900">
        <option value="all">Alle Status</option>
        <option value="DRAFT">Entwurf</option>
        <option value="PENDING">Ausstehend</option>
        <option value="SENT">Versendet</option>
        <option value="PAID">Bezahlt</option>
        <option value="OVERDUE">Überfällig</option>
      </select>
    </div>

    <div class="w-full overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium w-10">
              <input type="checkbox" :checked="allSelected" @change="toggleSelectAll"
                class="border-neutral-300 text-neutral-900 focus:ring-neutral-900 rounded-none" />
            </th>
            <th class="pb-3 pr-4 font-medium">Nr. / Datum</th>
            <th class="pb-3 pr-4 font-medium">Kunde</th>
            <th class="pb-3 pr-4 font-medium">Betrag</th>
            <th class="pb-3 pr-4 font-medium">Status</th>
            <th class="pb-3 font-medium text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="py-12 text-center text-neutral-500">Lädt…</td>
          </tr>
          <tr v-else-if="filteredInvoices.length === 0">
            <td colspan="6" class="py-12 text-center text-neutral-500">
              Keine Rechnungen gefunden
            </td>
          </tr>
          <tr
            v-for="invoice in filteredInvoices"
            :key="invoice.id"
            class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
            @click="goToDetail(invoice.id)"
          >
            <td class="py-4 pr-4" @click.stop>
              <input type="checkbox" :value="invoice.id" v-model="selectedInvoices"
                class="border-neutral-300 text-neutral-900 focus:ring-neutral-900 rounded-none" />
            </td>
            <td class="py-4 pr-4">
              <div class="font-medium text-neutral-900">
                {{ invoice.invoice_number }}
              </div>
              <div class="text-xs text-neutral-500">
                {{ formatDate(invoice.createdAt) }}
              </div>
            </td>
            <td class="py-4 pr-4">
              <div class="text-neutral-900">
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
            <td class="py-4 pr-4 whitespace-nowrap">
              <div class="font-medium text-neutral-900">
                €{{ formatMoney(invoice.total_amount || invoice.total) }}
              </div>
            </td>
            <td class="py-4 pr-4 whitespace-nowrap">
              <span :class="getStatusClass(invoice.status)">
                {{ getStatusLabel(invoice.status) }}
              </span>
            </td>
            <td class="py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="invoice.status === 'SENT'"
                  @click.stop="togglePaidStatus(invoice)"
                  :class="[
                    'p-2 transition-colors',
                    invoice.status === 'PAID' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50'
                  ]"
                  :title="invoice.status === 'PAID' ? 'Als offen markieren' : 'Als bezahlt markieren'"
                >
                  <img src="../../../public/check.svg" class="w-5 h-5" />
                </button>
                <button
                  class="text-neutral-400 hover:text-neutral-900 p-2 hover:bg-neutral-100 transition-colors"
                  @click.stop="goToDetail(invoice.id)"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
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

const selectedInvoices = ref<number[]>([]);
const bulkDownloading = ref(false);

const exportStartDate = ref<string | null>(null);
const exportEndDate = ref<string | null>(null);
const exportForAccounting = ref(false);

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
    PAID: "text-emerald-600",
    PENDING: "text-amber-600",
    SENT: "text-brand-accent",
    OVERDUE: "text-red-600",
    DRAFT: "text-neutral-500",
    DELETED: "text-neutral-400",
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
    DELETED: "Storniert",
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

const togglePaidStatus = async (invoice: any) => {
  if (invoice.status === "DELETED") return;
  try {
    const newStatus = invoice.status === 'PAID' ? 'SENT' : 'PAID';
    const updated = await api.sales.update(invoice.id, { status: newStatus });
    if (updated) {
      // Update local state directly
      invoice.status = newStatus;
      calculateStats(invoices.value);
    }
  } catch (e) {
    console.error("Failed to toggle invoice status:", e);
  }
};

const validationErrors = ref<any[]>([]);
const isPatching = ref(false);

const closeExportModal = () => {
  exportForAccounting.value = false;
  validationErrors.value = []; // Reset errors
};

const exportAccountingData = async () => {
  try {
    if (!exportStartDate.value || !exportEndDate.value) {
      alert("Bitte Start- und Enddatum eingeben.");
      return;
    }

    const response = await api.sales.handleAccountingExport(
      exportStartDate.value,
      exportEndDate.value,
    );

    if (!response.ok) {
      const errorData = await response.json();

      // Hier mappen wir auf "missing" statt "missingUsers"
      if (errorData.missing) {
        validationErrors.value = errorData.missing.map((u: any) => ({
          ...u,
          // Wir erstellen ein flaches Objekt für das Interface
          // Falls 'name' mitkommt, splitten wir ihn optional für die Anzeige
          details: { first_name: u.name, last_name: '' },
          new_debitor_number: "",
        }));
        return;
      }
      throw new Error(errorData.error || "Export fehlgeschlagen");
    }

    // Erfolg: Download-Logik
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Export_${exportStartDate.value}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    exportForAccounting.value = false;
  } catch (e) {
    console.error("Export Error:", e);
  }
};

const patchUsersAndRetry = async () => {
  const invalid = validationErrors.value.some((u) => !u.new_debitor_number);
  if (invalid) {
    alert("Bitte alle Debitorennummern ausfüllen.");
    return;
  }

  isPatching.value = true;
  try {
    await Promise.all(
      validationErrors.value.map((user) =>
        api.users.update(user.id, {
          debitor_number: user.new_debitor_number,
        }),
      ),
    );

    validationErrors.value = [];
    await exportAccountingData();
  } catch (e) {
    console.error("Patch Error:", e);
  } finally {
    isPatching.value = false;
  }
};

const calculateStats = (data: any[]) => {
  stats.value.totalRevenue = data
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
  stats.value.pendingAmount = data
    .filter((i) => ["PENDING", "SENT", "DRAFT", "PARTIALLY_PAID"].includes(i.status))
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

const allSelected = computed(() => {
  if (filteredInvoices.value.length === 0) return false;
  return filteredInvoices.value.every((inv) => selectedInvoices.value.includes(inv.id));
});

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedInvoices.value = [];
  } else {
    selectedInvoices.value = filteredInvoices.value.map((inv) => inv.id);
  }
};

const handleBulkDownload = async () => {
  if (selectedInvoices.value.length === 0) return;
  bulkDownloading.value = true;
  try {
    const blob = await api.sales.bulkDownload(selectedInvoices.value);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rechnungen-${new Date().toISOString().split("T")[0]}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    selectedInvoices.value = [];
  } catch (e) {
    console.error("Bulk download error:", e);
  } finally {
    bulkDownloading.value = false;
  }
};
</script>
