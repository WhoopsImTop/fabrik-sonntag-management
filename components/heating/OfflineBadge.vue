<template>
  <span
    class="inline-flex items-center gap-1 text-xs font-medium"
    :class="offline ? 'text-amber-700' : 'text-emerald-700'"
  >
    <span
      class="inline-block size-1.5 rounded-full"
      :class="offline ? 'bg-amber-500' : 'bg-emerald-500'"
    />
    {{ offline ? "Offline" : "Online" }}
  </span>
</template>

<script setup lang="ts">
defineProps<{ offline?: boolean }>();
</script>
