<template>
  <div class="space-y-1">
    <p class="text-xs text-neutral-500">{{ schema.label || schema.key }}</p>
    <div class="flex items-center gap-2">
      <div class="h-2 w-24 overflow-hidden bg-neutral-100">
        <div
          class="h-full"
          :class="barClass"
          :style="{ width: `${clamped}%` }"
        />
      </div>
      <span class="text-sm tabular-nums text-neutral-800">
        {{ clamped }}{{ schema.unit || "%" }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CapabilitySchema } from "~/composables/useHeatingApi";

const props = defineProps<{
  schema: CapabilitySchema;
  value: unknown;
}>();

const clamped = computed(() => {
  const n = Number(props.value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
});

const barClass = computed(() => {
  if (clamped.value <= 20) return "bg-red-500";
  if (clamped.value <= 50) return "bg-amber-500";
  return "bg-emerald-500";
});
</script>
