<template>
  <div class="flex flex-col">
    <div v-if="loading" class="py-6 text-center text-sm text-slate-500">
      Lädt…
    </div>

    <div
      v-else-if="!logs.length"
      class="py-6 text-center text-sm text-slate-500"
    >
      Noch keine E-Mails protokolliert.
    </div>

    <ol v-else class="relative space-y-0">
      <li
        v-for="(log, index) in logs"
        :key="log.id"
        class="relative flex gap-4 pb-6 last:pb-0"
      >
        <!-- Verbindungslinie -->
        <div
          v-if="index < logs.length - 1"
          class="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200"
          aria-hidden="true"
        />

        <!-- Zeitpunkt-Punkt -->
        <div class="relative z-10 shrink-0 mt-1">
          <div
            :class="[
              'h-[22px] w-[22px] rounded-full border-2 flex items-center justify-center',
              log.error
                ? 'border-red-300 bg-red-50'
                : 'border-emerald-300 bg-emerald-50',
            ]"
          >
            <svg
              class="h-3 w-3"
              :class="log.error ? 'text-red-500' : 'text-emerald-600'"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        <!-- Eintrag -->
        <button
          type="button"
          @click="openPreview(log)"
          class="flex-1 min-w-0 text-left rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-medium text-slate-900 truncate">
              {{ log.subject }}
            </p>
            <span
              :class="[
                'shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                log.error
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700',
              ]"
            >
              {{ log.error ? "Fehlgeschlagen" : "Gesendet" }}
            </span>
          </div>

          <p class="text-xs text-slate-500 mt-1">
            {{ formatDate(log.createdAt) }}
          </p>

          <p
            v-if="log.message"
            class="text-xs text-slate-600 mt-1.5 line-clamp-2"
          >
            {{ log.message }}
          </p>

          <div
            v-if="log.attachments?.length"
            class="mt-2 flex flex-wrap gap-1"
          >
            <span
              v-for="file in log.attachments"
              :key="file"
              class="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
            >
              <svg class="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {{ file }}
            </span>
          </div>

          <p class="text-[11px] text-slate-400 mt-2">
            Vorschau anzeigen →
          </p>
        </button>
      </li>
    </ol>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div
        v-if="previewLog"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-preview-title"
      >
        <div
          class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          @click="closePreview"
        />

        <div
          class="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          <!-- Header -->
          <div class="shrink-0 px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                E-Mail-Vorschau
              </p>
              <h3
                id="email-preview-title"
                class="text-base font-semibold text-slate-900 leading-snug"
              >
                {{ previewLog.subject }}
              </h3>
              <p class="text-xs text-slate-500 mt-1.5">
                {{ formatDate(previewLog.createdAt) }}
              </p>
            </div>
            <button
              type="button"
              @click="closePreview"
              class="shrink-0 rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Schließen"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Meta -->
          <div class="shrink-0 px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <span
              :class="[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                previewLog.error
                  ? 'bg-red-100 text-red-800'
                  : 'bg-emerald-100 text-emerald-800',
              ]"
            >
              {{ previewLog.error ? "Fehlgeschlagen" : "Erfolgreich gesendet" }}
            </span>

            <NuxtLink
              v-if="showBookingLink && previewLog.Booking"
              :to="`/booking-system/calendar?id=${previewLog.Booking.id}`"
              class="text-xs text-blue-600 hover:underline"
              @click="closePreview"
            >
              Buchung #{{ previewLog.Booking.id }}
              <span v-if="previewLog.Booking.Resource?.name">
                · {{ previewLog.Booking.Resource.name }}
              </span>
            </NuxtLink>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <div
              v-if="previewLog.error"
              class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p class="font-medium text-red-800 mb-0.5">Fehler beim Versand</p>
              <p class="text-red-600">{{ previewLog.error }}</p>
            </div>

            <div
              v-if="previewLog.attachments?.length"
              class="mb-4 flex flex-wrap gap-2"
            >
              <span
                v-for="file in previewLog.attachments"
                :key="file"
                class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
              >
                <svg class="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {{ file }}
              </span>
            </div>

            <div
              v-if="previewLog.message"
              class="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-4"
            >
              <p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Nachricht
              </p>
              <p class="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {{ previewLog.message }}
              </p>
            </div>
            <p v-else class="text-sm text-slate-400 italic">
              Kein Nachrichteninhalt gespeichert.
            </p>
          </div>

          <!-- Footer -->
          <div class="shrink-0 px-5 py-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              @click="closePreview"
              class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from "vue";

const props = defineProps<{
  userId?: number;
  bookingId?: number;
  showBookingLink?: boolean;
}>();

const api = useBookingApi();
const logs = ref<any[]>([]);
const loading = ref(false);
const previewLog = ref<any | null>(null);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const openPreview = (log: any) => {
  previewLog.value = log;
  document.body.style.overflow = "hidden";
};

const closePreview = () => {
  previewLog.value = null;
  document.body.style.overflow = "";
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && previewLog.value) closePreview();
};

const loadLogs = async () => {
  if (!props.bookingId && !props.userId) {
    logs.value = [];
    return;
  }

  loading.value = true;
  try {
    let data = null;
    if (props.bookingId) {
      data = await api.communications.getByBooking(props.bookingId);
    } else if (props.userId) {
      data = await api.communications.getByUser(props.userId);
    }
    logs.value = Array.isArray(data) ? data : [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  document.body.style.overflow = "";
});

watch(
  () => [props.userId, props.bookingId],
  () => loadLogs(),
  { immediate: true },
);

defineExpose({ reload: loadLogs });
</script>
