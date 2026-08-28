<script setup lang="ts">
import { computed } from "vue";
import type { HeatingEntity } from "~/composables/useHeatingApi";
import {
  aggregateRoomState,
  buildingLabel,
  entityBatteries,
  roomLabel,
} from "~/utils/heatingRoom";

const props = defineProps<{
  room: {
    id: number;
    name?: string;
    room_number?: string | null;
    entities?: HeatingEntity[];
  };
  building?: any;
}>();

const emit = defineEmits<{
  change: [key: string, value: unknown];
}>();

const entities = computed(() => props.room.entities || []);
const aggregated = computed(() => aggregateRoomState(entities.value));
const name = computed(() => roomLabel(props.room));
const location = computed(() => {
  const count = entities.value.length;
  const countLabel = count === 1 ? "1 Thermostat" : `${count} Thermostate`;
  return countLabel;
});
const batteries = computed(() => entityBatteries(entities.value));
</script>

<template>
  <HeatingThermostatCard
    class="min-w-86 shrink-0"
    :name="name"
    :location="location"
    :href="`/heating/rooms/${room.id}`"
    :last-state="aggregated.lastState"
    :schema="aggregated.schema"
    :offline="aggregated.offline"
    @change="(key, value) => emit('change', key, value)"
  />
</template>
