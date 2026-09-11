<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  normalizeHeatingLastState,
  type HeatingEntity,
} from "~/composables/useHeatingApi";
import {
  buildingLabel,
  entityIsUnassigned,
  entityLocationLabel,
  roomLabel,
  unitLabel,
} from "~/utils/heatingRoom";

const props = withDefaults(
  defineProps<{
    roomId: number;
    closable?: boolean;
  }>(),
  { closable: true },
);

const emit = defineEmits<{
  close: [];
  loaded: [room: any];
}>();

const heatingApi = useHeatingApi();
const { role } = useAuth();
const confirm = useConfirm();
const isAdminUser = computed(() => role.value === "admin");

const loading = ref(false);
const room = ref<any | null>(null);
const intervals = ref<any[]>([]);
const scheduleSaving = ref(false);
const allEntities = ref<HeatingEntity[]>([]);
const thermostatsOpen = ref(false);
const assigning = ref(false);

let pollTimer: ReturnType<typeof setInterval> | null = null;

const load = async (full = true) => {
  if (full) loading.value = true;
  room.value = await heatingApi.getRoom(props.roomId);
  if (room.value) emit("loaded", room.value);
  // Nur beim initialen Laden neu holen, sonst überschreibt der 15s-Hintergrund-Refresh
  // einen gerade im Editor gezeichneten, noch ungespeicherten Heizplan-Entwurf.
  if (full) {
    intervals.value = await heatingApi.getSchedules({ room_id: props.roomId });
    if (isAdminUser.value) {
      allEntities.value = await heatingApi.getEntities();
    }
  }
  if (full) loading.value = false;
};

// --- THERMOSTATE ANZEIGEN / HINZUFÜGEN / ENTFERNEN ---

const pickerItems = computed(() => {
  const roomId = room.value?.id;
  const unassigned: { id: number; name: string; subtitle: string }[] = [];
  const current: { id: number; name: string; subtitle: string }[] = [];
  const others: { id: number; name: string; subtitle: string }[] = [];
  for (const entity of allEntities.value) {
    const location = entityLocationLabel(entity);
    const item = {
      id: entity.id,
      name: entity.name,
      subtitle: location
        ? `Thermostat · in ${location}`
        : "Thermostat · Nicht zugeordnet",
    };
    if (entityIsUnassigned(entity) && entity.room_id !== roomId) {
      unassigned.push(item);
    } else if (entity.room_id === roomId) current.push(item);
    else others.push(item);
  }
  return [...unassigned, ...current, ...others];
});

const toggleAssignment = async (entityId: number) => {
  if (!room.value) return;
  const current = (room.value.entities || []).map((entity: any) => entity.id);
  const next = current.includes(entityId)
    ? current.filter((existingId: number) => existingId !== entityId)
    : [...current, entityId];
  assigning.value = true;
  const res = await heatingApi.assignEntitiesToRoom(room.value.id, next, {
    replace: true,
  });
  assigning.value = false;
  if (!res?.data) return;
  room.value = res.data;
  allEntities.value = await heatingApi.getEntities();
};

const removeEntity = async (entity: any) => {
  const ok = await confirm.confirm({
    title: "Thermostat entfernen?",
    message: `${entity.name} wird aus diesem Raum entfernt. Das Gerät bleibt registriert, ist danach aber keinem Raum mehr zugeordnet.`,
    variant: "danger",
  });
  if (!ok) return;
  await toggleAssignment(entity.id);
};

// --- THERMOSTAT HINZUFÜGEN (Modal) ---

const assignModalOpen = ref(false);
const selectedIds = ref<number[]>([]);

const openAssignModal = () => {
  selectedIds.value = (room.value?.entities || []).map((entity: any) => entity.id);
  assignModalOpen.value = true;
};

const toggleSelectedId = (entityId: number) => {
  if (selectedIds.value.includes(entityId)) {
    selectedIds.value = selectedIds.value.filter((existingId) => existingId !== entityId);
    return;
  }
  selectedIds.value = [...selectedIds.value, entityId];
};

const assignSelected = async () => {
  if (!room.value) return;
  assigning.value = true;
  const res = await heatingApi.assignEntitiesToRoom(room.value.id, selectedIds.value, {
    replace: true,
  });
  assigning.value = false;
  if (!res?.data) return;
  room.value = res.data;
  allEntities.value = await heatingApi.getEntities();
  assignModalOpen.value = false;
};

const headerLabel = computed(() => {
  if (!room.value) return "";
  return [buildingLabel(room.value.building), unitLabel(room.value.unit)]
    .filter(Boolean)
    .join(" / ");
});

const targetCap = computed(() =>
  (room.value?.schema || []).find((cap: any) => cap.key === "target_temperature"),
);

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

const onRoomChange = async (key: string, value: unknown) => {
  if (!room.value) return;
  const previous = (room.value.entities || []).map((entity: any) => ({
    id: entity.id,
    value: normalizeHeatingLastState(entity.last_state)[key],
  }));
  for (const entity of room.value.entities || []) {
    applyEntityUpdate({ id: entity.id, last_state: { [key]: value } });
  }
  const res = await heatingApi.setRoomCapability(room.value.id, key, value);
  if (res?.data?.entities) {
    for (const entity of res.data.entities) applyEntityUpdate(entity);
  } else {
    for (const item of previous) {
      applyEntityUpdate({ id: item.id, last_state: { [key]: item.value } });
    }
  }
};

const onScheduleSave = async (payload: {
  eco_temperature: number;
  intervals: { weekday: number; start: string; end: string; target_temperature: number }[];
}) => {
  scheduleSaving.value = true;
  const res = await heatingApi.replaceRoomSchedule(props.roomId, payload);
  scheduleSaving.value = false;
  if (res?.data) {
    intervals.value = res.data.intervals || payload.intervals;
    room.value = {
      ...room.value,
      eco_temperature: res.data.eco_temperature ?? payload.eco_temperature,
    };
    if (res.data.native_errors?.length) {
      useToast().add({
        title: "Plan gespeichert, nicht alle Geräte erreicht",
        description: res.data.native_errors.map((e: any) => e.name).join(", "),
        color: "red",
      });
    }
  }
};

const restartPolling = () => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => load(false), 15000);
};

onMounted(() => {
  load(true);
  restartPolling();
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

// Wechselt der Nutzer im Panel daneben den Raum, lädt dieselbe Komponente neu
watch(
  () => props.roomId,
  () => {
    load(true);
    restartPolling();
  },
);
</script>

<template>
  <div v-if="loading && !room" class="text-sm text-neutral-400">Lade…</div>
  <div v-else-if="!room" class="text-sm text-neutral-500">Raum nicht gefunden.</div>
  <template v-else>
    <div class="flex items-start justify-between gap-3 border-b border-neutral-200 pb-3">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-neutral-900">
          Raum {{ roomLabel(room) }}
        </h1>
        <p class="mt-1 text-sm text-neutral-500">{{ headerLabel }}</p>
        <p v-if="room.notes" class="mt-2 text-sm text-neutral-600 whitespace-pre-line">
          {{ room.notes }}
        </p>
      </div>
      <button
        v-if="closable"
        type="button"
        class="shrink-0 text-neutral-400 hover:text-neutral-800"
        aria-label="Schließen"
        @click="$emit('close')"
      >
        <UiIcon name="i-lucide-x" class="size-5" />
      </button>
    </div>

    <div class="mt-4 grid gap-4 xl:grid-cols-2 items-start">
      <HeatingRoomThermostatCard
        :room="room"
        name="Alle Thermostate"
        :link="false"
        @change="onRoomChange"
      />
      <HeatingHistoryChart v-if="(room.entities || []).length" :room-id="room.id" />
    </div>

    <div class="mt-4 border border-neutral-200 rounded-xl bg-white">
      <button
        type="button"
        class="flex w-full items-center justify-between px-4 py-3 text-left"
        @click="thermostatsOpen = !thermostatsOpen"
      >
        <span class="text-sm font-medium text-neutral-900">
          Thermostate ({{ (room.entities || []).length }})
        </span>
        <span class="text-neutral-400 text-xs">{{ thermostatsOpen ? "▴ einklappen" : "▾ aufklappen" }}</span>
      </button>

      <div v-if="thermostatsOpen" class="border-t border-neutral-200 divide-y divide-neutral-100">
        <button
          v-if="isAdminUser"
          type="button"
          class="flex w-full items-center gap-1 px-4 py-2.5 text-left text-xs text-neutral-500 hover:bg-neutral-50"
          @click="openAssignModal"
        >
          <IconAdd class="w-2 h-2" />Thermostat hinzufügen
        </button>
        <p v-if="!(room.entities || []).length" class="px-4 py-3 text-sm text-neutral-500">
          Keine Thermostate zugeordnet.
        </p>
        <div
          v-for="entity in room.entities"
          :key="entity.id"
          class="flex items-center justify-between gap-3 px-4 py-2.5"
        >
          <NuxtLink
            :to="`/heating/entities/${entity.id}`"
            class="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 hover:underline"
          >
            {{ entity.name }}
          </NuxtLink>
          <button
            v-if="isAdminUser"
            type="button"
            class="shrink-0 text-xs text-neutral-400 hover:text-red-600"
            :disabled="assigning"
            @click="removeEntity(entity)"
          >
            Entfernen
          </button>
        </div>
      </div>
    </div>

    <HeatingWeekSchedule
      v-if="(room.entities || []).length"
      class="mt-4"
      :intervals="intervals"
      :eco-temperature="room.eco_temperature ?? 16"
      hint="Gilt für alle Thermostate in diesem Raum ohne eigenen Zeitplan. Ein individueller Zeitplan am Thermostat hat Vorrang, ein manueller Eingriff überschreibt bis zum nächsten Schaltpunkt."
      :min="targetCap?.min ?? 5"
      :max="targetCap?.max ?? 30"
      :step="targetCap?.step ?? 0.5"
      :saving="scheduleSaving"
      @save="onScheduleSave"
    />
  </template>

  <UiModal
    v-model:open="assignModalOpen"
    title="Thermostate zuordnen"
    description="Wähle die Geräte aus, die diesem Raum zugeordnet sind."
    max-width="lg"
  >
    <template #body>
      <p v-if="!pickerItems.length" class="text-sm text-neutral-500">
        Keine Thermostate registriert. Lerne zuerst Geräte an.
      </p>
      <div v-else class="max-h-80 space-y-2 overflow-y-auto">
        <label
          v-for="item in pickerItems"
          :key="item.id"
          class="flex cursor-pointer items-start gap-3 border border-neutral-200 px-3 py-2.5 hover:bg-neutral-50"
        >
          <input
            type="checkbox"
            class="mt-1"
            :checked="selectedIds.includes(item.id)"
            :disabled="assigning"
            @change="toggleSelectedId(item.id)"
          />
          <span class="min-w-0">
            <span class="block font-medium text-neutral-900">{{ item.name }}</span>
            <span class="block text-xs text-neutral-500">{{ item.subtitle }}</span>
          </span>
        </label>
      </div>
    </template>
    <template #footer>
      <button
        class="btn-dialog-cancel"
        type="button"
        :disabled="assigning"
        @click="assignModalOpen = false"
      >
        Abbrechen
      </button>
      <button
        class="btn-dialog-primary"
        type="button"
        :disabled="assigning"
        @click="assignSelected"
      >
        Fertig
      </button>
    </template>
  </UiModal>
</template>
