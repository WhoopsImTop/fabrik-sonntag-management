<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dialog-overlay dialog-overlay-top"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0" @click="onCancel" />
      <div class="dialog-panel max-w-md">
        <div class="dialog-header">
          <div class="min-w-0 flex-1">
            <h3 class="dialog-title">{{ title }}</h3>
            <p v-if="description" class="dialog-desc">{{ description }}</p>
          </div>
          <button
            type="button"
            class="dialog-close"
            aria-label="Schließen"
            @click="onCancel"
          >
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div v-if="$slots.default" class="dialog-body">
          <slot />
        </div>

        <div class="dialog-footer">
          <button
            type="button"
            class="btn-dialog-cancel"
            :disabled="loading"
            @click="onCancel"
          >
            {{ cancelLabel }}
          </button>
          <button
            type="button"
            :class="
              variant === 'danger' ? 'btn-dialog-danger' : 'btn-dialog-primary'
            "
            :disabled="loading"
            @click="onConfirm"
          >
            {{ resolvedConfirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ConfirmVariant } from "~/composables/useConfirm";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
    loading?: boolean;
    icon?: string;
  }>(),
  {
    description: "",
    cancelLabel: "Abbrechen",
    variant: "default",
    loading: false,
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  "update:open": [value: boolean];
}>();

const defaultConfirmLabels: Record<ConfirmVariant, string> = {
  danger: "Ja, löschen",
  warning: "Ja, fortfahren",
  default: "Bestätigen",
};

const resolvedConfirmLabel = computed(
  () => props.confirmLabel ?? defaultConfirmLabels[props.variant],
);

const onCancel = () => {
  emit("update:open", false);
  emit("cancel");
};

const onConfirm = () => {
  emit("confirm");
};
</script>
