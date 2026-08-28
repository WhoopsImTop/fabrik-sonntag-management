<template>
  <div class="space-y-1">
    <p class="text-xs text-neutral-500">{{ schema.label || schema.key }}</p>
    <p class="text-2xl font-semibold tabular-nums text-neutral-900">
      {{ formatted }}
      <span v-if="schema.unit" class="text-base font-normal text-neutral-500">{{
        schema.unit
      }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CapabilitySchema } from "~/composables/useHeatingApi";

const props = defineProps<{
  schema: CapabilitySchema;
  value: unknown;
}>();

const formatted = computed(() => {
  if (props.value == null || props.value === "") return "—";
  if (typeof props.value === "number") {
    return props.value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
  }
  return String(props.value);
});
</script>
