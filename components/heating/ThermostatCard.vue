<template>
  <div
    class="border bg-white p-4"
    :class="windowOpen ? 'border-sky-400' : 'border-neutral-200'"
  >
    <div
      v-if="name || location || href || battery != null || windowOpen"
      class="mb-2 flex items-start justify-between gap-2"
    >
      <div class="min-w-0">
        <div v-if="editingName">
          <input
            ref="nameInput"
            v-model="draftName"
            class="dialog-input py-0.5 text-sm font-medium"
            @keydown.enter.prevent="commitName"
            @keydown.esc.prevent="cancelName"
            @blur="commitName"
          />
        </div>
        <div v-else class="flex min-w-0 items-center gap-1">
          <p v-if="name" class="truncate font-medium text-neutral-900">
            <NuxtLink v-if="href" :to="href" class="hover:underline">
              {{ name }}
            </NuxtLink>
            <span v-else>{{ name }}</span>
          </p>
          <button
            v-if="editable"
            type="button"
            class="shrink-0 text-neutral-400 hover:text-neutral-800"
            aria-label="Umbenennen"
            @click.stop="startEditName"
          >
            <UiIcon name="i-lucide-pencil" class="size-3.5" />
          </button>
        </div>
        <p v-if="location" class="truncate text-xs text-neutral-500">
          {{ location }}
        </p>
      </div>
      <div class="flex flex-col shrink-0 items-end gap-2">
        <span
          v-if="windowOpen"
          class="inline-flex items-center gap-1 text-xs font-medium text-sky-700"
          title="Fensteroffen-Erkennung aktiv"
        >
          <UiIcon name="i-lucide-wind" class="size-3.5" />
          Fenster offen
        </span>
        <span
          v-if="!batteryItems.length && battery != null"
          class="inline-flex items-center gap-1 text-xs font-medium tabular-nums"
          :class="batteryClass"
          :title="`Batterie ${Math.round(battery)}%`"
        >
          <UiIcon :name="batteryIcon" class="size-3.5" />
          {{ Math.round(battery) }}%
        </span>
        <HeatingOfflineBadge
          v-if="name || location || href"
          :offline="offline"
        />
      </div>
    </div>

    <div
      class="relative mx-auto"
      :style="{ width: `${VIEW}px`, height: `${VIEW}px` }"
    >
      <svg
        ref="svgRef"
        class="block select-none touch-none"
        :class="
          disabled || !targetCap
            ? 'cursor-default'
            : dragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
        "
        :viewBox="`0 0 ${VIEW} ${VIEW}`"
        role="slider"
        :aria-label="targetCap?.label || 'Soll-Temperatur'"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="target"
        :aria-disabled="disabled || !targetCap ? 'true' : 'false'"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <path
          :d="trackPath"
          fill="none"
          stroke="#e5e5e5"
          stroke-width="14"
          stroke-linecap="round"
        />
        <path
          :d="valuePath"
          fill="none"
          :stroke="ringColor"
          stroke-width="14"
          stroke-linecap="round"
        />
        <circle
          v-if="currentMarker"
          :cx="currentMarker.x"
          :cy="currentMarker.y"
          r="4"
          fill="#737373"
        />
        <circle
          :cx="knob.x"
          :cy="knob.y"
          r="9"
          fill="#fff"
          :stroke="ringColor"
          stroke-width="3"
        />
      </svg>

      <div
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {{ statusLabel }}
        </p>
        <p
          class="text-4xl font-semibold tabular-nums leading-none text-neutral-900"
        >
          {{ formatTemp(currentTemp ?? target) }}
        </p>
        <p class="mt-1 text-sm tabular-nums text-neutral-500">
          Soll
          {{
            mixedTarget && pendingTarget == null
              ? "gemischt"
              : `${formatTemp(target)}°`
          }}
        </p>
        <UiIcon
          v-if="windowOpen"
          name="i-lucide-wind"
          class="mt-1 size-4 text-sky-600"
        />
        <UiIcon
          v-else-if="heating"
          name="i-lucide-flame"
          class="mt-1 size-4 text-orange-500"
        />
      </div>

      <div
        class="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-10"
      >
        <button
          type="button"
          class="flex size-10 items-center justify-center border border-neutral-200 bg-white text-lg text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
          :disabled="
            disabled || !targetCap || (target != null && target <= min)
          "
          aria-label="Temperatur senken"
          @pointerdown.stop
          @pointerup.stop
          @click="nudge(-step)"
        >
          −
        </button>
        <button
          type="button"
          class="flex size-10 items-center justify-center border border-neutral-200 bg-white text-lg text-neutral-800 hover:bg-neutral-50 disabled:opacity-40"
          :disabled="
            disabled || !targetCap || (target != null && target >= max)
          "
          aria-label="Temperatur erhöhen"
          @pointerdown.stop
          @pointerup.stop
          @click="nudge(step)"
        >
          +
        </button>
      </div>
    </div>

    <div v-if="batteryItems.length" class="grid grid-cols-2 gap-1">
      <span
        v-for="item in batteryItems"
        :key="item.label"
        class="inline-flex items-center gap-1 text-xs font-medium tabular-nums p-2 border border-neutral-200"
        :class="batteryClassFor(item.battery)"
        :title="
          item.battery == null
            ? `${item.label}: keine Batteriedaten`
            : `${item.label}: ${Math.round(item.battery)}%`
        "
      >
        <UiIcon :name="batteryIconFor(item.battery)" class="size-3.5" />
        <span class="max-w-[7rem] truncate font-normal">{{ item.label }}</span>
        {{ item.battery == null ? "—" : `${Math.round(item.battery)}%` }}
      </span>
    </div>

    <div
      v-if="modeCap?.enumValues?.length"
      class="mt-2 flex border border-neutral-200"
    >
      <button
        v-for="mode in modeCap.enumValues"
        :key="mode"
        type="button"
        class="flex-1 px-2 py-2 text-sm"
        :class="
          systemMode === mode
            ? 'bg-neutral-900 text-white'
            : 'bg-white text-neutral-700 hover:bg-neutral-50'
        "
        :disabled="disabled"
        @click="setMode(mode)"
      >
        {{ modeLabel(mode) }}
      </button>
    </div>

    <div class="flex items-center justify-between">
      <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
        <span v-if="currentTemp != null"
          >Ist {{ formatTemp(currentTemp) }}°</span
        >
        <span v-if="valve != null">Ventil {{ Math.round(valve) }}%</span>
      </div>
      <div>
        <NuxtLink
          v-if="href"
          :to="href"
          class="text-xs font-medium text-neutral-500 hover:text-neutral-900"
        >
          Details
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import {
  normalizeHeatingLastState,
  normalizeHeatingSchema,
  type CapabilitySchema,
} from "~/composables/useHeatingApi";

const VIEW = 240;
const CX = 120;
const CY = 112;
const RADIUS = 84;
const START_ANGLE = 225;
const SWEEP = 270;

const MODE_LABELS: Record<string, string> = {
  off: "Aus",
  heat: "Heizen",
  auto: "Auto",
  cool: "Kühlen",
};

const props = withDefaults(
  defineProps<{
    name?: string;
    location?: string;
    href?: string;
    lastState?: Record<string, unknown> | null;
    schema?: CapabilitySchema[] | string | null;
    offline?: boolean;
    disabled?: boolean;
    mixedTarget?: boolean;
    editable?: boolean;
    batteryItems?: { label: string; battery: number | null }[];
  }>(),
  {
    lastState: () => ({}),
    schema: () => [],
    mixedTarget: false,
    editable: false,
    batteryItems: () => [],
  },
);

const emit = defineEmits<{
  change: [key: string, value: unknown];
  rename: [name: string];
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const nameInput = ref<HTMLInputElement | null>(null);
const pendingTarget = ref<number | null>(null);
const dragging = ref(false);
const editingName = ref(false);
const draftName = ref("");

const capabilities = computed(() => normalizeHeatingSchema(props.schema));
const state = computed(() => normalizeHeatingLastState(props.lastState));

const cap = (key: string) =>
  capabilities.value.find((item) => item.key === key);

const targetCap = computed(() => cap("target_temperature"));
const modeCap = computed(() => cap("system_mode"));

const min = computed(() => Number(targetCap.value?.min ?? 5));
const max = computed(() => Number(targetCap.value?.max ?? 30));
const step = computed(() => Number(targetCap.value?.step ?? 0.5));

const currentTemp = computed(() => {
  const n = Number(state.value.current_temperature);
  return Number.isFinite(n) ? n : null;
});

const committedTarget = computed(() => {
  const n = Number(state.value.target_temperature);
  return Number.isFinite(n) ? n : null;
});

const target = computed(() => {
  if (pendingTarget.value != null) return pendingTarget.value;
  if (committedTarget.value != null) return committedTarget.value;
  return currentTemp.value;
});

watch(committedTarget, (value) => {
  if (pendingTarget.value == null || value == null) return;
  if (Math.abs(value - pendingTarget.value) < 0.05) {
    pendingTarget.value = null;
  }
});

const systemMode = computed(() => String(state.value.system_mode || ""));
const runningState = computed(() =>
  String(state.value.running_state || "").toLowerCase(),
);
const valve = computed(() => {
  const n = Number(state.value.valve_position);
  return Number.isFinite(n) ? n : null;
});
const battery = computed(() => {
  const n = Number(state.value.battery);
  return Number.isFinite(n) ? n : null;
});
function batteryIconFor(n: number | null) {
  if (n == null) return "i-lucide-battery";
  if (n <= 20) return "i-lucide-battery-warning";
  if (n <= 50) return "i-lucide-battery-medium";
  return "i-lucide-battery-full";
}
function batteryClassFor(n: number | null) {
  if (n == null) return "text-neutral-400";
  if (n <= 20) return "text-red-600";
  if (n <= 50) return "text-amber-600";
  return "text-emerald-700";
}
const batteryIcon = computed(() => batteryIconFor(battery.value));
const batteryClass = computed(() => batteryClassFor(battery.value));
const windowOpen = computed(() => Boolean(state.value.window_open));

const heating = computed(() => {
  if (systemMode.value === "off") return false;
  if (runningState.value === "heat" || runningState.value === "heating") {
    return true;
  }
  if (valve.value != null && valve.value > 5) return true;
  if (
    currentTemp.value != null &&
    target.value != null &&
    currentTemp.value < target.value - 0.3
  ) {
    return true;
  }
  return false;
});

const statusLabel = computed(() => {
  if (props.offline) return "Offline";
  if (windowOpen.value) return "Fenster offen";
  if (systemMode.value === "off") return "Aus";
  if (heating.value) return "Heizt";
  return "Bereit";
});

const ringColor = computed(() => {
  if (windowOpen.value) return "#0284c7";
  if (systemMode.value === "off") return "#a3a3a3";
  if (heating.value) return "#ea580c";
  return "#171717";
});

function snap(value: number) {
  const s = step.value || 0.5;
  const snapped = Math.round((value - min.value) / s) * s + min.value;
  const clamped = Math.min(max.value, Math.max(min.value, snapped));
  return Math.round(clamped * 10) / 10;
}

function polar(angle: number, r = RADIUS) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: CX + r * Math.sin(rad),
    y: CY - r * Math.cos(rad),
  };
}

function describeArc(from: number, to: number, r = RADIUS) {
  const start = polar(from, r);
  const end = polar(to, r);
  let delta = to - from;
  if (delta < 0) delta += 360;
  const large = delta > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

const trackPath = computed(() => describeArc(START_ANGLE, START_ANGLE + SWEEP));

function tempToAngle(temp: number) {
  const span = max.value - min.value || 1;
  const t = Math.min(1, Math.max(0, (temp - min.value) / span));
  return START_ANGLE + t * SWEEP;
}

const ringTemp = computed(() => target.value ?? min.value);

const valuePath = computed(() =>
  describeArc(START_ANGLE, tempToAngle(ringTemp.value)),
);

const currentMarker = computed(() => {
  if (currentTemp.value == null) return null;
  return polar(tempToAngle(currentTemp.value));
});

const knob = computed(() => polar(tempToAngle(ringTemp.value)));

function formatTemp(n: number | null) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

function modeLabel(mode: string) {
  return MODE_LABELS[mode] || mode;
}

function angleFromPoint(x: number, y: number) {
  const dx = x - CX;
  const dy = y - CY;
  let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

function angleToTemp(angle: number) {
  let rel = angle - START_ANGLE;
  if (rel < 0) rel += 360;
  const gap = 360 - SWEEP;
  if (rel > SWEEP) {
    rel = rel < SWEEP + gap / 2 ? SWEEP : 0;
  }
  return snap(min.value + (rel / SWEEP) * (max.value - min.value));
}

function pointFromEvent(event: PointerEvent) {
  const svg = svgRef.value;
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW,
    y: ((event.clientY - rect.top) / rect.height) * VIEW,
  };
}

function applyFromEvent(event: PointerEvent) {
  const pt = pointFromEvent(event);
  if (!pt) return;
  pendingTarget.value = angleToTemp(angleFromPoint(pt.x, pt.y));
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled || !targetCap.value) return;
  dragging.value = true;
  (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  applyFromEvent(event);
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return;
  applyFromEvent(event);
}

function commitTarget(next: number) {
  if (
    committedTarget.value != null &&
    Math.abs(next - committedTarget.value) < 0.05
  ) {
    pendingTarget.value = null;
    return;
  }
  pendingTarget.value = next;
  emit("change", "target_temperature", next);
}

function onPointerUp() {
  if (!dragging.value) return;
  dragging.value = false;
  const next = pendingTarget.value;
  if (next == null) return;
  commitTarget(next);
}

function nudge(delta: number) {
  if (props.disabled || !targetCap.value) return;
  const base =
    target.value ?? committedTarget.value ?? currentTemp.value ?? min.value;
  commitTarget(snap(base + delta));
}

function setMode(mode: string) {
  if (props.disabled || systemMode.value === mode) return;
  emit("change", "system_mode", mode);
}

async function startEditName() {
  draftName.value = props.name || "";
  editingName.value = true;
  await nextTick();
  nameInput.value?.focus();
  nameInput.value?.select();
}

function cancelName() {
  editingName.value = false;
  draftName.value = props.name || "";
}

function commitName() {
  if (!editingName.value) return;
  const next = draftName.value.trim();
  editingName.value = false;
  if (!next || next === props.name) {
    draftName.value = props.name || "";
    return;
  }
  emit("rename", next);
}

onUnmounted(() => {
  dragging.value = false;
});
</script>
