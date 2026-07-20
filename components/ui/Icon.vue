<template>
  <Icon
    :icon="resolvedName"
    :class="['inline-block shrink-0', sizeClass, $attrs.class]"
    :style="sizeStyle"
  />
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    size?: string | number;
  }>(),
  {
    size: undefined,
  },
);

defineOptions({ inheritAttrs: false });

const resolvedName = computed(() => {
  const name = props.name;
  if (name.startsWith("i-lucide-")) {
    return `lucide:${name.slice("i-lucide-".length)}`;
  }
  if (name.startsWith("i-heroicons-")) {
    return `heroicons:${name.slice("i-heroicons-".length)}`;
  }
  if (name.includes(":")) return name;
  return name;
});

const numericSize = computed(() => {
  if (typeof props.size === "number") return props.size;
  if (typeof props.size === "string" && /^\d+$/.test(props.size)) {
    return Number(props.size);
  }
  return null;
});

const sizeClass = computed(() => {
  if (numericSize.value != null) return undefined;
  if (props.size === undefined || props.size === null || props.size === "")
    return "size-5";
  return props.size;
});

const sizeStyle = computed(() => {
  if (numericSize.value == null) return undefined;
  const px = `${numericSize.value}px`;
  return { width: px, height: px };
});
</script>
