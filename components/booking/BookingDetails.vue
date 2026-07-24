<template>
  <div
    v-if="booking"
    class="flex h-full min-h-0 flex-col overflow-hidden border-l border-neutral-200 bg-white font-sans"
  >
    <!-- Header -->
    <div
      class="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4"
    >
      <div class="flex min-w-0 items-center gap-2">
        <button
          type="button"
          class="shrink-0 p-1 text-neutral-500 transition-colors hover:text-neutral-900"
          aria-label="Zurück"
          @click="$emit('close')"
        >
          <UiIcon name="i-lucide-chevron-left" class="size-5" />
        </button>
        <h3 class="truncate text-base font-bold tracking-tight text-neutral-900">
          Buchungsdetails #{{ booking.id }}
        </h3>
      </div>

      <div class="relative inline-flex shrink-0">
        <span
          v-if="booking.status === 'CONFIRMED'"
          class="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-emerald-600"
        >
          <UiIcon name="i-lucide-check" class="size-3.5" />
        </span>
        <select
          :value="booking.status"
          :disabled="isUpdatingStatus"
          :class="[
            'appearance-none cursor-pointer border py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 disabled:cursor-wait disabled:opacity-60',
            booking.status === 'CONFIRMED' ? 'pl-8 pr-8' : 'pl-3 pr-8',
            statusChipClasses[booking.status],
          ]"
          @change="handleStatusChange"
        >
          <option value="PENDING">Ausstehend</option>
          <option value="CONFIRMED">Bestätigt</option>
          <option value="CANCELLED">Storniert</option>
        </select>
        <UiIcon
          name="i-lucide-chevron-down"
          class="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 opacity-60"
        />
      </div>
    </div>

    <!-- Scrollable body -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <!-- Customer + Booking info -->
      <div class="grid grid-cols-1 gap-6 px-5 py-5 sm:grid-cols-2">
        <div class="min-w-0 space-y-2">
          <div class="flex items-center gap-1.5">
            <h4 class="text-sm font-semibold text-neutral-900">
              Kundeninformationen
            </h4>
            <NuxtLink
              v-if="booking.user_id"
              :to="`/booking-system/users/${booking.user_id}`"
              class="p-0.5 text-neutral-400 transition-colors hover:text-neutral-700"
              title="Kundenprofil öffnen"
            >
              <IconEdit class="size-3" />
            </NuxtLink>
          </div>

          <template v-if="booking.user_id && booking.User">
            <p v-if="customerCompany" class="text-sm text-neutral-900">
              {{ customerCompany }}
            </p>
            <p class="text-sm text-neutral-900">{{ customerFullName }}</p>
            <a
              v-if="booking.User.email"
              :href="'mailto:' + booking.User.email"
              class="block text-sm text-brand-accent underline underline-offset-2 hover:brightness-90"
            >
              {{ booking.User.email }}
            </a>
            <a
              v-if="userDetails?.mobile_number"
              :href="'tel:' + userDetails.mobile_number"
              class="block text-sm text-brand-accent underline underline-offset-2 hover:brightness-90"
            >
              {{ userDetails.mobile_number }}
            </a>
            <p
              v-if="!booking.User.email && !userDetails?.mobile_number"
              class="text-sm text-neutral-500"
            >
              Keine Kontaktdaten hinterlegt
            </p>
          </template>
          <p v-else class="text-sm text-neutral-500">
            Kein registrierter Kunde (Gastbuchung)
          </p>
        </div>

        <div class="min-w-0 space-y-2">
          <div class="flex items-center gap-1.5">
            <h4 class="text-sm font-semibold text-neutral-900">
              Buchungsinformationen
            </h4>
            <button
              type="button"
              class="p-0.5 text-neutral-400 transition-colors hover:text-neutral-700"
              title="Buchung bearbeiten"
              @click="$emit('edit', booking)"
            >
              <IconEdit class="size-3" />
            </button>
          </div>

          <div class="flex items-start gap-2 text-sm text-neutral-900">
            <UiIcon
              name="i-lucide-door-open"
              class="mt-0.5 size-4 shrink-0 text-neutral-500"
            />
            <span>{{ booking.Resource?.name || booking.resource_name || "—" }}</span>
          </div>
          <div class="flex items-start gap-2 text-sm text-neutral-900">
            <UiIcon
              name="i-lucide-calendar"
              class="mt-0.5 size-4 shrink-0 text-neutral-500"
            />
            <span>{{ formatDateHeader(booking.start_at, booking.end_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Abrechnung -->
      <div class="border-t border-neutral-200 px-5 py-5">
        <div class="mb-3 flex items-center gap-2">
          <UiIcon name="i-lucide-file-text" class="size-4 text-neutral-500" />
          <h4 class="text-sm font-semibold text-neutral-900">Abrechnung</h4>
        </div>

        <div
          v-if="booking.Invoice"
          class="flex items-center justify-between gap-3"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span class="truncate text-sm text-neutral-800">
              Rechnung ({{ booking.Invoice.invoice_number }})
            </span>
            <button
              type="button"
              class="shrink-0 p-1 text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-50"
              :disabled="isDownloading"
              title="PDF herunterladen"
              @click="downloadInvoice(booking.Invoice.id)"
            >
              <UiIcon name="i-lucide-download" class="size-4" />
            </button>
          </div>
          <p class="shrink-0 text-sm font-bold text-neutral-900">
            {{ formatCurrency(booking.Invoice.total_amount) }}
          </p>
        </div>

        <p v-else-if="booking.paid_with_quota" class="text-sm text-neutral-600">
          Gebucht über das hinterlegte Kontingent
        </p>

        <div v-else class="flex items-center justify-between gap-2">
          <p class="text-sm text-neutral-500">Keine Rechnung</p>
          <button
            type="button"
            class="text-sm font-medium text-brand-accent underline underline-offset-2 hover:brightness-90"
            @click="
              router.push(`/booking-system/invoices/new?bookingId=${booking.id}`)
            "
          >
            Rechnung erstellen
          </button>
        </div>
      </div>

      <!-- Aufgaben / Checklist -->
      <div
        v-if="bookingTasks.length > 0"
        class="border-t border-neutral-200 px-5 py-5"
      >
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <UiIcon name="i-lucide-list-checks" class="size-4 shrink-0 text-neutral-500" />
            <h4 class="text-sm font-semibold text-neutral-900">Aufgaben</h4>
          </div>
          <span class="text-xs text-neutral-500">
            {{ completedTaskCount }}/{{ bookingTasks.length }} erledigt
          </span>
        </div>

        <ul class="space-y-3">
          <li
            v-for="task in bookingTasks"
            :key="task.id"
            class="border border-neutral-100 px-3 py-3"
          >
            <label class="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                class="mt-0.5 border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                :checked="!!task.is_completed"
                :disabled="togglingTaskId === task.id"
                @change="toggleTask(task, ($event.target as HTMLInputElement).checked)"
              />
              <div class="min-w-0 flex-1">
                <div
                  class="text-sm font-medium text-neutral-900"
                  :class="{ 'line-through text-neutral-400': task.is_completed }"
                >
                  {{ task.title }}
                </div>
                <p
                  v-if="task.description"
                  class="mt-1 whitespace-pre-wrap text-xs text-neutral-500"
                >
                  {{ task.description }}
                </p>

                <div
                  v-if="instructionFiles(task).length"
                  class="mt-2 space-y-1"
                >
                  <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    Anleitungen
                  </p>
                  <a
                    v-for="file in instructionFiles(task)"
                    :key="file.id"
                    :href="getFileUrl(file.file_path)"
                    target="_blank"
                    rel="noopener"
                    class="block truncate text-xs text-brand-accent underline-offset-2 hover:underline"
                  >
                    {{ file.original_name }}
                  </a>
                </div>

                <div class="mt-3 space-y-2">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                    Nachweise
                  </p>
                  <ul
                    v-if="proofFiles(task).length"
                    class="space-y-1"
                  >
                    <li
                      v-for="file in proofFiles(task)"
                      :key="file.id"
                      class="flex items-center justify-between gap-2 text-xs"
                    >
                      <a
                        :href="getFileUrl(file.file_path)"
                        target="_blank"
                        rel="noopener"
                        class="truncate text-neutral-700 underline-offset-2 hover:underline"
                      >
                        {{ file.original_name }}
                      </a>
                      <button
                        type="button"
                        class="shrink-0 text-neutral-400 hover:text-red-600"
                        title="Nachweis löschen"
                        @click.stop="removeProof(task, file)"
                      >
                        <UiIcon name="i-lucide-trash-2" class="size-3.5" />
                      </button>
                    </li>
                  </ul>
                  <input
                    type="file"
                    class="block w-full text-xs text-neutral-600 file:mr-2 file:border-0 file:bg-neutral-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-neutral-800"
                    :disabled="uploadingTaskId === task.id"
                    @change="onProofSelected(task, $event)"
                  />
                </div>
              </div>
            </label>
          </li>
        </ul>
      </div>

      <!-- Kommunikation -->
      <div class="border-t border-neutral-200 px-5 py-5">
        <div class="mb-3 flex items-center justify-between gap-3">
          <button
            type="button"
            class="flex min-w-0 items-center gap-2 text-left"
            @click="commSectionOpen = !commSectionOpen"
          >
            <UiIcon name="i-lucide-mail" class="size-4 shrink-0 text-neutral-500" />
            <h4 class="text-sm font-semibold text-neutral-900">Kommunikation</h4>
            <UiIcon
              name="i-lucide-chevron-up"
              class="size-4 shrink-0 text-neutral-400 transition-transform"
              :class="{ 'rotate-180': !commSectionOpen }"
            />
          </button>
          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="px-2 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              @click="$emit('welcome-email')"
            >
              WiFi / Welcome
            </button>
            <button
              type="button"
              class="btn-dialog-primary !px-3 !py-1.5 !text-xs"
              @click="$emit('compose-email')"
            >
              Email senden
            </button>
          </div>
        </div>

        <div v-show="commSectionOpen">
          <CommunicationHistory
            v-if="booking.id"
            ref="communicationHistoryRef"
            variant="list"
            :booking-id="booking.id"
          />
        </div>
      </div>
    </div>

    <!-- Footer actions -->
    <div
      class="shrink-0 border-t border-neutral-200 bg-white px-5 py-4"
    >
      <div v-if="booking.status === 'PENDING'" class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          @click="requestStatusChange('CONFIRMED')"
        >
          Buchung bestätigen
        </button>
        <button
          type="button"
          class="btn-dialog-primary"
          @click="requestStatusChange('CANCELLED')"
        >
          Buchung ablehnen
        </button>
      </div>

      <div
        v-else-if="booking.status === 'CONFIRMED'"
        class="grid grid-cols-2 gap-3"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          @click="$emit('edit', booking)"
        >
          Verschieben
        </button>
        <button
          type="button"
          class="btn-dialog-primary"
          @click="requestStatusChange('CANCELLED')"
        >
          Stornieren
        </button>
      </div>

      <div v-else class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
          @click="$emit('edit', booking)"
        >
          Details bearbeiten
        </button>
        <button
          type="button"
          class="btn-dialog-danger"
          @click="handleDeletion"
        >
          Löschen
        </button>
      </div>
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
      <label
        class="flex cursor-pointer items-center gap-2 text-sm text-neutral-600"
      >
        <input
          v-model="shouldSendEmail"
          type="checkbox"
          class="border-neutral-300 text-neutral-900 focus:ring-neutral-900"
        />
        Kunden per E-Mail benachrichtigen
      </label>
    </ConfirmationModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import ConfirmationModal from "@/components/app/ConfirmationModal.vue";
import CommunicationHistory from "@/components/communication/CommunicationHistory.vue";
import IconEdit from "@/components/icon/Edit.vue";

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
  "compose-email",
]);

const isDownloading = ref(false);
const commSectionOpen = ref(true);
const togglingTaskId = ref<number | null>(null);
const uploadingTaskId = ref<number | null>(null);
const communicationHistoryRef =
  ref<InstanceType<typeof CommunicationHistory> | null>(null);

const userDetails = computed(() => props.booking.User?.details);

const bookingTasks = computed(() => {
  const list = props.booking?.BookingTasks || props.booking?.bookingTasks || [];
  return [...list].sort(
    (a: any, b: any) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.id ?? 0) - (b.id ?? 0),
  );
});

const completedTaskCount = computed(
  () => bookingTasks.value.filter((t: any) => !!t.is_completed).length,
);

const getFileUrl = (filePath: string) => {
  if (!filePath) return "#";
  const path = filePath.startsWith("/") ? filePath : `/${filePath}`;
  return `${import.meta.env.VITE_INTERNAL_IMAGE_URL || ""}${path}`;
};

const instructionFiles = (task: any) =>
  (task.files || []).filter((f: any) => f.kind === "instruction");

const proofFiles = (task: any) =>
  (task.files || []).filter((f: any) => f.kind === "proof");

const replaceLocalTask = (updated: any) => {
  if (!props.booking.BookingTasks) {
    props.booking.BookingTasks = [];
  }
  const idx = props.booking.BookingTasks.findIndex(
    (t: any) => t.id === updated.id,
  );
  if (idx >= 0) {
    props.booking.BookingTasks[idx] = {
      ...props.booking.BookingTasks[idx],
      ...updated,
    };
  }
};

const toggleTask = async (task: any, checked: boolean) => {
  togglingTaskId.value = task.id;
  try {
    const updated = await api.bookings.updateTask(props.booking.id, task.id, {
      is_completed: checked,
    });
    if (updated) {
      replaceLocalTask(updated);
      emit("update-status", props.booking);
    }
  } finally {
    togglingTaskId.value = null;
  }
};

const onProofSelected = async (task: any, event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploadingTaskId.value = task.id;
  try {
    const uploaded = await api.bookings.uploadTaskFile(
      props.booking.id,
      task.id,
      file,
    );
    if (uploaded) {
      const current = props.booking.BookingTasks?.find(
        (t: any) => t.id === task.id,
      );
      if (current) {
        current.files = [...(current.files || []), uploaded];
      }
      emit("update-status", props.booking);
    }
  } finally {
    uploadingTaskId.value = null;
    input.value = "";
  }
};

const removeProof = async (task: any, file: any) => {
  const ok = await confirm({
    title: "Nachweis löschen",
    message: `„${file.original_name}“ löschen?`,
    variant: "danger",
  });
  if (!ok) return;

  await api.bookings.deleteTaskFile(props.booking.id, task.id, file.id);
  const current = props.booking.BookingTasks?.find((t: any) => t.id === task.id);
  if (current) {
    current.files = (current.files || []).filter((f: any) => f.id !== file.id);
  }
  emit("update-status", props.booking);
};

const customerFullName = computed(() => {
  const first = userDetails.value?.first_name?.trim() || "";
  const last = userDetails.value?.last_name?.trim() || "";
  const fullName = [first, last].filter(Boolean).join(" ");
  return fullName || "Gast";
});

const customerCompany = computed(
  () => userDetails.value?.company?.trim() || "",
);

const statusChipClasses: Record<string, string> = {
  CONFIRMED:
    "bg-emerald-50 border-emerald-200 text-emerald-700 focus:ring-emerald-500",
  PENDING:
    "bg-amber-50 border-amber-200 text-amber-700 focus:ring-amber-500",
  CANCELLED:
    "bg-neutral-100 border-neutral-200 text-neutral-600 focus:ring-neutral-400",
};

const statusLabels: Record<string, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  CANCELLED: "Storniert",
};

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
  const timeStr = `${formatTime(start)}-${formatTime(end)} Uhr`;
  if (formatDate(start) !== formatDate(end)) {
    return `${weekday}, ${dateStr} – ${formatDate(end)} ${timeStr}`;
  }
  return `${weekday}, ${dateStr} ${timeStr}`;
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
