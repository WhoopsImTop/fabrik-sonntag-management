<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[buttonClass, $attrs.class]"
    v-bind="filteredAttrs"
  >
    <UiIcon
      v-if="loading"
      name="i-lucide-loader-2"
      class="size-4 animate-spin"
    />
    <UiIcon v-else-if="icon" :name="icon" :class="iconSizeClass" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";

const props = withDefaults(
  defineProps<{
    color?: "primary" | "neutral" | "error";
    variant?: "solid" | "outline" | "ghost" | "none";
    size?: "xs" | "sm" | "md" | "lg";
    icon?: string;
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    color: "primary",
    variant: "solid",
    size: "md",
    loading: false,
    disabled: false,
    type: "button",
  },
);

defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const filteredAttrs = computed(() => {
  const { class: _c, ...rest } = attrs as Record<string, unknown>;
  return rest;
});

const iconSizeClass = computed(() => {
  if (props.size === "xs") return "size-3.5";
  return "size-4";
});

const buttonClass = computed(() => {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-none font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50";

  const sizes: Record<string, string> = {
    xs: "h-7 px-2 text-xs",
    sm: "h-8 px-3 text-sm",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-base",
  };

  const variants: Record<string, Record<string, string>> = {
    solid: {
      primary: "bg-gray-900 text-gray-50 hover:bg-gray-900/90 shadow",
      neutral: "bg-gray-900 text-gray-50 hover:bg-gray-900/90 shadow",
      error: "bg-red-600 text-white hover:bg-red-700 shadow",
    },
    outline: {
      primary:
        "border border-gray-200 bg-transparent hover:bg-gray-100 text-gray-900 shadow-sm",
      neutral:
        "border border-gray-200 bg-transparent hover:bg-gray-100 text-gray-900 shadow-sm",
      error:
        "border border-red-300 bg-transparent text-red-700 hover:bg-red-50 shadow-sm",
    },
    ghost: {
      primary: "bg-transparent hover:bg-gray-100 text-gray-900",
      neutral: "bg-transparent hover:bg-gray-100 text-gray-900",
      error: "bg-transparent hover:bg-red-50 text-red-600",
    },
    none: {
      primary: "bg-transparent hover:bg-transparent text-gray-900 p-1",
      neutral: "bg-transparent hover:bg-transparent text-gray-900 p-1",
      error: "bg-transparent hover:bg-transparent text-red-600 p-1",
    },
  };

  const sizeClass = props.variant === "none" ? "text-sm" : sizes[props.size];
  return [base, sizeClass, variants[props.variant][props.color]];
});
</script>
