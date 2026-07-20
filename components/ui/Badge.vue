<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    color?: "primary" | "neutral" | "error";
  }>(),
  {
    color: "neutral",
  },
);

const badgeClass = computed(() => {
  const base =
    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium";
  const colors: Record<string, string> = {
    primary: "bg-gray-900 text-white",
    neutral: "bg-gray-100 text-gray-700",
    error: "bg-red-100 text-red-700",
  };
  return [base, colors[props.color]];
});
</script>
