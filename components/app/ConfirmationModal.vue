<template>
  <div
    class="fixed inset-0 z-99 bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-6"
    v-if="open"
    @update:open="onOpenChange"
  >
    <div
      class="sm:max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col pointer-events-auto"
    >
      <div class="flex items-start gap-4 p-4 sm:px-6 sm:pt-6">
        <div class="min-w-0 flex-1">
          <h3 class="text-base font-semibold leading-6 text-gray-900">
            {{ title }}
          </h3>
          <p
            v-if="description"
            class="mt-2 text-sm text-gray-500 leading-relaxed"
          >
            {{ description }}
          </p>
        </div>
      </div>

      <div v-if="$slots.default" class="px-4 sm:px-6 pb-2">
        <slot />
      </div>

      <div class="flex justify-end gap-3 p-4 sm:px-6 sm:pb-6">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="loading"
          @click="onCancel"
        >
          {{ cancelLabel }}
        </UButton>
        <UButton
          :color="confirmButtonColor"
          :variant="confirmButtonVariant"
          :loading="loading"
          :class="warningButtonClass"
          @click="onConfirm"
        >
          {{ resolvedConfirmLabel }}
        </UButton>
      </div>
    </div>
  </div>
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

const confirmButtonColor = computed(() => {
  if (props.variant === "danger") return "error";
  if (props.variant === "warning") return "neutral";
  return "primary";
});

const confirmButtonVariant = computed(() =>
  props.variant === "warning" ? "outline" : "solid",
);

const warningButtonClass = computed(() =>
  props.variant === "warning"
    ? "border-amber-300 text-amber-900 hover:bg-amber-50"
    : undefined,
);

const iconBgClass = computed(() => {
  if (props.variant === "danger") return "bg-red-50";
  if (props.variant === "warning") return "bg-amber-50";
  return "bg-slate-100";
});

const iconColorClass = computed(() => {
  if (props.variant === "danger") return "text-red-600";
  if (props.variant === "warning") return "text-amber-600";
  return "text-slate-600";
});

const onOpenChange = (value: boolean) => {
  emit("update:open", value);
  if (!value) emit("cancel");
};

const onCancel = () => {
  emit("update:open", false);
  emit("cancel");
};

const onConfirm = () => {
  emit("confirm");
};
</script>
