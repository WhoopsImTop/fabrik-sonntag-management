<template>
  <label class="block space-y-1">
    <span class="text-sm font-medium text-neutral-800">{{
      schema.label || schema.key
    }}</span>
    <select
      class="dialog-input"
      :value="String(value ?? '')"
      :disabled="disabled"
      @change="onChange"
    >
      <option v-for="option in schema.enumValues || []" :key="option" :value="option">
        {{ schema.enumLabels?.[option] || option }}
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import type { CapabilitySchema } from "~/composables/useHeatingApi";

defineProps<{
  schema: CapabilitySchema;
  value: unknown;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [value: string];
}>();

const onChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit("change", target.value);
};
</script>
