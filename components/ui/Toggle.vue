<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
    :class="model ? 'bg-gray-900' : 'bg-gray-200'"
    @click="model = !model"
  >
    <span
      class="pointer-events-none inline-block size-4 transform rounded-full bg-white shadow transition"
      :class="model ? 'translate-x-4' : 'translate-x-0'"
    />
  </button>
</template>

<script setup lang="ts">
const model = defineModel<boolean>({ default: false });
</script>
