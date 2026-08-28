<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  normalizeHeatingLastState,
  type HeatingEntity,
} from "~/composables/useHeatingApi";
import {
  locationLabel,
  roomLabel,
} from "~/utils/heatingRoom";

const route = useRoute();
const heatingApi = useHeatingApi();
const { role } = useAuth();
const isAdminUser = computed(() => role.value === "admin");

const id = computed(() => Number(route.params.id));
const loading = ref(false);
const savingIds = ref(new Set<number>());
const room = ref<any | null>(null);

let pollTimer: ReturnType<typeof setInterval> | null = null;

const load = async (full = true) => {
  if (full) loading.value = true;
  room.value = await heatingApi.getRoom(id.value);
  if (full) loading.value = false;
};

const headerLabel = computed(() => {
  if (!room.value) return "";
  return locationLabel(room.value.building, room.value);
});

const applyEntityUpdate = (updated: Record<string, any>) => {
  if (!room.value) return;
  const list = room.value.entities || [];
  const idx = list.findIndex((entity: any) => entity.id === updated.id);
  if (idx < 0) return;
  const current = list[idx];
  list[idx] = {
    ...current,
    ...updated,
    last_state: {
      ...normalizeHeatingLastState(current.last_state),
      ...normalizeHeatingLastState(updated.last_state),
    },
  };
};

const onThermostatChange = async (
  entity: HeatingEntity,
  key: string,
  value: unknown,
) => {
  const previous = normalizeHeatingLastState(entity.last_state)[key];
  savingIds.value = new Set(savingIds.value).add(entity.id);
  applyEntityUpdate({
    id: entity.id,
    last_state: { [key]: value },
  });
  const res = await heatingApi.setCapability(entity.id, key, value);
  if (res?.data) applyEntityUpdate(res.data);
  else {
    applyEntityUpdate({
      id: entity.id,
      last_state: { [key]: previous },
    });
  }
  const next = new Set(savingIds.value);
  next.delete(entity.id);
  savingIds.value = next;
};

const onRename = async (entity: HeatingEntity, name: string) => {
  const previous = entity.name;
  applyEntityUpdate({ id: entity.id, name });
  const res = await heatingApi.updateEntity(entity.id, { name });
  if (res?.data) applyEntityUpdate(res.data);
  else applyEntityUpdate({ id: entity.id, name: previous });
};

onMounted(() => {
  load(true);
  pollTimer = setInterval(() => {
    if (savingIds.value.size) return;
    load(false);
  }, 15000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <div>
    <NuxtLink to="/heating" class="mb-4 inline-flex text-sm text-neutral-500 hover:text-neutral-800">
      ← Übersicht
    </NuxtLink>

    <div v-if="loading && !room" aria-busy="true">
      <div class="mb-6 space-y-2">
        <div class="h-7 w-24 animate-pulse bg-neutral-200" />
        <div class="h-4 w-48 animate-pulse bg-neutral-100" />
      </div>
      <div class="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <HeatingThermostatCardSkeleton v-for="n in 2" :key="n" />
      </div>
    </div>
    <div v-else-if="!room" class="text-sm text-neutral-500">Raum nicht gefunden.</div>
    <template v-else>
      <div class="mb-6">
        <h1 class="text-xl font-bold">{{ roomLabel(room) }}</h1>
        <p class="mt-0.5 text-sm text-neutral-500">
          {{ headerLabel }}
          <span v-if="(room.entities || []).length">
            · {{ room.entities.length }} Thermostat(e)
          </span>
        </p>
      </div>

      <p
        v-if="!(room.entities || []).length"
        class="mb-6 text-sm text-neutral-500"
      >
        Diesem Raum sind noch keine Thermostate zugeordnet.
      </p>

      <div
        v-else
        class="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
      >
        <HeatingThermostatCard
          v-for="entity in room.entities"
          :key="entity.id"
          :name="entity.name"
          :href="`/heating/entities/${entity.id}`"
          :last-state="entity.last_state"
          :schema="entity.schema || entity.deviceModel?.capability_schema || []"
          :offline="entity.offline"
          :editable="isAdminUser"
          @change="(key, value) => onThermostatChange(entity, key, value)"
          @rename="(name) => onRename(entity, name)"
        />
      </div>

      <HeatingHistoryChart
        v-if="(room.entities || []).length"
        :room-id="room.id"
        class="mb-6"
      />
    </template>
  </div>
</template>
