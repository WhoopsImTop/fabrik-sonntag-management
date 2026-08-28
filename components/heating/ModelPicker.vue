<template>
  <div class="flex flex-wrap gap-2" :class="stacked ? 'flex-col' : ''">
    <label class="min-w-[8rem] flex-1">
      <span v-if="showLabels" class="dialog-label">Hersteller</span>
      <select
        class="dialog-input"
        :value="manufacturer"
        @change="onManufacturerChange"
      >
        <option value="" disabled>Hersteller wählen</option>
        <option v-for="name in manufacturers" :key="name" :value="name">
          {{ name }}
        </option>
      </select>
    </label>
    <label class="min-w-[8rem] flex-1">
      <span v-if="showLabels" class="dialog-label">Modell</span>
      <select
        class="dialog-input"
        :value="modelValue ?? ''"
        @change="onModelChange"
      >
        <option value="" disabled>Modell wählen</option>
        <option v-for="model in modelsForManufacturer" :key="model.id" :value="model.id">
          {{ model.model }}
          <template v-if="model.protocol"> ({{ protocolLabel(model.protocol) }})</template>
        </option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export type DeviceModelOption = {
  id: number;
  manufacturer: string;
  model: string;
  protocol?: string;
  adapter_key?: string;
};

const props = withDefaults(
  defineProps<{
    models: DeviceModelOption[];
    modelValue?: number | null;
    showLabels?: boolean;
    stacked?: boolean;
  }>(),
  {
    models: () => [],
    modelValue: null,
    showLabels: false,
    stacked: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: number | null];
}>();

const manufacturers = computed(() =>
  [...new Set(props.models.map((m) => m.manufacturer))].sort(),
);

const selectedModel = computed(() =>
  props.models.find((m) => m.id === Number(props.modelValue)),
);

const manufacturer = computed(
  () => selectedModel.value?.manufacturer || "",
);

const modelsForManufacturer = computed(() => {
  const current = manufacturer.value;
  if (!current) return props.models;
  return props.models.filter((m) => m.manufacturer === current);
});

const protocolLabel = (protocol?: string) => {
  if (protocol === "zigbee2mqtt") return "Zigbee";
  if (protocol === "eurotronic-wifi") return "WiFi";
  return protocol || "";
};

const onManufacturerChange = (event: Event) => {
  const name = (event.target as HTMLSelectElement).value;
  const first = props.models.find((m) => m.manufacturer === name);
  emit("update:modelValue", first?.id ?? null);
};

const onModelChange = (event: Event) => {
  const raw = (event.target as HTMLSelectElement).value;
  emit("update:modelValue", raw ? Number(raw) : null);
};
</script>
