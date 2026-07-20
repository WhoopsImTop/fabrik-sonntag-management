<template>
  <div class="flex flex-col">
    <div v-if="loading" class="py-6 text-center text-sm text-neutral-500">
      Lädt…
    </div>

    <div
      v-else-if="!logs.length"
      class="py-6 text-center text-sm text-neutral-500"
    >
      Noch keine E-Mails protokolliert.
    </div>

    <!-- Compact list variant (booking details) -->
    <ul v-else-if="variant === 'list'" class="divide-y divide-neutral-200">
      <li v-for="log in logs" :key="log.id">
        <button
          type="button"
          class="flex w-full items-start justify-between gap-3 py-3 text-left transition-colors hover:bg-neutral-50"
          @click="openPreview(log)"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-neutral-900">
              {{ log.subject || "Ohne Betreff" }}
            </p>
            <p class="mt-0.5 text-xs text-neutral-500">
              {{ formatDate(log.createdAt) }} Uhr
            </p>
          </div>
          <UiIcon
            name="i-lucide-eye"
            class="mt-0.5 size-4 shrink-0 text-neutral-400"
          />
        </button>
      </li>
    </ul>

    <!-- Default timeline -->
    <ol v-else class="relative space-y-0">
      <li
        v-for="(log, index) in logs"
        :key="log.id"
        class="relative flex gap-4 pb-6 last:pb-0"
      >
        <div
          v-if="index < logs.length - 1"
          class="absolute bottom-0 left-[11px] top-6 w-px bg-slate-200"
          aria-hidden="true"
        />

        <div class="relative z-10 mt-1 shrink-0">
          <div
            :class="[
              'flex h-[22px] w-[22px] items-center justify-center rounded-full border-2',
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

        <button
          type="button"
          class="min-w-0 flex-1 rounded-none border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1"
          @click="openPreview(log)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="truncate text-sm font-medium text-slate-900">
              {{ log.subject }}
            </p>
            <span
              :class="[
                'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                log.error
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700',
              ]"
            >
              {{ log.error ? "Fehlgeschlagen" : "Gesendet" }}
            </span>
          </div>

          <p class="mt-1 text-xs text-slate-500">
            {{ formatDate(log.createdAt) }}
          </p>

          <p
            v-if="log.message"
            class="mt-1.5 line-clamp-2 text-xs text-slate-600"
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
              {{ file }}
            </span>
          </div>

          <p class="mt-2 text-[11px] text-slate-400">Vorschau anzeigen →</p>
        </button>
      </li>
    </ol>

    <Teleport to="body">
      <div
        v-if="previewLog"
        class="dialog-overlay z-[100]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-preview-title"
      >
        <div class="absolute inset-0" @click="closePreview" />

        <div class="dialog-panel max-w-2xl">
          <div class="dialog-header">
            <div class="min-w-0 flex-1">
              <p
                class="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
              >
                E-Mail-Vorschau
              </p>
              <h3 id="email-preview-title" class="dialog-title">
                {{ previewLog.subject }}
              </h3>
              <p class="dialog-desc">
                {{ formatDate(previewLog.createdAt) }}
              </p>
            </div>
            <button
              type="button"
              class="dialog-close"
              aria-label="Schließen"
              @click="closePreview"
            >
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>

          <div
            class="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 px-6 py-3"
          >
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
              class="text-xs text-neutral-700 hover:underline"
              @click="closePreview"
            >
              Buchung #{{ previewLog.Booking.id }}
              <span v-if="previewLog.Booking.Resource?.name">
                · {{ previewLog.Booking.Resource.name }}
              </span>
            </NuxtLink>
          </div>

          <div class="dialog-body">
            <div
              v-if="previewLog.error"
              class="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p class="mb-0.5 font-medium text-red-800">Fehler beim Versand</p>
              <p class="text-red-600">{{ previewLog.error }}</p>
            </div>

            <div
              v-if="previewLog.attachments?.length"
              class="mb-4 flex flex-wrap gap-2"
            >
              <span
                v-for="file in previewLog.attachments"
                :key="file"
                class="inline-flex items-center gap-1.5 border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700"
              >
                {{ file }}
              </span>
            </div>

            <div
              v-if="previewLog.message"
              class="border border-neutral-200 px-4 py-4"
            >
              <p
                class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
              >
                Nachricht
              </p>
              <p
                class="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700"
              >
                {{ previewLog.message }}
              </p>
            </div>
            <p v-else class="text-sm italic text-neutral-400">
              Kein Nachrichteninhalt gespeichert.
            </p>
          </div>

          <div class="dialog-footer">
            <button
              type="button"
              class="btn-dialog-cancel"
              @click="closePreview"
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

const props = withDefaults(
  defineProps<{
    userId?: number;
    bookingId?: number;
    showBookingLink?: boolean;
    variant?: "timeline" | "list";
  }>(),
  {
    variant: "timeline",
  },
);

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
