<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import {
  normalizeHeatingSchema,
  type HeatingEntity,
} from "~/composables/useHeatingApi";
import { locationLabel as formatLocation } from "~/utils/heatingRoom";

const route = useRoute();
const heatingApi = useHeatingApi();
const { role } = useAuth();
const isAdminUser = computed(() => role.value === "admin");

const entity = ref<HeatingEntity | null>(null);
const models = ref<any[]>([]);
const intervals = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const scheduleSaving = ref(false);
const modelOpen = ref(false);
const techOpen = ref(false);
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
    <NuxtLink to="/heating" class="mb-4 inline-flex text-sm text-neutral-500 hover:text-neutral-800">
      ← Übersicht
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
            <span v-if="entity.deviceModel">
              · {{ entity.deviceModel.manufacturer }} {{ entity.deviceModel.model }}
            </span>
          </p>
          <button
            v-if="isAdminUser && models.length"
            type="button"
            class="mt-1 text-xs text-neutral-500 underline"
            @click="modelOpen = !modelOpen"
          >
            Modell ändern
          </button>
          <div v-if="modelOpen" class="mt-2 max-w-md">
            <HeatingModelPicker
              stacked
              show-labels
              :models="models"
              :model-value="entity.device_model_id"
              @update:model-value="onModelChange"
            />
          </div>
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
        @save="onScheduleSave"
      />
    </template>
  </div>
</template>
