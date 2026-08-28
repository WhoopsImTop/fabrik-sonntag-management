<script setup lang="ts">
const VIEW = 240;

withDefaults(
  defineProps<{
    showMode?: boolean;
  }>(),
  { showMode: true },
);
</script>

<template>
  <div
    class="border border-neutral-200 bg-white p-4"
    aria-hidden="true"
  >
    <div class="mb-2 flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1 space-y-1.5">
        <div class="h-4 w-24 animate-pulse bg-neutral-200" />
        <div class="h-3 w-36 animate-pulse bg-neutral-100" />
      </div>
      <div class="h-4 w-12 animate-pulse bg-neutral-100" />
    </div>

    <div
      class="relative mx-auto"
      :style="{ width: `${VIEW}px`, height: `${VIEW}px` }"
    >
      <div
        class="absolute inset-4 animate-pulse rounded-full border-[14px] border-neutral-200"
      />
      <div class="absolute inset-0 flex flex-col items-center justify-center pb-8">
        <div class="mb-2 h-3 w-12 animate-pulse bg-neutral-100" />
        <div class="h-9 w-16 animate-pulse bg-neutral-200" />
        <div class="mt-2 h-3 w-20 animate-pulse bg-neutral-100" />
      </div>
      <div class="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-10">
        <div class="size-10 animate-pulse border border-neutral-200 bg-neutral-100" />
        <div class="size-10 animate-pulse border border-neutral-200 bg-neutral-100" />
      </div>
    </div>

    <div v-if="showMode" class="mt-2 flex border border-neutral-200">
      <div class="h-9 flex-1 animate-pulse bg-neutral-100" />
      <div class="h-9 flex-1 animate-pulse bg-neutral-50" />
      <div class="h-9 flex-1 animate-pulse bg-neutral-100" />
    </div>

    <div class="mt-3 flex items-center justify-between">
      <div class="h-3 w-16 animate-pulse bg-neutral-100" />
      <div class="h-3 w-12 animate-pulse bg-neutral-100" />
    </div>
  </div>
</template>
