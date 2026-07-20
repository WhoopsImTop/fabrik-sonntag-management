<template>
  <label class="inline-flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      class="size-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
      :checked="checked"
      :id="id"
      @change="onChange"
    />
    <slot>{{ label }}</slot>
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    label?: string;
    id?: string | number;
  }>(),
  {
    modelValue: false,
    label: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  change: [event: Event];
}>();

const checked = computed(() => !!props.modelValue);

const onChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).checked;
  emit("update:modelValue", value);
  emit("change", e);
};
</script>
