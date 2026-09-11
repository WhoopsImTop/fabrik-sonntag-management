<script setup lang="ts">
import { computed } from "vue";
import type { HeatingEntity } from "~/composables/useHeatingApi";
import { aggregateRoomState, roomLabel } from "~/utils/heatingRoom";

const props = withDefaults(
  defineProps<{
    room: {
      id: number;
      name?: string;
      room_number?: string | null;
      entities?: HeatingEntity[];
    };
    name?: string;
    link?: boolean;
  }>(),
  { link: true },
);

const emit = defineEmits<{
  change: [key: string, value: unknown];
}>();

const entities = computed(() => props.room.entities || []);
const aggregated = computed(() => aggregateRoomState(entities.value));
const displayName = computed(() => props.name || roomLabel(props.room));
const location = computed(() => {
  const count = entities.value.length;
  return count === 1 ? "1 Thermostat" : `${count} Thermostate`;
});
</script>

<template>
  <HeatingThermostatCard
    class="w-full min-w-0 sm:min-w-86 sm:w-auto shrink-0"
    :name="displayName"
    :location="location"
    :href="link ? `/heating/rooms/${room.id}` : undefined"
    :last-state="aggregated.lastState"
    :schema="aggregated.schema"
    :offline="aggregated.offline"
    @change="(key, value) => emit('change', key, value)"
  />
</template>
