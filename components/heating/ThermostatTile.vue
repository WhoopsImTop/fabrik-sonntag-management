<script setup lang="ts">
import { computed } from "vue";
import {
  normalizeHeatingLastState,
  type HeatingEntity,
} from "~/composables/useHeatingApi";

const props = defineProps<{
  entity: HeatingEntity;
}>();

const state = computed(() =>
  normalizeHeatingLastState(props.entity.last_state),
);

const current = computed(() => {
  const n = Number(state.value.current_temperature);
  return Number.isFinite(n) ? n : null;
});

const target = computed(() => {
  const n = Number(state.value.target_temperature);
  return Number.isFinite(n) ? n : null;
});

const battery = computed(() => {
  const n = Number(state.value.battery ?? props.entity.battery);
  return Number.isFinite(n) ? n : null;
});

const windowOpen = computed(() => Boolean(state.value.window_open));
const heating = computed(() => {
  const mode = String(state.value.system_mode || "");
  if (mode === "off") return false;
  const running = String(state.value.running_state || "").toLowerCase();
  if (running === "heat" || running === "heating") return true;
  const valve = Number(state.value.valve_position);
  if (Number.isFinite(valve) && valve > 5) return true;
  if (current.value != null && target.value != null) {
    return current.value < target.value - 0.3;
  }
  return false;
});

function formatTemp(n: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

const batteryClass = computed(() => {
  if (battery.value == null) return "text-neutral-400";
  if (battery.value <= 20) return "text-red-600";
  if (battery.value <= 50) return "text-amber-600";
  return "text-emerald-700";
});
</script>

<template>
  <NuxtLink
    :to="`/heating/entities/${entity.id}`"
    class="flex w-64 shrink-0 flex-col border bg-white p-2.5 hover:border-neutral-400"
    :class="windowOpen ? 'border-sky-400' : 'border-neutral-200'"
  >
    <p class="truncate text-xs font-medium text-neutral-800">
      {{ entity.name }}
    </p>
    <p
      class="mt-1 text-2xl font-semibold tabular-nums leading-none text-neutral-900"
    >
      {{ formatTemp(current)
      }}<span v-if="current != null" class="text-base font-medium">°</span>
    </p>
    <p class="mt-1 text-xs tabular-nums text-neutral-500">
      Soll {{ formatTemp(target) }}<template v-if="target != null">°</template>
    </p>
    <div class="mt-auto flex items-center gap-1 pt-2 text-neutral-400">
      <UiIcon
        v-if="windowOpen"
        name="i-lucide-wind"
        class="size-3.5 text-sky-600"
      />
      <UiIcon
        v-else-if="heating"
        name="i-lucide-flame"
        class="size-3.5 text-orange-500"
      />
      <span
        v-if="entity.offline"
        class="text-[10px] font-medium text-amber-700"
      >
        Offline
      </span>
      <span
        v-if="battery != null"
        class="ml-auto inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums"
        :class="batteryClass"
      >
        {{ Math.round(battery) }}%
      </span>
    </div>
  </NuxtLink>
</template>
