<template>
  <div class="flex items-center justify-between gap-4">
    <p class="text-sm text-neutral-700">{{ schema.label || schema.key }}</p>
    <UiBadge :color="active ? 'error' : 'neutral'">
      {{ active ? "Ja" : "Nein" }}
    </UiBadge>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CapabilitySchema } from "~/composables/useHeatingApi";

const props = defineProps<{
  schema: CapabilitySchema;
  value: unknown;
}>();

const active = computed(() => Boolean(props.value));
</script>
