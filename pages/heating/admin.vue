<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { locationLabel } from "~/utils/heatingRoom";

const heatingApi = useHeatingApi();
const loading = ref(false);
const mqttConnected = ref(false);
const entities = ref<any[]>([]);

const load = async () => {
  loading.value = true;
  const overview = await heatingApi.getAdminOverview();
  entities.value = overview.entities;
  mqttConnected.value = overview.mqtt_connected;
  loading.value = false;
};

onMounted(load);

const locationOf = (entity: any) => {
  const room = entity.room;
  if (!room) return "—";
  return locationLabel(room.unit?.building, room) || "—";
};

const formatSeen = (value?: string | null) => {
  if (!value) return "Nie";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const offlineCount = computed(
  () => entities.value.filter((e) => e.offline).length,
);
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Hausmeister-Übersicht</h1>
        <p class="mt-1 text-sm text-neutral-500">
          MQTT {{ mqttConnected ? "verbunden" : "nicht verbunden" }}
          · {{ offlineCount }} Gerät(e) ohne Update seit 24h (Warnung, kein Blocker)
        </p>
      </div>
      <UiButton variant="outline" icon="i-lucide-refresh-cw" @click="load">
        Aktualisieren
      </UiButton>
    </div>

    <UiTable
      :loading="loading"
      :columns="[
        { accessorKey: 'name', header: 'Gerät' },
        { id: 'location', header: 'Ort' },
        { id: 'battery', header: 'Batterie' },
        { id: 'status', header: 'Status' },
        { id: 'seen', header: 'Zuletzt gesehen' },
      ]"
      :data="entities"
    >
      <template #name-cell="{ row }">
        <NuxtLink
          :to="`/heating/entities/${row.original.id}`"
          class="font-medium hover:underline"
        >
          {{ row.original.name }}
        </NuxtLink>
      </template>
      <template #location-cell="{ row }">
        {{ locationOf(row.original) }}
      </template>
      <template #battery-cell="{ row }">
        <span v-if="row.original.battery == null">—</span>
        <span v-else>{{ row.original.battery }}%</span>
      </template>
      <template #status-cell="{ row }">
        <HeatingOfflineBadge :offline="row.original.offline" />
      </template>
      <template #seen-cell="{ row }">
        {{ formatSeen(row.original.last_seen_at) }}
      </template>
    </UiTable>
  </div>
</template>
