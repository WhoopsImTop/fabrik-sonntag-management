<template>
  <label class="block">
    <span v-if="showLabels" class="dialog-label">Zigbee-Koordinator</span>
    <select
      class="dialog-input"
      :value="modelValue ?? ''"
      :disabled="disabled"
      @change="onChange"
    >
      <option value="" disabled>Koordinator wählen</option>
      <option
        v-for="coordinator in coordinators"
        :key="coordinator.id"
        :value="coordinator.id"
        :disabled="!coordinator.enabled"
      >
        {{ coordinator.label }} ({{ coordinator.base_topic }})
        <template v-if="!coordinator.enabled"> — deaktiviert</template>
      </option>
    </select>
  </label>
</template>

<script setup lang="ts">
import type { ZigbeeCoordinator } from "~/composables/useHeatingApi";

withDefaults(
  defineProps<{
    coordinators: ZigbeeCoordinator[];
    modelValue?: number | null;
    showLabels?: boolean;
    disabled?: boolean;
  }>(),
  {
    coordinators: () => [],
    modelValue: null,
    showLabels: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: number | null];
}>();

const onChange = (event: Event) => {
  const raw = (event.target as HTMLSelectElement).value;
  emit("update:modelValue", raw ? Number(raw) : null);
};
</script>
