<template>
  <div class="space-y-1">
    <p class="text-xs text-neutral-500">{{ schema.label || schema.key }}</p>
    <div class="flex items-center gap-2">
      <div class="h-2 w-24 overflow-hidden bg-neutral-100">
        <div
          class="h-full bg-neutral-800"
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
  const min = props.schema.min ?? 0;
  const max = props.schema.max ?? 100;
  const pct = ((n - min) / (max - min || 1)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
});
</script>
