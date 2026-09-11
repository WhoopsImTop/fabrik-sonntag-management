<script setup lang="ts">
import { computed, ref } from "vue";

const route = useRoute();
const id = computed(() => Number(route.params.id));
const loadedRoom = ref<any>(null);

// Merkt sich Gebäude + Einheit + Raum, damit "Übersicht" den gleichen Ausschnitt wieder öffnet
const backLink = computed(() => {
  const buildingId = loadedRoom.value?.building?.id;
  const unitId = loadedRoom.value?.unit?.id;
  if (buildingId && unitId) {
    return {
      path: "/heating",
      query: { building: String(buildingId), unit: String(unitId), room: String(id.value) },
    };
  }
  return "/heating";
});
</script>

<template>
  <div>
    <NuxtLink :to="backLink" class="mb-4 inline-flex text-sm text-neutral-500 hover:text-neutral-800">
      ← Übersicht
    </NuxtLink>

    <HeatingRoomDetailPanel :room-id="id" :closable="false" @loaded="loadedRoom = $event" />
  </div>
</template>
