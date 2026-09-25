<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import {
  normalizeHeatingSchema,
  type HeatingEntity,
  type ZigbeeCoordinator,
} from "~/composables/useHeatingApi";
import {
  buildingLabel,
  entityIsUnassigned,
  entityLocationLabel,
  isLegacyDefaultBuilding,
  isLegacyDefaultRoom,
  locationLabel as formatLocation,
  roomLabel,
  unitLabel,
  unitsOfBuilding,
} from "~/utils/heatingRoom";

const route = useRoute();
const heatingApi = useHeatingApi();
const confirm = useConfirm();
const { role } = useAuth();
const isAdminUser = computed(() => role.value === "admin");

const entity = ref<HeatingEntity | null>(null);
const models = ref<any[]>([]);
const coordinators = ref<ZigbeeCoordinator[]>([]);
const intervals = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const scheduleSaving = ref(false);
const modelOpen = ref(false);
const coordinatorOpen = ref(false);
const coordinatorSaving = ref(false);
const techOpen = ref(false);
const detailsOpen = ref(false);
const entityNumberDraft = ref("");
const notesDraft = ref("");
const editingName = ref(false);
const nameDraft = ref("");
const nameInput = ref<HTMLInputElement | null>(null);

const id = computed(() => Number(route.params.id));
let pollTimer: ReturnType<typeof setInterval> | null = null;

const THERMOSTAT_KEYS = new Set([
  "target_temperature",
  "current_temperature",
  "system_mode",
  "running_state",
  "battery",
  "battery_low",
  "window_open",
]);
const COMPACT_KEYS = new Set([
  "child_lock",
  "frost_protection_temperature",
  "local_temperature_calibration",
  "window_open_sensitivity",
  "window_open_duration",
]);

const load = async () => {
  loading.value = true;
  entity.value = await heatingApi.getEntity(id.value);
  if (isAdminUser.value) {
    models.value = await heatingApi.getDeviceModels();
    coordinators.value = await heatingApi.getCoordinators();
  }
  intervals.value = await heatingApi.getSchedules({ entity_id: id.value });
  loading.value = false;
};

const onModelChange = async (modelId: number | null) => {
  if (!entity.value || !modelId) return;
  const res = await heatingApi.updateEntity(entity.value.id, {
    device_model_id: modelId,
  });
  if (res?.data) entity.value = res.data;
  else await load();
};

// Das Gerät wurde physisch an einen anderen Koordinator umgepaart (z. B. bei
// einem Standortwechsel) – hier nur nachziehen, wohin die App Kommandos schickt.
const isZigbeeEntity = computed(
  () => entity.value?.deviceModel?.protocol === "zigbee2mqtt",
);

const onCoordinatorChange = async (coordinatorId: number | null) => {
  if (!entity.value || coordinatorId == null) return;
  coordinatorSaving.value = true;
  const res = await heatingApi.updateEntity(entity.value.id, {
    coordinator_id: coordinatorId,
  });
  coordinatorSaving.value = false;
  if (res?.data) {
    entity.value = res.data;
    coordinatorOpen.value = false;
    useToast().add({
      title: "Koordinator geändert",
      description:
        "Kommandos gehen ab sofort an den neuen Koordinator. Das Gerät muss dort zuvor angelernt worden sein.",
      color: "primary",
    });
  }
};

const onCapabilityChange = async (key: string, value: unknown) => {
  if (!entity.value) return;
  const current = entity.value;
  const previous = current.last_state?.[key];
  entity.value = {
    ...current,
    last_state: { ...current.last_state, [key]: value },
  };
  saving.value = true;
  const res = await heatingApi.setCapability(current.id, key, value);
  if (res?.data) entity.value = res.data;
  else if (entity.value) {
    entity.value = {
      ...entity.value,
      last_state: { ...entity.value.last_state, [key]: previous },
    };
  }
  saving.value = false;
};

const onScheduleSave = async (payload: {
  eco_temperature: number;
  intervals: { weekday: number; start: string; end: string; target_temperature: number }[];
}) => {
  if (!entity.value) return;
  scheduleSaving.value = true;
  const res = await heatingApi.replaceEntitySchedule(entity.value.id, payload);
  scheduleSaving.value = false;
  if (res?.data) {
    intervals.value = res.data.intervals || payload.intervals;
    entity.value = {
      ...entity.value,
      eco_temperature: res.data.eco_temperature ?? payload.eco_temperature,
    };
    if (res.data.native_error) {
      useToast().add({
        title: "Plan gespeichert, Gerät nicht erreicht",
        description: res.data.native_error,
        color: "red",
      });
    }
  }
};

// --- HEIZPLAN AUF ANDERE THERMOSTATE KOPIEREN ---

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

const toggleCopyTarget = (entityId: number) => {
  copySelectedIds.value = copySelectedIds.value.includes(entityId)
    ? copySelectedIds.value.filter((existingId) => existingId !== entityId)
    : [...copySelectedIds.value, entityId];
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
  const entities = await heatingApi.getEntities();
  copyTargets.value = entities
    .filter((item) => item.id !== entity.value?.id)
    .map((item) => ({
      id: item.id,
      name: item.name,
      subtitle: entityLocationLabel(item) || "Nicht zugeordnet",
    }));
  copyLoading.value = false;
};

const copySchedule = async () => {
  if (!copyPayload.value || !copySelectedIds.value.length) return;
  const count = copySelectedIds.value.length;
  const ok = await confirm.confirm({
    title: "Heizpläne überschreiben?",
    message: `Der eigene Heizplan von ${count} ${
      count === 1 ? "Thermostat" : "Thermostaten"
    } wird durch diesen Plan ersetzt. Er hat Vorrang vor dem Raum-Heizplan.`,
    variant: "warning",
    confirmLabel: "Ja, überschreiben",
  });
  if (!ok) return;
  copying.value = true;
  const failed: string[] = [];
  const unreachable: string[] = [];
  for (const targetId of copySelectedIds.value) {
    const label = copyTargets.value.find((item) => item.id === targetId)?.name || `#${targetId}`;
    const res = await heatingApi.replaceEntitySchedule(targetId, copyPayload.value);
    if (!res?.data) failed.push(label);
    else if (res.data.native_error) unreachable.push(label);
  }
  copying.value = false;
  const succeeded = count - failed.length;
  if (succeeded > 0) {
    useToast().add({
      title: `Heizplan auf ${succeeded} ${succeeded === 1 ? "Thermostat" : "Thermostate"} kopiert`,
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

const startEditName = async () => {
  if (!entity.value) return;
  nameDraft.value = entity.value.name;
  editingName.value = true;
  await nextTick();
  nameInput.value?.focus();
  nameInput.value?.select();
};

const saveName = async () => {
  if (!entity.value || !editingName.value) return;
  const next = nameDraft.value.trim();
  editingName.value = false;
  if (!next || next === entity.value.name) {
    nameDraft.value = entity.value.name;
    return;
  }
  const res = await heatingApi.updateEntity(entity.value.id, { name: next });
  if (res?.data) entity.value = res.data;
};

const openDetails = () => {
  entityNumberDraft.value = entity.value?.entity_number || "";
  notesDraft.value = entity.value?.notes || "";
  detailsOpen.value = true;
};

const saveDetails = async () => {
  if (!entity.value) return;
  const res = await heatingApi.updateEntity(entity.value.id, {
    entity_number: entityNumberDraft.value.trim() || null,
    notes: notesDraft.value.trim() || null,
  });
  if (res?.data) entity.value = res.data;
  detailsOpen.value = false;
};

// --- RAUM ZUORDNEN / ÄNDERN ---

const roomModalOpen = ref(false);
const roomSaving = ref(false);
const roomSearch = ref("");
const hierarchy = ref<any[]>([]);

const openRoomModal = async () => {
  roomSearch.value = "";
  roomModalOpen.value = true;
  hierarchy.value = await heatingApi.getHierarchy();
};

const roomOptions = computed(() => {
  const options: { id: number; label: string; subtitle: string }[] = [];
  for (const building of hierarchy.value) {
    for (const unit of unitsOfBuilding(building)) {
      for (const room of unit.rooms || []) {
        if (isLegacyDefaultRoom(room)) continue;
        options.push({
          id: room.id,
          label: `Raum ${roomLabel(room) || room.name}`,
          subtitle: [
            isLegacyDefaultBuilding(building) ? "" : buildingLabel(building),
            unitLabel(unit) ? `Einheit ${unitLabel(unit)}` : "",
          ]
            .filter(Boolean)
            .join(" · "),
        });
      }
    }
  }
  const query = roomSearch.value.trim().toLowerCase();
  if (!query) return options;
  return options.filter((option) =>
    `${option.label} ${option.subtitle}`.toLowerCase().includes(query),
  );
});

const onRoomChange = async (roomId: number | null) => {
  if (!entity.value || roomSaving.value) return;
  if (roomId === entity.value.room_id) {
    roomModalOpen.value = false;
    return;
  }
  roomSaving.value = true;
  const res = await heatingApi.updateEntity(entity.value.id, { room_id: roomId });
  roomSaving.value = false;
  if (!res?.data) return;
  entity.value = res.data;
  roomModalOpen.value = false;
  useToast().add({
    title: roomId ? "Raum geändert" : "Raumzuordnung entfernt",
    description: "",
    color: "primary",
  });
};

// Ein Level nach oben (zum Raum), damit man nicht bei jedem Zurück ganz nach oben springt
const backLink = computed(() =>
  entity.value?.room_id ? `/heating/rooms/${entity.value.room_id}` : "/heating",
);
const backLabel = computed(() => (entity.value?.room_id ? "← Raum" : "← Übersicht"));

const locationLabel = computed(() => {
  const current = entity.value?.room;
  if (!current) return "Nicht zugeordnet";
  return formatLocation(current.unit?.building, current) || "Nicht zugeordnet";
});

const overrideLabel = computed(() => {
  if (!entity.value?.manual_override) return null;
  const next = entity.value.next_schedule;
  if (!next?.at) return "Manuell bis zum nächsten Heizplan";
  return `Manuell bis ${new Date(next.at).toLocaleString("de-DE", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
});

const entitySchema = computed(() =>
  normalizeHeatingSchema(entity.value?.schema),
);

const hasThermostat = computed(() =>
  entitySchema.value.some((cap) => cap.key === "target_temperature"),
);

const compactCaps = computed(() =>
  entitySchema.value.filter((cap) => COMPACT_KEYS.has(cap.key)),
);

const techCaps = computed(() =>
  entitySchema.value.filter(
    (cap) => !THERMOSTAT_KEYS.has(cap.key) && !COMPACT_KEYS.has(cap.key),
  ),
);

const targetCap = computed(
  () => entitySchema.value.find((cap) => cap.key === "target_temperature"),
);

onMounted(async () => {
  await load();
  pollTimer = setInterval(() => {
    if (saving.value || scheduleSaving.value) return;
    heatingApi.getEntity(id.value).then((data) => {
      if (data) entity.value = data;
    });
  }, 15000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<template>
  <div>
    <NuxtLink :to="backLink" class="mb-4 inline-flex text-sm text-neutral-500 hover:text-neutral-800">
      {{ backLabel }}
    </NuxtLink>

    <div v-if="loading && !entity" aria-busy="true">
      <div class="mb-4 space-y-2">
        <div class="h-7 w-40 animate-pulse bg-neutral-200" />
        <div class="h-4 w-56 animate-pulse bg-neutral-100" />
      </div>
      <div class="mb-6 grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start">
        <HeatingThermostatCardSkeleton />
      </div>
    </div>
    <div v-else-if="!entity" class="text-sm text-neutral-500">Gerät nicht gefunden.</div>
    <template v-else>
      <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div v-if="isAdminUser" class="flex items-center gap-2">
            <input
              v-if="editingName"
              ref="nameInput"
              v-model="nameDraft"
              class="dialog-input text-xl font-bold"
              @keydown.enter.prevent="saveName"
              @keydown.esc.prevent="editingName = false"
              @blur="saveName"
            />
            <h1 v-else class="text-xl font-bold">{{ entity.name }}</h1>
            <button
              v-if="!editingName"
              type="button"
              class="text-neutral-400 hover:text-neutral-800"
              aria-label="Umbenennen"
              @click="startEditName"
            >
              <UiIcon name="i-lucide-pencil" class="size-4" />
            </button>
          </div>
          <h1 v-else class="text-xl font-bold">{{ entity.name }}</h1>
          <p class="mt-0.5 text-sm text-neutral-500">
            <NuxtLink
              v-if="entity.room_id"
              :to="`/heating/rooms/${entity.room_id}`"
              class="hover:underline"
            >
              {{ locationLabel }}
            </NuxtLink>
            <span v-else>{{ locationLabel }}</span>
            <span v-if="entity.entity_number"> · Nr. {{ entity.entity_number }}</span>
            <span v-if="entity.deviceModel">
              · {{ entity.deviceModel.manufacturer }} {{ entity.deviceModel.model }}
            </span>
          </p>
          <div class="mt-1 flex flex-wrap items-center gap-3">
            <button
              v-if="isAdminUser"
              type="button"
              class="text-xs text-neutral-500 underline"
              @click="openRoomModal"
            >
              {{ entityIsUnassigned(entity) ? "Raum zuordnen" : "Raum ändern" }}
            </button>
            <button
              v-if="isAdminUser && models.length"
              type="button"
              class="text-xs text-neutral-500 underline"
              @click="modelOpen = !modelOpen"
            >
              Modell ändern
            </button>
            <button
              v-if="isAdminUser && isZigbeeEntity && coordinators.length"
              type="button"
              class="text-xs text-neutral-500 underline"
              @click="coordinatorOpen = !coordinatorOpen"
            >
              Koordinator ändern
            </button>
            <button
              v-if="isAdminUser"
              type="button"
              class="text-xs text-neutral-500 underline"
              @click="detailsOpen ? (detailsOpen = false) : openDetails()"
            >
              {{ detailsOpen ? "Details schließen" : "Nummer & Bemerkung bearbeiten" }}
            </button>
          </div>
          <div v-if="modelOpen" class="mt-2 max-w-md">
            <HeatingModelPicker
              stacked
              show-labels
              :models="models"
              :model-value="entity.device_model_id"
              @update:model-value="onModelChange"
            />
          </div>
          <div v-if="coordinatorOpen" class="mt-2 max-w-md">
            <HeatingCoordinatorPicker
              show-labels
              :coordinators="coordinators"
              :model-value="entity.coordinator_id"
              :disabled="coordinatorSaving"
              @update:model-value="onCoordinatorChange"
            />
            <p class="mt-1 text-xs text-neutral-500">
              Nur wählen, wenn das Gerät bereits am Ziel-Koordinator
              angelernt ist – sonst gehen Kommandos ins Leere.
            </p>
          </div>
          <div v-if="detailsOpen" class="mt-2 max-w-md space-y-2">
            <div>
              <label class="dialog-label">Heizkörper-Nr.</label>
              <input v-model="entityNumberDraft" class="dialog-input" placeholder="z. B. 01" />
            </div>
            <div>
              <label class="dialog-label">Bemerkung</label>
              <textarea
                v-model="notesDraft"
                class="dialog-input"
                rows="3"
                placeholder="Freie Notizen zu diesem Heizkörper..."
              />
            </div>
            <button type="button" class="btn-dialog-primary" @click="saveDetails">
              Speichern
            </button>
          </div>
          <p v-if="entity.notes" class="mt-2 text-sm text-neutral-600 whitespace-pre-line">
            {{ entity.notes }}
          </p>
        </div>
        <HeatingOfflineBadge :offline="entity.offline" />
      </div>

      <p v-if="overrideLabel" class="mb-4 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        {{ overrideLabel }}
      </p>

      <div class="mb-6 grid gap-4 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start">
        <HeatingThermostatCard
          v-if="hasThermostat"
          :last-state="entity.last_state"
          :schema="entitySchema"
          :offline="entity.offline"
          @change="onCapabilityChange"
        />
        <div class="space-y-2">
          <div
            v-for="cap in compactCaps"
            :key="cap.key"
            class="border border-neutral-200 px-3 py-2"
          >
            <HeatingCapabilityRenderer
              compact
              :schema="cap"
              :value="entity.last_state?.[cap.key]"
              @change="onCapabilityChange"
            />
          </div>
          <button
            v-if="techCaps.length"
            type="button"
            class="text-xs text-neutral-500 underline"
            @click="techOpen = !techOpen"
          >
            {{ techOpen ? "Technik ausblenden" : "Technik anzeigen" }}
          </button>
          <div v-if="techOpen" class="grid gap-2 sm:grid-cols-2">
            <div
              v-for="cap in techCaps"
              :key="cap.key"
              class="border border-neutral-200 px-3 py-2"
            >
              <HeatingCapabilityRenderer
                compact
                :schema="cap"
                :value="entity.last_state?.[cap.key]"
                @change="onCapabilityChange"
              />
            </div>
          </div>
        </div>
      </div>

      <HeatingHistoryChart :entity-id="entity.id" class="mb-6" />

      <HeatingWeekSchedule
        :intervals="intervals"
        :eco-temperature="entity.eco_temperature ?? 16"
        :native="!!entity.supports_native_schedule"
        :min="targetCap?.min ?? 5"
        :max="targetCap?.max ?? 30"
        :step="targetCap?.step ?? 0.5"
        :saving="scheduleSaving"
        copyable
        copy-label="Auf andere Thermostate kopieren"
        @save="onScheduleSave"
        @copy="openCopyModal"
      />
    </template>

    <UiModal
      v-model:open="roomModalOpen"
      title="Raum zuordnen"
      description="Wähle den Raum, in dem dieses Thermostat hängt."
      max-width="lg"
    >
      <template #body>
        <input
          v-model="roomSearch"
          type="search"
          class="dialog-input mb-3"
          placeholder="Raum suchen (Gebäude, Einheit, Raum)…"
        />
        <p v-if="!roomOptions.length" class="text-sm text-neutral-500">
          {{ roomSearch ? "Keine Räume gefunden." : "Noch keine Räume angelegt." }}
        </p>
        <div v-else class="max-h-80 space-y-2 overflow-y-auto">
          <button
            v-for="option in roomOptions"
            :key="option.id"
            type="button"
            class="flex w-full items-center justify-between gap-3 border px-3 py-2.5 text-left hover:bg-neutral-50"
            :class="option.id === entity?.room_id ? 'border-brand-accent bg-neutral-50' : 'border-neutral-200'"
            :disabled="roomSaving"
            @click="onRoomChange(option.id)"
          >
            <span class="min-w-0">
              <span class="block font-medium text-neutral-900">{{ option.label }}</span>
              <span class="block text-xs text-neutral-500">{{ option.subtitle }}</span>
            </span>
            <span v-if="option.id === entity?.room_id" class="text-xs text-neutral-500">
              Aktuell
            </span>
          </button>
        </div>
      </template>
      <template #footer>
        <button
          v-if="entity?.room_id"
          class="btn-dialog-cancel mr-auto"
          type="button"
          :disabled="roomSaving"
          @click="onRoomChange(null)"
        >
          Zuordnung entfernen
        </button>
        <button
          class="btn-dialog-cancel"
          type="button"
          :disabled="roomSaving"
          @click="roomModalOpen = false"
        >
          Abbrechen
        </button>
      </template>
    </UiModal>

    <UiModal
      v-model:open="copyModalOpen"
      title="Heizplan kopieren"
      description="Wähle die Thermostate, die diesen Heizplan inkl. Absenktemperatur als eigenen Zeitplan übernehmen sollen. Ihr bisheriger eigener Zeitplan wird ersetzt."
      max-width="lg"
    >
      <template #body>
        <p v-if="copyLoading" class="text-sm text-neutral-400">Lade Thermostate…</p>
        <p v-else-if="!copyTargets.length" class="text-sm text-neutral-500">
          Keine weiteren Thermostate vorhanden.
        </p>
        <template v-else>
          <input
            v-model="copySearch"
            type="search"
            class="dialog-input mb-3"
            placeholder="Thermostat suchen (Name, Raum, Gebäude)…"
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
            Keine Thermostate gefunden.
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
          {{ copying ? "Kopiere…" : `Auf ${copySelectedIds.length} ${copySelectedIds.length === 1 ? "Thermostat" : "Thermostate"} kopieren` }}
        </button>
      </template>
    </UiModal>
  </div>
</template>
