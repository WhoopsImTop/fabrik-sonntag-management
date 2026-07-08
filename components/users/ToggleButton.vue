<template>
  <div class="mt-1 flex rounded-md border border-slate-300 overflow-hidden w-fit">
    <button
      type="button"
      @click="setValue(true)"
      :class="[
        'px-4 py-2 text-sm font-medium transition-colors',
        modelValue
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-700 hover:bg-slate-50',
      ]"
    >
      {{ labels.checked }}
    </button>
    <button
      type="button"
      @click="setValue(false)"
      :class="[
        'px-4 py-2 text-sm font-medium transition-colors border-l border-slate-300',
        !modelValue
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-700 hover:bg-slate-50',
      ]"
    >
      {{ labels.unchecked }}
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean;
    labels?: { checked: string; unchecked: string };
  }>(),
  {
    labels: () => ({ checked: "Ja", unchecked: "Nein" }),
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const setValue = (value: boolean) => {
  emit("update:modelValue", value);
};
</script>
