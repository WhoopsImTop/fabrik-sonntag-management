<template>
  <div
    class="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
    :class="$attrs.class"
  >
    <div
      v-if="$slots.header"
      class="border-b border-gray-100 px-4 py-3"
    >
      <slot name="header" />
    </div>
    <div class="p-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>
