<template>
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm text-neutral-700">{{ schema.label || schema.key }}</p>
    <p class="text-sm tabular-nums text-neutral-900">
      {{ formatted }}
      <span v-if="schema.unit" class="text-neutral-500">{{ schema.unit }}</span>
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
    return props.value.toLocaleString("de-DE", { maximumFractionDigits: 2 });
  }
  if (typeof props.value === "boolean") return props.value ? "Ja" : "Nein";
  return String(props.value);
});
</script>
