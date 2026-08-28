<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  buildingLabel,
  roomLabel,
  roomsOfBuilding,
} from "~/utils/heatingRoom";

const props = withDefaults(
  defineProps<{
    modelValue?: number | null;
    buildings: any[];
    allowEmpty?: boolean;
    emptyLabel?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: null,
    allowEmpty: true,
    emptyLabel: "Kein Raum",
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: number | null];
}>();

const selectedBuildingId = ref<number | null>(null);

function findBuildingIdForRoom(roomId: number | null) {
  if (!roomId) return null;
  for (const building of props.buildings) {
    if (roomsOfBuilding(building).some((room: any) => room.id === roomId)) {
      return building.id as number;
    }
  }
  return null;
}

watch(
  () => [props.modelValue, props.buildings],
  () => {
    const found = findBuildingIdForRoom(props.modelValue ?? null);
    if (found != null) {
      selectedBuildingId.value = found;
      return;
    }
    if (selectedBuildingId.value == null && props.buildings[0]) {
      selectedBuildingId.value = props.buildings[0].id;
    }
  },
  { immediate: true },
);

const selectedBuilding = computed(
  () =>
    props.buildings.find((building) => building.id === selectedBuildingId.value) ||
    null,
);

const rooms = computed(() =>
  selectedBuilding.value ? roomsOfBuilding(selectedBuilding.value) : [],
);

const onBuildingChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  selectedBuildingId.value = value ? Number(value) : null;
  const current = props.modelValue;
  if (current && rooms.value.some((room: any) => room.id === current)) return;
  const next = rooms.value[0]?.id ?? null;
  emit("update:modelValue", next);
};

const onRoomChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  emit("update:modelValue", value ? Number(value) : null);
};
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <label>
      <span class="dialog-label">Gebäude</span>
      <select
        class="dialog-input"
        :value="selectedBuildingId ?? ''"
        :disabled="disabled"
        @change="onBuildingChange"
      >
        <option v-if="!buildings.length" value="">Keine Gebäude</option>
        <option
          v-for="building in buildings"
          :key="building.id"
          :value="building.id"
        >
          {{ buildingLabel(building) }}
        </option>
      </select>
    </label>
    <label>
      <span class="dialog-label">Raumnummer</span>
      <select
        class="dialog-input"
        :value="modelValue ?? ''"
        :disabled="disabled || !rooms.length"
        @change="onRoomChange"
      >
        <option v-if="allowEmpty" value="">{{ emptyLabel }}</option>
        <option v-for="room in rooms" :key="room.id" :value="room.id">
          {{ roomLabel(room) }}
        </option>
      </select>
    </label>
  </div>
</template>
