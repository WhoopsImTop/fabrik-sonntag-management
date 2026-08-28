<template>
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm font-medium text-neutral-800">
      {{ schema.label || schema.key }}
    </p>
    <UiToggle :model-value="Boolean(value)" :disabled="disabled" @update:model-value="onToggle" />
  </div>
</template>

<script setup lang="ts">
import type { CapabilitySchema } from "~/composables/useHeatingApi";

defineProps<{
  schema: CapabilitySchema;
  value: unknown;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [value: boolean];
}>();

const onToggle = (next: boolean) => emit("change", next);
</script>
