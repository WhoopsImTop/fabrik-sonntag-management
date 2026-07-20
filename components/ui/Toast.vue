<template>
  <div
    class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto rounded-lg border bg-white shadow-lg px-4 py-3 flex gap-3 items-start"
      :class="borderClass(toast.color)"
    >
      <div class="min-w-0 flex-1">
        <p v-if="toast.title" class="text-sm font-semibold text-gray-900">
          {{ toast.title }}
        </p>
        <p v-if="toast.description" class="text-sm text-gray-600 mt-0.5">
          {{ toast.description }}
        </p>
      </div>
      <button
        type="button"
        class="text-gray-400 hover:text-gray-600 shrink-0"
        @click="remove(toast.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ToastColor } from "~/composables/useToast";

const { toasts, remove } = useToast();

const borderClass = (color?: ToastColor) => {
  if (color === "error" || color === "red") return "border-red-200";
  if (color === "primary" || color === "green" || color === "success")
    return "border-emerald-200";
  return "border-gray-200";
};
</script>
