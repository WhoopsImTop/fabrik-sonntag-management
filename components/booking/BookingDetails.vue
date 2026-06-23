<template>
  <div
    v-if="booking"
    class="h-full flex flex-col bg-white border-l border-slate-200 shadow-2xl font-sans"
  >
    <!-- Zone 1: Hero Header -->
    <div class="px-5 py-4 border-b border-slate-100 shrink-0 bg-white">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <h3 class="text-base font-bold text-slate-900 tracking-tight truncate">
            {{ booking.Resource?.name || "Unbekannt" }}
          </h3>
          <p class="text-sm text-slate-600 mt-0.5">
            {{ formatDateHeader(booking.start_at, booking.end_at) }}
          </p>
          <p class="text-sm font-medium text-slate-700 truncate mt-0.5">
            {{ customerFullName }}
          </p>
          <p
            v-if="customerCompany"
            class="text-xs text-slate-500 truncate"
          >
            {{ customerCompany }}
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="flex items-center justify-between gap-2 mt-3">
        <div class="relative inline-flex">
          <select
            :value="booking.status"
            :disabled="isUpdatingStatus"
            :class="[
              'appearance-none cursor-pointer rounded-full border pl-3 pr-8 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-wait',
              statusChipClasses[booking.status],
            ]"
            @change="handleStatusChange"
          >
            <option value="PENDING">Ausstehend</option>
            <option value="CONFIRMED">Bestätigt</option>
            <option value="CANCELLED">Storniert</option>
          </select>
          <svg
            class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 opacity-60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <span class="text-[10px] font-mono text-slate-400">#{{ booking.id }}</span>
      </div>
    </div>

    <!-- Zone 2: Sticky Aktionsleiste -->
    <div class="px-5 py-3 border-b border-slate-100 bg-slate-50/80 shrink-0">
      <div v-if="booking.status === 'PENDING'" class="grid grid-cols-2 gap-2">
        <button
          @click="requestStatusChange('CONFIRMED')"
          class="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition-all"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Bestätigen
        </button>
        <button
          @click="requestStatusChange('CANCELLED')"
          class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-all"
        >
          Ablehnen
        </button>
      </div>

      <div v-else-if="booking.status === 'CONFIRMED'" class="grid grid-cols-2 gap-2">
        <button
          @click="$emit('edit', booking)"
          class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition-all"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Verschieben
        </button>
        <button
          @click="requestStatusChange('CANCELLED')"
          class="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50 transition-all"
        >
          Stornieren
        </button>
      </div>

      <div v-else class="flex items-center gap-2">
        <button
          @click="$emit('edit', booking)"
          class="flex-1 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
        >
          Details bearbeiten
        </button>
        <button
          @click="handleDeletion"
          class="inline-flex items-center justify-center rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Löschen
        </button>
      </div>
    </div>

    <!-- Zone 3: Scrollbarer Accordion-Inhalt -->
    <div class="flex-1 overflow-y-auto">
      <BookingDrawerSection title="Kunde" :default-open="true">
        <div v-if="booking.user_id && booking.User" class="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-3">
          <NuxtLink
            :to="`/booking-system/users/${booking.user_id}`"
            class="flex items-center gap-3 group"
          >
            <div
              class="h-9 w-9 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs"
            >
              {{ customerInitials }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {{ customerFullName }}
              </p>
              <p class="text-xs text-blue-600 group-hover:underline">Profil öffnen</p>
            </div>
          </NuxtLink>

          <div class="space-y-2 border-t border-slate-200/80 pt-3 text-sm">
            <a
              v-if="booking.User.email"
              :href="'mailto:' + booking.User.email"
              class="flex items-center gap-2 text-blue-600 hover:underline break-all"
            >
              <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {{ booking.User.email }}
            </a>
            <a
              v-if="userDetails?.mobile_number"
              :href="'tel:' + userDetails.mobile_number"
              class="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {{ userDetails.mobile_number }}
            </a>
            <p
              v-if="!booking.User.email && !userDetails?.mobile_number"
              class="text-slate-500 text-xs"
            >
              Keine Kontaktdaten hinterlegt
            </p>
          </div>
        </div>

        <p v-else class="text-sm text-slate-500 py-1">Kein registrierter Kunde (Gastbuchung)</p>
      </BookingDrawerSection>

      <BookingDrawerSection
        title="Abrechnung"
        :default-open="billingDefaultOpen"
        :badge="billingBadge"
      >
        <div v-if="booking.Invoice" class="flex items-center justify-between gap-3 py-1">
          <div class="min-w-0">
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="invoiceStatusClasses"
            >
              {{ invoiceStatusLabel }}
            </span>
            <p class="text-[10px] font-mono text-slate-400 mt-1 truncate">
              {{ booking.Invoice.invoice_number }}
            </p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-sm font-bold text-slate-900">
              {{ formatCurrency(booking.Invoice.total_amount) }}
            </p>
            <button
              @click="downloadInvoice(booking.Invoice.id)"
              :disabled="isDownloading"
              class="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline mt-0.5 disabled:opacity-50"
            >
              {{ isDownloading ? "Lädt…" : "PDF laden" }}
            </button>
          </div>
        </div>

        <p v-else-if="booking.paid_with_quota" class="text-sm text-slate-600 py-1">
          Gebucht über das hinterlegte Kontingent
        </p>

        <div v-else class="flex items-center justify-between gap-2 py-1">
          <p class="text-sm text-slate-500">Keine Rechnung</p>
          <button
            @click="router.push(`/booking-system/invoices/new?bookingId=${booking.id}`)"
            class="text-xs font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2"
          >
            Rechnung erstellen
          </button>
        </div>
      </BookingDrawerSection>

      <BookingDrawerSection
        title="Kommunikation"
        :default-open="false"
        @open="commSectionOpen = true"
      >
        <CommunicationHistory
          v-if="booking.id && commSectionOpen"
          ref="communicationHistoryRef"
          :booking-id="booking.id"
          class="mb-3"
        />
        <button
          @click="$emit('welcome-email')"
          class="w-full inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <svg class="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Willkommens-E-Mail erstellen
        </button>
      </BookingDrawerSection>
    </div>

    <ConfirmationModal
      v-model:open="showStatusModal"
      :title="statusModalCopy.title"
      :description="statusModalCopy.message"
      :variant="statusModalCopy.variant"
      :confirm-label="statusModalCopy.confirmLabel"
      :loading="isUpdatingStatus"
      icon="i-heroicons-arrow-path-20-solid"
      @confirm="confirmStatusChange"
      @cancel="cancelStatusChange"
    >
      <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
        <input
          v-model="shouldSendEmail"
          type="checkbox"
          class="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
        />
        Kunden per E-Mail benachrichtigen
      </label>
    </ConfirmationModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import ConfirmationModal from "@/components/app/ConfirmationModal.vue";
import BookingDrawerSection from "@/components/booking/BookingDrawerSection.vue";
import CommunicationHistory from "@/components/communication/CommunicationHistory.vue";

const router = useRouter();
const api = useBookingApi();
const { confirm } = useConfirm();

const shouldSendEmail = ref(true);
const showStatusModal = ref(false);
const pendingStatus = ref<string | null>(null);
const isUpdatingStatus = ref(false);

const props = defineProps<{ booking: any }>();
const emit = defineEmits([
  "close",
  "edit",
  "cancel",
  "update-status",
  "delete",
  "welcome-email",
]);

const isDownloading = ref(false);
const commSectionOpen = ref(false);
const communicationHistoryRef = ref<InstanceType<typeof CommunicationHistory> | null>(null);

const userDetails = computed(() => props.booking.User?.details);

const customerFullName = computed(() => {
  const first = userDetails.value?.first_name?.trim() || "";
  const last = userDetails.value?.last_name?.trim() || "";
  const fullName = [first, last].filter(Boolean).join(" ");
  return fullName || "Gast";
});

const customerCompany = computed(() => userDetails.value?.company?.trim() || "");

const customerInitials = computed(() => {
  const first = userDetails.value?.first_name?.trim();
  const last = userDetails.value?.last_name?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.substring(0, 2).toUpperCase();
  if (last) return last.substring(0, 2).toUpperCase();
  return "?";
});

const statusChipClasses: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500",
  PENDING: "bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500",
  CANCELLED: "bg-slate-100 border-slate-200 text-slate-600 focus:ring-slate-400",
};

const statusLabels: Record<string, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  CANCELLED: "Storniert",
};

const billingDefaultOpen = computed(
  () => !!(props.booking.Invoice || props.booking.paid_with_quota),
);

const billingBadge = computed(() => {
  if (props.booking.Invoice) return invoiceStatusLabel.value;
  if (props.booking.paid_with_quota) return "Kontingent";
  return undefined;
});

const invoiceStatusLabel = computed(() => {
  const status = props.booking.Invoice?.status;
  if (status === "DRAFT") return "Entwurf";
  if (status === "PAID") return "Bezahlt";
  return "Offen";
});

const invoiceStatusClasses = computed(() => {
  const status = props.booking.Invoice?.status;
  if (status === "PAID") return "bg-emerald-50 text-emerald-700";
  if (status === "DRAFT") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-700";
});

const statusModalCopy = computed(() => {
  const from = props.booking.status;
  const to = pendingStatus.value || from;

  if (to === "CANCELLED" && from === "CONFIRMED") {
    return {
      title: "Buchung stornieren",
      message: "Möchten Sie diese bestätigte Buchung wirklich stornieren?",
      variant: "warning" as const,
      confirmLabel: "Ja, stornieren",
    };
  }

  if (to === "CANCELLED") {
    return {
      title: "Buchung ablehnen",
      message: "Möchten Sie diese Buchung wirklich ablehnen oder stornieren?",
      variant: "warning" as const,
      confirmLabel: "Ja, stornieren",
    };
  }

  if (to === "CONFIRMED") {
    return {
      title: "Buchung bestätigen",
      message: `Status auf „${statusLabels.CONFIRMED}" setzen?`,
      variant: "default" as const,
      confirmLabel: "Ja, bestätigen",
    };
  }

  return {
    title: "Status ändern",
    message: `Status von „${statusLabels[from] || from}" auf „${statusLabels[to] || to}" ändern?`,
    variant: "default" as const,
    confirmLabel: "Status ändern",
  };
});

const requestStatusChange = (newStatus: string) => {
  if (newStatus === props.booking.status) return;
  pendingStatus.value = newStatus;
  shouldSendEmail.value = true;
  showStatusModal.value = true;
};

const handleStatusChange = (event: Event) => {
  const newStatus = (event.target as HTMLSelectElement).value;
  requestStatusChange(newStatus);
  (event.target as HTMLSelectElement).value = props.booking.status;
};

const cancelStatusChange = () => {
  pendingStatus.value = null;
};

const confirmStatusChange = async () => {
  const newStatus = pendingStatus.value;
  if (!newStatus || newStatus === props.booking.status) {
    showStatusModal.value = false;
    return;
  }

  isUpdatingStatus.value = true;
  try {
    if (newStatus === "CANCELLED" && props.booking.status === "CONFIRMED") {
      await api.bookings.cancel(props.booking.id, shouldSendEmail.value);
      emit("cancel", props.booking);
    } else {
      await api.bookings.update(
        props.booking.id,
        { status: newStatus },
        shouldSendEmail.value,
      );
      emit("update-status");
    }
    showStatusModal.value = false;
    pendingStatus.value = null;
  } catch (e) {
    alert("Fehler beim Status-Update");
  } finally {
    isUpdatingStatus.value = false;
  }
};

const handleDeletion = async () => {
  const confirmed = await confirm({
    title: "Buchung löschen",
    message: "Möchten Sie diese Buchung wirklich löschen?",
    variant: "danger",
    confirmLabel: "Ja, löschen",
    icon: "i-heroicons-trash-20-solid",
  });
  if (confirmed) {
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

const formatDateHeader = (start: string, end: string) => {
  if (!start) return "-";
  const startDate = new Date(start);
  const weekday = startDate.toLocaleDateString("de-DE", { weekday: "short" });
  const dateStr = formatDate(start);
  const timeStr = `${formatTime(start)}–${formatTime(end)} Uhr`;
  if (formatDate(start) !== formatDate(end)) {
    return `${weekday}, ${dateStr} – ${formatDate(end)} · ${timeStr}`;
  }
  return `${weekday}, ${dateStr} · ${timeStr}`;
};

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

defineExpose({
  reloadCommunications: () => communicationHistoryRef.value?.reload?.(),
});
</script>
