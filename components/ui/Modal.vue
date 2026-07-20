<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dialog-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0" @click="close" />
      <div class="relative z-10 flex w-full justify-center">
        <slot name="content">
          <div class="dialog-panel" :class="maxWidthClass">
            <div v-if="title || description || $slots.header" class="dialog-header">
              <div class="min-w-0 flex-1">
                <slot name="header">
                  <h3 v-if="title" class="dialog-title">{{ title }}</h3>
                  <p v-if="description" class="dialog-desc">{{ description }}</p>
                </slot>
              </div>
              <button
                type="button"
                class="dialog-close"
                aria-label="Schließen"
                @click="close"
              >
                <UiIcon name="i-lucide-x" class="size-5" />
              </button>
            </div>
            <div v-if="$slots.body" class="dialog-body">
              <slot name="body" />
            </div>
            <slot />
            <div v-if="$slots.footer" class="dialog-footer">
              <slot name="footer" />
            </div>
          </div>
        </slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";

const props = withDefaults(
  defineProps<{
    open?: boolean | object | null;
    title?: string;
    description?: string;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  }>(),
  {
    open: false,
    title: "",
    description: "",
    maxWidth: "md",
  },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const maxWidthClass = computed(() => {
  const map: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };
  return map[props.maxWidth] || "max-w-md";
});

const close = () => emit("update:open", false);

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.open) close();
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));

watch(
  () => props.open,
  (val) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = val ? "hidden" : "";
  },
);
</script>
