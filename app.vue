<template>
  <div>
    <UApp TooltipProviderProps="true">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>

      <ConfirmationModal
        :open="confirmState.isOpen"
        :title="confirmState.title"
        :description="confirmState.description"
        :confirm-label="confirmState.confirmLabel"
        :cancel-label="confirmState.cancelLabel"
        :variant="confirmState.variant"
        :icon="confirmState.icon"
        :loading="confirmState.loading"
        @update:open="onConfirmOpenChange"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    </UApp>
  </div>
</template>

<script setup lang="ts">
import ConfirmationModal from "@/components/app/ConfirmationModal.vue";

const { state: confirmState, handleConfirm, handleCancel } = useConfirm();

const onConfirmOpenChange = (open: boolean) => {
  if (!open) handleCancel();
};
</script>
