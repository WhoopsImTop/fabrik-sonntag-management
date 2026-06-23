<template>
  <div class="border-b border-slate-100 last:border-b-0">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 px-6 py-3 text-left hover:bg-slate-50/80 transition-colors"
      @click="toggle"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {{ title }}
        </span>
        <span
          v-if="badge"
          class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
        >
          {{ badge }}
        </span>
      </div>
      <svg
        class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div v-show="isOpen" class="px-6 pb-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    defaultOpen?: boolean;
    badge?: string;
  }>(),
  {
    defaultOpen: true,
  },
);

const emit = defineEmits<{
  open: [];
}>();

const isOpen = ref(props.defaultOpen);

const toggle = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) emit("open");
};
</script>
