<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium text-neutral-800">
        {{ schema.label || schema.key }}
      </p>
      <p class="text-sm tabular-nums text-neutral-700">
        {{ displayValue }}{{ schema.unit ? ` ${schema.unit}` : "" }}
      </p>
    </div>
    <input
      type="range"
      class="w-full accent-neutral-900"
      :min="schema.min ?? 4"
      :max="schema.max ?? 35"
      :step="schema.step ?? 0.5"
      :value="numeric"
      :disabled="disabled"
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CapabilitySchema } from "~/composables/useHeatingApi";

const props = defineProps<{
  schema: CapabilitySchema;
  value: unknown;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [value: number];
}>();

const numeric = computed(() => {
  const n = Number(props.value);
  return Number.isFinite(n) ? n : (props.schema.min ?? 20);
});

const displayValue = computed(() =>
  numeric.value.toLocaleString("de-DE", { maximumFractionDigits: 1 }),
);

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("change", Number(target.value));
};
</script>
