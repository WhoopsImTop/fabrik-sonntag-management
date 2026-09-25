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
  isLegacyDefaultRoom,
  roomLabel,
  roomsOfBuilding,
  unitLabel,
  unitOfRoom,
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

const pickerSearch = ref("");

const pickerItems = computed(() => {
  const roomId = room.value?.id;
  const query = pickerSearch.value.trim().toLowerCase();
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
    if (query) {
      const haystack = [
        entity.name,
        entity.entity_number,
        entity.mqtt_identifier,
        location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) continue;
    }
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
  pickerSearch.value = "";
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

// --- HEIZPLAN IN ANDERE RÄUME KOPIEREN ---

type SchedulePayload = {
  eco_temperature: number;
  intervals: { weekday: number; start: string; end: string; target_temperature: number }[];
};

const copyModalOpen = ref(false);
const copyPayload = ref<SchedulePayload | null>(null);
const copyTargets = ref<{ id: number; name: string; subtitle: string }[]>([]);
const copySelectedIds = ref<number[]>([]);
const copySearch = ref("");
const copyLoading = ref(false);
const copying = ref(false);

const filteredCopyTargets = computed(() => {
  const query = copySearch.value.trim().toLowerCase();
  if (!query) return copyTargets.value;
  return copyTargets.value.filter((item) =>
    `${item.name} ${item.subtitle}`.toLowerCase().includes(query),
  );
});

const allCopyTargetsSelected = computed(
  () =>
    filteredCopyTargets.value.length > 0 &&
    filteredCopyTargets.value.every((item) => copySelectedIds.value.includes(item.id)),
);

const toggleCopyTarget = (roomId: number) => {
  copySelectedIds.value = copySelectedIds.value.includes(roomId)
    ? copySelectedIds.value.filter((id) => id !== roomId)
    : [...copySelectedIds.value, roomId];
};

const toggleAllCopyTargets = () => {
  const visibleIds = filteredCopyTargets.value.map((item) => item.id);
  if (allCopyTargetsSelected.value) {
    copySelectedIds.value = copySelectedIds.value.filter((id) => !visibleIds.includes(id));
    return;
  }
  copySelectedIds.value = [...new Set([...copySelectedIds.value, ...visibleIds])];
};

const openCopyModal = async (payload: SchedulePayload) => {
  copyPayload.value = payload;
  copySelectedIds.value = [];
  copySearch.value = "";
  copyModalOpen.value = true;
  copyLoading.value = true;
  const buildings = await heatingApi.getHierarchy();
  const targets: { id: number; name: string; subtitle: string }[] = [];
  for (const building of buildings) {
    for (const target of roomsOfBuilding(building)) {
      if (target.id === props.roomId || isLegacyDefaultRoom(target)) continue;
      const count = (target.entities || []).length;
      targets.push({
        id: target.id,
        name: `Raum ${roomLabel(target) || target.name || target.id}`,
        subtitle: [
          buildingLabel(building),
          unitLabel(unitOfRoom(building, target)),
          count === 1 ? "1 Thermostat" : `${count} Thermostate`,
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
  }
  copyTargets.value = targets;
  copyLoading.value = false;
};

const copySchedule = async () => {
  if (!copyPayload.value || !copySelectedIds.value.length) return;
  const ok = await confirm.confirm({
    title: "Heizpläne überschreiben?",
    message: `Der bestehende Raum-Heizplan wird in ${copySelectedIds.value.length} ${
      copySelectedIds.value.length === 1 ? "Raum" : "Räumen"
    } durch diesen Plan ersetzt.`,
    variant: "warning",
    confirmLabel: "Ja, überschreiben",
  });
  if (!ok) return;
  copying.value = true;
  const failed: string[] = [];
  const unreachable: string[] = [];
  for (const targetId of copySelectedIds.value) {
    const label = copyTargets.value.find((item) => item.id === targetId)?.name || `#${targetId}`;
    const res = await heatingApi.replaceRoomSchedule(targetId, copyPayload.value);
    if (!res?.data) failed.push(label);
    else if (res.data.native_errors?.length) unreachable.push(label);
  }
  copying.value = false;
  const succeeded = copySelectedIds.value.length - failed.length;
  if (succeeded > 0) {
    useToast().add({
      title: `Heizplan in ${succeeded} ${succeeded === 1 ? "Raum" : "Räume"} kopiert`,
      color: "green",
    });
  }
  if (failed.length) {
    useToast().add({
      title: "Kopieren teilweise fehlgeschlagen",
      description: failed.join(", "),
      color: "red",
    });
  }
  if (unreachable.length) {
    useToast().add({
      title: "Plan kopiert, nicht alle Geräte erreicht",
      description: unreachable.join(", "),
      color: "red",
    });
  }
  if (!failed.length) copyModalOpen.value = false;
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
      copyable
      @save="onScheduleSave"
      @copy="openCopyModal"
    />
  </template>

  <UiModal
    v-model:open="assignModalOpen"
    title="Thermostate zuordnen"
    description="Wähle die Geräte aus, die diesem Raum zugeordnet sind."
    max-width="lg"
  >
    <template #body>
      <input
        v-if="allEntities.length"
        v-model="pickerSearch"
        type="search"
        class="dialog-input mb-3"
        placeholder="Thermostat suchen (Name, Nummer, Raum)…"
      />
      <p v-if="!allEntities.length" class="text-sm text-neutral-500">
        Keine Thermostate registriert. Lerne zuerst Geräte an.
      </p>
      <p v-else-if="!pickerItems.length" class="text-sm text-neutral-500">
        Keine Thermostate gefunden.
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

  <UiModal
    v-model:open="copyModalOpen"
    title="Heizplan kopieren"
    description="Wähle die Räume, die diesen Heizplan inkl. Absenktemperatur übernehmen sollen. Ihr bisheriger Raum-Heizplan wird ersetzt."
    max-width="lg"
  >
    <template #body>
      <p v-if="copyLoading" class="text-sm text-neutral-400">Lade Räume…</p>
      <p v-else-if="!copyTargets.length" class="text-sm text-neutral-500">
        Keine weiteren Räume vorhanden.
      </p>
      <template v-else>
        <input
          v-model="copySearch"
          type="search"
          class="dialog-input mb-3"
          placeholder="Raum suchen (Nummer, Name, Gebäude)…"
        />
        <label
          v-if="filteredCopyTargets.length"
          class="mb-2 flex cursor-pointer items-center gap-3 px-3 text-sm text-neutral-600"
        >
          <input
            type="checkbox"
            :checked="allCopyTargetsSelected"
            :disabled="copying"
            @change="toggleAllCopyTargets"
          />
          Alle auswählen
        </label>
        <p v-if="!filteredCopyTargets.length" class="text-sm text-neutral-500">
          Keine Räume gefunden.
        </p>
        <div v-else class="max-h-80 space-y-2 overflow-y-auto">
          <label
            v-for="item in filteredCopyTargets"
            :key="item.id"
            class="flex cursor-pointer items-start gap-3 border border-neutral-200 px-3 py-2.5 hover:bg-neutral-50"
          >
            <input
              type="checkbox"
              class="mt-1"
              :checked="copySelectedIds.includes(item.id)"
              :disabled="copying"
              @change="toggleCopyTarget(item.id)"
            />
            <span class="min-w-0">
              <span class="block font-medium text-neutral-900">{{ item.name }}</span>
              <span class="block text-xs text-neutral-500">{{ item.subtitle }}</span>
            </span>
          </label>
        </div>
      </template>
    </template>
    <template #footer>
      <button
        class="btn-dialog-cancel"
        type="button"
        :disabled="copying"
        @click="copyModalOpen = false"
      >
        Abbrechen
      </button>
      <button
        class="btn-dialog-primary"
        type="button"
        :disabled="copying || !copySelectedIds.length"
        @click="copySchedule"
      >
        {{ copying ? "Kopiere…" : `In ${copySelectedIds.length} ${copySelectedIds.length === 1 ? "Raum" : "Räume"} kopieren` }}
      </button>
    </template>
  </UiModal>
</template>
