<template>
  <div
    class="h-full flex flex-col bg-white border-l border-slate-200 shadow-2xl font-sans"
    v-if="booking"
  >
    <div
      class="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-white shrink-0"
    >
      <div>
        <h3 class="text-lg font-bold text-slate-900 tracking-tight">
          Buchungsdetails
        </h3>
        <p class="text-xs text-slate-500 font-mono mt-0.5">
          ID: #{{ booking.id }}
        </p>
      </div>
      <button
        @click="$emit('close')"
        class="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-8">
      <div
        class="rounded-lg p-4 border flex items-center gap-3"
        :class="
          statusStyles[booking.status]?.bg || 'bg-slate-50 border-slate-200'
        "
      >
        <div
          class="p-2 rounded-full shrink-0"
          :class="
            statusStyles[booking.status]?.iconBg ||
            'bg-slate-200 text-slate-500'
          "
        >
          <component :is="statusStyles[booking.status]?.icon" class="w-5 h-5" />
        </div>
        <div>
          <p
            class="text-sm font-bold"
            :class="statusStyles[booking.status]?.text || 'text-slate-700'"
          >
            {{ statusStyles[booking.status]?.label || booking.status }}
          </p>
          <p
            class="text-xs opacity-80"
            :class="statusStyles[booking.status]?.text || 'text-slate-600'"
          >
            {{ statusStyles[booking.status]?.desc }}
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <span
            class="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block"
            >Ressource</span
          >
          <h4 class="text-xl font-bold text-slate-900 leading-tight">
            {{ booking.Resource?.name || "Unbekannt" }}
          </h4>
        </div>

        <div
          class="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl"
        >
          <div class="mt-0.5 text-slate-400">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-900">
              {{ formatDate(booking.start_at) }}
              <span
                v-if="
                  formatDate(booking.start_at) !== formatDate(booking.end_at)
                "
                class="text-slate-400"
              >
                bis
              </span>
              <span
                v-if="
                  formatDate(booking.start_at) !== formatDate(booking.end_at)
                "
                >{{ formatDate(booking.end_at) }}</span
              >
            </p>
            <p class="text-sm text-slate-500 mt-0.5">
              {{ formatTime(booking.start_at) }} –
              {{ formatTime(booking.end_at) }} Uhr
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <h5
          class="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-100 pb-2"
        >
          Kunde
        </h5>

        <div class="flex items-center gap-4">
          <div
            class="h-10 w-10 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-slate-50"
          >
            {{ getInitials(booking.User?.username) }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-900 truncate">
              {{ booking.User?.username || "Gast" }}
            </p>
            <a
              v-if="booking.User?.email"
              :href="'mailto:' + booking.User.email"
              class="text-xs text-blue-600 hover:underline truncate block"
            >
              {{ booking.User.email }}
            </a>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div
          class="flex items-center justify-between border-b border-slate-100 pb-2"
        >
          <h5
            class="text-xs font-bold uppercase tracking-widest text-slate-900"
          >
            Rechnung
          </h5>
          <span
            v-if="booking.Invoice"
            class="text-[10px] font-mono text-slate-400"
            >{{ booking.Invoice.invoice_number }}</span
          >
        </div>

        <div
          v-if="booking.Invoice"
          class="group relative rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
        >
          <div
            class="bg-slate-50/50 px-4 py-3 flex justify-between items-center"
          >
            <div class="flex flex-col">
              <span
                class="text-xs font-medium"
                :class="
                  booking.Invoice.status === 'PAID'
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                "
              >
                {{
                  booking.Invoice.status === "DRAFT"
                    ? "Entwurf"
                    : booking.Invoice.status === "PAID"
                      ? "Bezahlt"
                      : "Offen"
                }}
              </span>
            </div>
            <div class="text-right">
              <span class="block text-sm font-bold text-slate-900">{{
                formatCurrency(booking.Invoice.total_amount)
              }}</span>
            </div>
          </div>
          <button
            @click="downloadInvoice(booking.Invoice.id)"
            :disabled="isDownloading"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-t border-slate-200 transition-colors"
          >
            <svg
              v-if="isDownloading"
              class="animate-spin w-3 h-3"
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
            <svg
              v-else
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            PDF Laden
          </button>
        </div>
        <div
          v-else-if="booking.paid_with_quota"
          class="p-3 rounded-lg border border-dashed border-slate-200 text-center"
        >
          <p class="text-xs text-slate-400">
            Gebucht über das hinterlegte Kontingent
          </p>
        </div>
        <div
          v-else
          class="p-3 rounded-lg border border-dashed border-slate-200 text-center"
        >
          <p class="text-xs text-slate-400">Keine Rechnung vorhanden.</p>
        </div>
      </div>
      <div class="space-y-3">
        <div
          class="flex items-center justify-between border-b border-slate-100 pb-2"
        >
          <h5
            class="text-xs font-bold uppercase tracking-widest text-slate-900"
          >
            Willkommens Email senden
          </h5>
        </div>
        <button
          @click="$emit('welcome-email')"
          class="w-full col-span-1 inline-flex items-center justify-center rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-yellow-500 shadow-sm transition-all hover:cursor-pointer"
        >
          Email erstellen
        </button>
      </div>
    </div>

    <div class="p-4 border-t border-slate-100 bg-white space-y-3 shrink-0">
      <div class="mb-4">
        <input
          type="checkbox"
          id="sendMail"
          v-model="shouldSendEmail"
          class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
        />
        <label
          for="sendMail"
          class="text-xs text-slate-600 font-medium cursor-pointer"
        >
          Kunden per E-Mail benachrichtigen
        </label>
      </div>
      <div v-if="booking.status === 'PENDING'" class="grid grid-cols-2 gap-3">
        <button
          @click="updateStatus('CONFIRMED')"
          class="col-span-1 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
              d="M5 13l4 4L19 7"
            />
          </svg>
          Bestätigen
        </button>
        <button
          @click="handleReject"
          class="col-span-1 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-all"
        >
          Ablehnen
        </button>
      </div>

      <div
        v-else-if="booking.status === 'CONFIRMED'"
        class="grid grid-cols-2 gap-3"
      >
        <button
          @click="$emit('edit', booking)"
          class="col-span-1 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition-all"
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Verschieben
        </button>
        <button
          @click="handleCancel"
          class="col-span-1 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
        >
          Stornieren
        </button>
      </div>

      <div v-else class="grid grid-cols-2 gap-3">
        <button
          @click="$emit('edit', booking)"
          class="w-full inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
        >
          Details bearbeiten
        </button>
        <button
          @click="handleDeletion"
          class="col-span-1 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
        >
          <svg
            class="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Löschen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h } from "vue";
const api = useBookingApi();

const shouldSendEmail = ref(true);

const props = defineProps<{ booking: any }>();
const emit = defineEmits([
  "close",
  "edit",
  "cancel",
  "update-status",
  "delete",
  "welcome-email"
]);

const isDownloading = ref(false);
const showVoucherModal = ref(false);

// --- ICONS & STYLES ---
const Icons = {
  Check: h(
    "svg",
    {
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      "stroke-width": 2,
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M5 13l4 4L19 7",
      }),
    ],
  ),
  Clock: h(
    "svg",
    {
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      "stroke-width": 2,
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      }),
    ],
  ),
  X: h(
    "svg",
    {
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      "stroke-width": 2,
    },
    [
      h("path", {
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        d: "M6 18L18 6M6 6l12 12",
      }),
    ],
  ),
};

const statusStyles: any = {
  CONFIRMED: {
    label: "Bestätigt",
    desc: "Die Buchung ist aktiv.",
    bg: "bg-emerald-50 border-emerald-100",
    text: "text-emerald-700",
    iconBg: "bg-emerald-100",
    icon: Icons.Check,
  },
  PENDING: {
    label: "Ausstehend",
    desc: "Wartet auf Bestätigung.",
    bg: "bg-amber-50 border-amber-100",
    text: "text-amber-700",
    iconBg: "bg-amber-100",
    icon: Icons.Clock,
  },
  CANCELLED: {
    label: "Storniert",
    desc: "Diese Buchung wurde abgesagt.",
    bg: "bg-slate-50 border-slate-200",
    text: "text-slate-500",
    iconBg: "bg-slate-200",
    icon: Icons.X,
  },
};

// --- ACTIONS ---

const updateStatus = async (newStatus: string) => {
  try {
    await api.bookings.update(
      props.booking.id,
      { status: newStatus },
      shouldSendEmail.value,
    );
    emit("update-status");
  } catch (e) {
    alert("Fehler beim Status-Update");
  }
};

const handleReject = async () => {
  try {
    await api.bookings.update(
      props.booking.id,
      { status: "CANCELLED" },
      shouldSendEmail.value,
    );
    emit("update-status");
  } catch (e) {
    alert("Fehler beim Status-Update");
  }
};

const handleCancel = async () => {
  if (confirm("Möchten Sie diese Buchung wirklich stornieren?")) {
    await api.bookings.cancel(props.booking.id, shouldSendEmail.value);
    emit("cancel", props.booking);
  }
};

const handleDeletion = () => {
  if (confirm("Möchten Sie diese Buchung wirklich löschen?")) {
    emit("delete", props.booking);
  }
};

const downloadInvoice = async (invoiceId: number) => {
  if (!invoiceId) return;
  isDownloading.value = true;
  try {
    const blob = await api.sales.downloadInvoice(invoiceId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = `Rechnung_${props.booking.Invoice?.invoice_number || invoiceId}.pdf`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert("Download fehlgeschlagen.");
  } finally {
    isDownloading.value = false;
  }
};

// --- HELPERS ---
const formatDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";
const formatTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";
const formatCurrency = (val: string | number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    Number(val || 0),
  );
const getInitials = (name: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "?";
</script>
