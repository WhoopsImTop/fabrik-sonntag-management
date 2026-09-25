<template>
  <div class="border border-neutral-200 bg-white p-4 rounded-xl">
    <div class="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="font-semibold">Heizplan</h2>
        <p class="mt-1 text-sm text-neutral-500">{{ hint }}</p>
      </div>
      <label v-if="showEco" class="text-sm">
        <span class="dialog-label">Absenktemperatur °C</span>
        <input
          v-model.number="ecoDraft"
          type="number"
          step="0.5"
          class="dialog-input w-24"
          :disabled="disabled"
        />
      </label>
    </div>

    <div class="flex gap-2">
      <div class="flex w-8 shrink-0 flex-col pt-5">
        <div
          v-for="day in days"
          :key="`label-${day.weekday}`"
          class="flex h-11 items-center text-xs font-medium text-neutral-600"
          :class="day.weekday !== 0 ? 'mb-1' : ''"
        >
          {{ day.label }}
        </div>
      </div>

      <div class="min-w-0 flex-1">
        <div class="relative mb-1 h-4 text-[10px] tabular-nums text-neutral-500">
          <span
            v-for="hour in hourMarks"
            :key="`h-${hour}`"
            class="absolute tabular-nums"
            :class="[
              hour === 24 ? '-translate-x-full' : hour === 0 ? 'translate-x-0' : '-translate-x-1/2',
              hour % 2 === 1 ? 'hidden text-neutral-400 sm:inline' : 'font-medium text-neutral-600',
            ]"
            :style="{ left: `${(hour / 24) * 100}%` }"
          >{{ pad(hour) }}</span>
        </div>

        <div class="relative">
          <div class="pointer-events-none absolute inset-0 z-10">
            <div
              v-for="hour in hourMarks"
              :key="`line-${hour}`"
              class="absolute top-0 bottom-0 w-px"
              :class="hour % 6 === 0 ? 'bg-neutral-400/20' : 'bg-neutral-300/30'"
              :style="hour === 24 ? { right: 0 } : { left: `${(hour / 24) * 100}%` }"
            />
          </div>

          <div class="space-y-1">
            <div
              v-for="day in days"
              :key="day.weekday"
              class="relative h-11 touch-none select-none bg-neutral-100"
              @pointerdown="onTrackDown(day.weekday, $event)"
            >
              <div
                v-for="block in blocksFor(day.weekday)"
                :key="block.key"
                class="absolute top-0.5 bottom-0.5 z-0 flex flex-col items-center justify-center overflow-hidden px-2 text-center font-medium tabular-nums text-white"
                :class="blockClass(block)"
                :style="blockStyle(block)"
                @pointerdown.stop="onBlockDown(block, $event)"
              >
                <span
                  class="absolute inset-y-0 left-0 z-20 w-1.5 cursor-ew-resize bg-white/40"
                  @pointerdown.stop="onResizeDown(block, 'start', $event)"
                />
                <span class="max-w-full truncate text-[10px] leading-tight">
                  {{ formatHm(block.start) }}–{{ formatHm(block.end) }}
                </span>
                <span class="text-xs leading-tight">
                  {{ formatTemp(block.target_temperature) }}°
                </span>
                <span
                  class="absolute inset-y-0 right-0 z-20 w-1.5 cursor-ew-resize bg-white/40"
                  @pointerdown.stop="onResizeDown(block, 'end', $event)"
                />
              </div>
              <div
                v-if="draft && draft.weekday === day.weekday"
                class="pointer-events-none absolute top-0.5 bottom-0.5 z-0 flex flex-col items-center justify-center bg-orange-400/60 px-1 text-center text-[10px] font-medium tabular-nums text-white"
                :style="draftStyle"
              >
                <span class="max-w-full truncate leading-tight">{{ draftRangeLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap justify-end gap-2">
      <UiButton
        v-if="copyable"
        size="sm"
        variant="outline"
        color="neutral"
        icon="i-lucide-copy"
        :disabled="disabled || saving"
        @click="copy"
      >
        {{ copyLabel }}
      </UiButton>
      <UiButton size="sm" :disabled="disabled || saving" :loading="saving" @click="save">
        Heizplan speichern
      </UiButton>
    </div>

    <UiModal v-model:open="editOpen" title="Heizintervall">
      <template #body>
        <p class="mb-3 text-sm text-neutral-600">{{ editDayLabel }}</p>
        <div class="mb-3 grid grid-cols-2 gap-3">
          <label class="text-sm">
            <span class="dialog-label">Von</span>
            <input v-model="editStart" type="time" step="60" class="dialog-input" />
          </label>
          <label class="text-sm">
            <span class="dialog-label">Bis</span>
            <input v-model="editEnd" type="time" step="60" class="dialog-input" />
          </label>
        </div>
        <label class="text-sm">
          <span class="dialog-label">Soll-Temperatur °C</span>
          <input
            v-model.number="editTemp"
            type="number"
            :min="min"
            :max="max"
            :step="step"
            class="dialog-input"
          />
        </label>
        <p v-if="editError" class="mt-2 text-sm text-red-600">{{ editError }}</p>
      </template>
      <template #footer>
        <button class="btn-dialog-cancel" type="button" @click="removeEditing">
          Löschen
        </button>
        <button class="btn-dialog-primary" type="button" @click="confirmEdit">
          Übernehmen
        </button>
      </template>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

export type ScheduleInterval = {
  key?: string;
  weekday: number;
  start: string;
  end: string;
  target_temperature: number;
};

const DAYS = [
  { weekday: 1, label: "Mo" },
  { weekday: 2, label: "Di" },
  { weekday: 3, label: "Mi" },
  { weekday: 4, label: "Do" },
  { weekday: 5, label: "Fr" },
  { weekday: 6, label: "Sa" },
  { weekday: 0, label: "So" },
];

const SNAP = 30;
const DAY_MINUTES = 24 * 60;

const props = withDefaults(
  defineProps<{
    intervals?: ScheduleInterval[];
    ecoTemperature?: number;
    native?: boolean;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    saving?: boolean;
    showEco?: boolean;
    hint?: string;
    copyable?: boolean;
    copyLabel?: string;
  }>(),
  {
    copyLabel: "In andere Räume kopieren",
    intervals: () => [],
    ecoTemperature: 16,
    min: 5,
    max: 30,
    step: 0.5,
    showEco: true,
  },
);

const emit = defineEmits<{
  save: [payload: { eco_temperature: number; intervals: ScheduleInterval[] }];
  copy: [payload: { eco_temperature: number; intervals: ScheduleInterval[] }];
}>();

const days = DAYS;
const hourMarks = Array.from({ length: 25 }, (_, i) => i);
const ecoDraft = ref(Number(props.ecoTemperature) || 16);
const local = ref<ScheduleInterval[]>([]);
const draft = ref<{ weekday: number; start: number; end: number } | null>(null);
const moved = ref(false);
const editOpen = ref(false);
const editingKey = ref<string | null>(null);
const editTemp = ref(21);
const editStart = ref("06:00");
const editEnd = ref("22:00");
const editError = ref("");

watch(
  () => [props.intervals, props.ecoTemperature],
  () => {
    ecoDraft.value = Number(props.ecoTemperature) || 16;
    local.value = (props.intervals || []).map((row, idx) => ({
      ...row,
      key: row.key || `row-${idx}-${row.weekday}-${row.start}`,
    }));
  },
  { immediate: true, deep: true },
);

const hint = computed(() => {
  if (props.hint) return props.hint;
  return props.native
    ? "Auf dem Gerät gespeichert (Auto-Modus)."
    : "Server schaltet per MQTT zur jeweiligen Uhrzeit.";
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function hmToMin(hm: string) {
  const match = String(hm).match(/(\d{2}):(\d{2})/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2]);
}

function minToHm(total: number) {
  const clamped = Math.max(0, Math.min(DAY_MINUTES - 1, Math.round(total)));
  return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}`;
}

function snapMin(value: number) {
  return Math.max(0, Math.min(DAY_MINUTES, Math.round(value / SNAP) * SNAP));
}

function formatTemp(n: number) {
  return n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

function formatHm(hm: string) {
  const match = String(hm).match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : hm;
}

function blocksFor(weekday: number) {
  return local.value.filter((row) => row.weekday === weekday);
}

function blockStyle(block: ScheduleInterval) {
  const start = hmToMin(block.start);
  const end = hmToMin(block.end);
  return {
    left: `${(start / DAY_MINUTES) * 100}%`,
    width: `${(Math.max(end - start, SNAP) / DAY_MINUTES) * 100}%`,
  };
}

function blockClass(block: ScheduleInterval) {
  const t = block.target_temperature;
  if (t >= 22) return "bg-orange-600";
  if (t >= 20) return "bg-orange-500";
  if (t >= 18) return "bg-amber-500";
  return "bg-neutral-500";
}

const draftStyle = computed(() => {
  if (!draft.value) return {};
  const start = Math.min(draft.value.start, draft.value.end);
  const end = Math.max(draft.value.start, draft.value.end);
  return {
    left: `${(start / DAY_MINUTES) * 100}%`,
    width: `${(Math.max(end - start, SNAP) / DAY_MINUTES) * 100}%`,
  };
});

const draftRangeLabel = computed(() => {
  if (!draft.value) return "";
  const start = Math.min(draft.value.start, draft.value.end);
  const end = Math.max(draft.value.start, draft.value.end);
  return `${minToHm(start)}–${minToHm(end)}`;
});

function minutesFromEvent(event: PointerEvent, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const ratio = (event.clientX - rect.left) / rect.width;
  return snapMin(ratio * DAY_MINUTES);
}

function trackEl(event: PointerEvent) {
  return event.currentTarget as HTMLElement;
}

function onTrackDown(weekday: number, event: PointerEvent) {
  if (props.disabled) return;
  const el = trackEl(event);
  el.setPointerCapture?.(event.pointerId);
  const start = minutesFromEvent(event, el);
  draft.value = { weekday, start, end: start + SNAP };
  moved.value = false;
  const onMove = (ev: PointerEvent) => {
    if (!draft.value) return;
    moved.value = true;
    draft.value = {
      ...draft.value,
      end: minutesFromEvent(ev, el),
    };
  };
  const onUp = (ev: PointerEvent) => {
    el.releasePointerCapture?.(ev.pointerId);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    finishDraft();
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
}

function overlaps(weekday: number, start: number, end: number, exceptKey?: string) {
  return local.value.some((row) => {
    if (row.weekday !== weekday || row.key === exceptKey) return false;
    const a = hmToMin(row.start);
    const b = hmToMin(row.end);
    return start < b && end > a;
  });
}

function finishDraft() {
  const current = draft.value;
  draft.value = null;
  if (!current) return;
  const start = Math.min(current.start, current.end);
  const end = Math.max(current.start, current.end);
  if (end - start < SNAP) return;
  if (overlaps(current.weekday, start, end)) return;
  if (blocksFor(current.weekday).length >= 5) return;
  const key = `new-${Date.now()}`;
  local.value.push({
    key,
    weekday: current.weekday,
    start: minToHm(start),
    end: minToHm(end),
    target_temperature: 21,
  });
  openEdit(key);
}

function onBlockDown(block: ScheduleInterval, event: PointerEvent) {
  if (props.disabled) return;
  event.preventDefault();
  moved.value = false;
  const startX = event.clientX;
  const originStart = hmToMin(block.start);
  const originEnd = hmToMin(block.end);
  const duration = originEnd - originStart;
  const el = (event.currentTarget as HTMLElement).parentElement as HTMLElement;
  el.setPointerCapture?.(event.pointerId);
  const onMove = (ev: PointerEvent) => {
    const delta = snapMin(((ev.clientX - startX) / el.getBoundingClientRect().width) * DAY_MINUTES);
    if (Math.abs(delta) >= SNAP) moved.value = true;
    let nextStart = Math.max(0, Math.min(DAY_MINUTES - duration, originStart + delta));
    let nextEnd = nextStart + duration;
    if (overlaps(block.weekday, nextStart, nextEnd, block.key)) return;
    const idx = local.value.findIndex((row) => row.key === block.key);
    if (idx < 0) return;
    local.value[idx] = {
      ...local.value[idx],
      start: minToHm(nextStart),
      end: minToHm(nextEnd),
    };
  };
  const onUp = (ev: PointerEvent) => {
    el.releasePointerCapture?.(ev.pointerId);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
    if (!moved.value) openEdit(block.key || "");
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
}

function onResizeDown(
  block: ScheduleInterval,
  edge: "start" | "end",
  event: PointerEvent,
) {
  if (props.disabled) return;
  event.preventDefault();
  moved.value = true;
  const el = (event.currentTarget as HTMLElement).parentElement
    ?.parentElement as HTMLElement;
  el.setPointerCapture?.(event.pointerId);
  const onMove = (ev: PointerEvent) => {
    const minutes = minutesFromEvent(ev, el);
    const idx = local.value.findIndex((row) => row.key === block.key);
    if (idx < 0) return;
    const current = local.value[idx];
    let start = hmToMin(current.start);
    let end = hmToMin(current.end);
    if (edge === "start") start = Math.min(minutes, end - SNAP);
    else end = Math.max(minutes, start + SNAP);
    start = Math.max(0, start);
    end = Math.min(DAY_MINUTES, end);
    if (overlaps(current.weekday, start, end, current.key)) return;
    local.value[idx] = {
      ...current,
      start: minToHm(start),
      end: minToHm(end),
    };
  };
  const onUp = (ev: PointerEvent) => {
    el.releasePointerCapture?.(ev.pointerId);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", onUp);
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
}

function openEdit(key: string) {
  const row = local.value.find((item) => item.key === key);
  if (!row) return;
  editingKey.value = key;
  editTemp.value = row.target_temperature;
  editStart.value = formatHm(row.start);
  editEnd.value = formatHm(row.end);
  editError.value = "";
  editOpen.value = true;
}

const editDayLabel = computed(() => {
  const row = local.value.find((item) => item.key === editingKey.value);
  if (!row) return "";
  return DAYS.find((d) => d.weekday === row.weekday)?.label || "";
});

function confirmEdit() {
  const idx = local.value.findIndex((item) => item.key === editingKey.value);
  if (idx < 0) {
    editOpen.value = false;
    return;
  }
  const current = local.value[idx];
  const start = hmToMin(editStart.value);
  const end = hmToMin(editEnd.value);
  if (end <= start) {
    editError.value = "„Bis“ muss nach „Von“ liegen.";
    return;
  }
  if (overlaps(current.weekday, start, end, current.key)) {
    editError.value = "Das Intervall überschneidet sich mit einem anderen Block.";
    return;
  }
  const clamped = Math.min(props.max, Math.max(props.min, Number(editTemp.value)));
  local.value[idx] = {
    ...current,
    start: minToHm(start),
    end: minToHm(end),
    target_temperature: clamped,
  };
  editError.value = "";
  editOpen.value = false;
}

function removeEditing() {
  local.value = local.value.filter((item) => item.key !== editingKey.value);
  editOpen.value = false;
}

function currentPayload() {
  return {
    eco_temperature: Number(ecoDraft.value) || 16,
    intervals: local.value.map(({ weekday, start, end, target_temperature }) => ({
      weekday,
      start,
      end,
      target_temperature,
    })),
  };
}

function save() {
  emit("save", currentPayload());
}

// Kopiert den aktuell angezeigten Stand (inkl. ungespeicherter Änderungen)
function copy() {
  emit("copy", currentPayload());
}
</script>
