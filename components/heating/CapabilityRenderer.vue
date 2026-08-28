<template>
  <div :class="compact ? '' : 'border border-neutral-200 p-4'">
    <HeatingTemperatureSetpointControl
      v-if="writable && schema.type === 'number'"
      :schema="schema"
      :value="value"
      :disabled="!writable"
      @change="onChange"
    />
    <HeatingTemperatureDisplay
      v-else-if="schema.key === 'current_temperature'"
      :schema="schema"
      :value="value"
    />
    <HeatingBatteryIndicator
      v-else-if="schema.key === 'battery'"
      :schema="schema"
      :value="value"
    />
    <HeatingBooleanToggle
      v-else-if="schema.key === 'child_lock' && writable"
      :schema="schema"
      :value="value"
      @change="onChange"
    />
    <HeatingBooleanIndicator
      v-else-if="schema.type === 'boolean'"
      :schema="schema"
      :value="value"
    />
    <HeatingEnumSelect
      v-else-if="schema.type === 'enum' && writable"
      :schema="schema"
      :value="value"
      @change="onChange"
    />
    <HeatingPercentBar
      v-else-if="schema.key === 'valve_position' || schema.type === 'percent'"
      :schema="schema"
      :value="value"
    />
    <HeatingGenericValue v-else :schema="schema" :value="value" />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CapabilitySchema } from "~/composables/useHeatingApi";

const props = defineProps<{
  schema: CapabilitySchema;
  value: unknown;
  compact?: boolean;
}>();

const emit = defineEmits<{
  change: [key: string, value: unknown];
}>();

const writable = computed(
  () => props.schema.access === "readwrite" || props.schema.access === "write",
);

const onChange = (value: unknown) => {
  emit("change", props.schema.key, value);
};
</script>
