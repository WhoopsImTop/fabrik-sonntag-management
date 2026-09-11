<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { entityIsUnassigned, entityLocationLabel } from "~/utils/heatingRoom";
import type { HeatingEntity } from "~/composables/useHeatingApi";

const heatingApi = useHeatingApi();
const toast = useToast();

const loading = ref(false);
const adding = ref(false);
const pairingBusy = ref(false);
const mqttConnected = ref(false);
const devices = ref<any[]>([]);
const entities = ref<HeatingEntity[]>([]);
const models = ref<any[]>([]);
const selected = ref<string[]>([]);
const zigbee = ref({
  permit_join: false,
  remaining_seconds: null as number | null,
});
const remaining = ref<number | null>(null);

const form = ref({
  mqtt_identifier: "",
  mqtt_topic_prefix: "",
  name: "",
  device_model_id: null as number | null,
});
const modalOpen = ref(false);
const assignment = ref<Record<string, number | null>>({});
const initialSelectDone = ref(false);

let pollTimer: ReturnType<typeof setInterval> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const applyZigbee = (status?: {
  permit_join?: boolean;
  remaining_seconds?: number | null;
}) => {
  zigbee.value = {
    permit_join: !!status?.permit_join,
    remaining_seconds: status?.remaining_seconds ?? null,
  };
  remaining.value = zigbee.value.permit_join
    ? zigbee.value.remaining_seconds
    : null;
};

const applyDiscovery = (
  discovery: {
    devices: any[];
    mqtt_connected: boolean;
    zigbee?: { permit_join?: boolean; remaining_seconds?: number | null };
  },
  { firstLoad = false } = {},
) => {
  const previousIds = new Set(devices.value.map((d) => d.mqtt_identifier));
  devices.value = discovery.devices;
  mqttConnected.value = discovery.mqtt_connected;
  applyZigbee(discovery.zigbee);
  const next = { ...assignment.value };
  const newlyJoined: string[] = [];
  for (const device of discovery.devices) {
    if (next[device.mqtt_identifier] == null) {
      next[device.mqtt_identifier] =
        device.device_model_id || models.value[0]?.id || null;
    }
    if (
      !firstLoad &&
      !previousIds.has(device.mqtt_identifier) &&
      device.just_joined
    ) {
      newlyJoined.push(device.mqtt_identifier);
    }
  }
  assignment.value = next;
  if (firstLoad || !initialSelectDone.value) {
    selected.value = discovery.devices.map((d: any) => d.mqtt_identifier);
    initialSelectDone.value = true;
    return;
  }
  const visible = new Set(discovery.devices.map((d: any) => d.mqtt_identifier));
  selected.value = [
    ...new Set([
      ...selected.value.filter((id) => visible.has(id)),
      ...newlyJoined,
    ]),
  ];
};

const setAssignment = (identifier: string, modelId: number | null) => {
  assignment.value = { ...assignment.value, [identifier]: modelId };
};

const load = async (scan = true, silent = false) => {
  if (!silent) loading.value = true;
  if (!silent || !models.value.length) {
    models.value = await heatingApi.getDeviceModels();
  }
  if (!silent) {
    entities.value = await heatingApi.getEntities();
  }
  const discovery = scan
    ? await heatingApi.refreshDiscovery()
    : await heatingApi.getDiscovery();
  applyDiscovery(discovery || { devices: [], mqtt_connected: false }, {
    firstLoad: !silent && !initialSelectDone.value,
  });
  if (!silent) loading.value = false;
};

const startPairing = async (seconds = 120) => {
  pairingBusy.value = true;
  const res = await heatingApi.setPermitJoin(seconds);
  pairingBusy.value = false;
  if (!res?.zigbee) return;
  applyZigbee(res.zigbee);
  toast.add({
    title: "Zigbee-Anlernen aktiv",
    description:
      "Gerät in Pairing-Modus versetzen (meist Reset-Taste 3–10 Sekunden).",
    color: "primary",
  });
  await load(true, true);
};

const stopPairing = async () => {
  pairingBusy.value = true;
  const res = await heatingApi.setPermitJoin(0);
  pairingBusy.value = false;
  if (res?.zigbee) applyZigbee(res.zigbee);
  remaining.value = null;
};

const remainingLabel = computed(() => {
  const n = remaining.value;
  if (n == null || n <= 0) return "";
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
});

const interviewLabel = (device: any) => {
  if (device.interview_status === "successful") return "Bereit";
  if (device.interview_status === "failed") return "Interview fehlgeschlagen";
  if (device.interview_status === "started") return "Interview…";
  if (device.interview_status === "joined" || device.just_joined) return "Neu";
  return "";
};

onMounted(() => {
  load(true);
  pollTimer = setInterval(() => load(false, true), 3000);
  countdownTimer = setInterval(() => {
    if (remaining.value == null || remaining.value <= 0) return;
    remaining.value -= 1;
    if (remaining.value <= 0) {
      zigbee.value = { permit_join: false, remaining_seconds: 0 };
    }
  }, 1000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  if (countdownTimer) clearInterval(countdownTimer);
});

const toggle = (id: string, checked: boolean) => {
  if (checked) {
    if (!selected.value.includes(id)) selected.value = [...selected.value, id];
    return;
  }
  selected.value = selected.value.filter((item) => item !== id);
};

const openRegister = (device: any) => {
  form.value = {
    mqtt_identifier: device.mqtt_identifier,
    mqtt_topic_prefix: device.mqtt_topic_prefix || "",
    name: device.mqtt_identifier,
    device_model_id:
      assignment.value[device.mqtt_identifier] ||
      device.device_model_id ||
      models.value[0]?.id ||
      null,
  };
  modalOpen.value = true;
};

const save = async () => {
  if (!form.value.device_model_id || !form.value.name) {
    toast.add({
      title: "Bitte Modell und Name ausfüllen",
      description: "",
      color: "red",
    });
    return;
  }
  const res = await heatingApi.createEntity({
    device_model_id: form.value.device_model_id,
    name: form.value.name,
    mqtt_identifier: form.value.mqtt_identifier,
    mqtt_topic_prefix: form.value.mqtt_topic_prefix || null,
  });
  modalOpen.value = false;
  if (res?.data?.id) {
    toast.add({
      title: "Gerät registriert",
      description:
        "Es erscheint in der Geräteliste. Einen Raum weisen Sie unter Heizung zu.",
      color: "primary",
    });
    await load(false);
    return;
  }
  await load(false);
};

const addSelected = async () => {
  const chosen = devices.value.filter((d) =>
    selected.value.includes(d.mqtt_identifier),
  );
  if (!chosen.length) {
    toast.add({
      title: "Keine Geräte ausgewählt",
      description: "",
      color: "red",
    });
    return;
  }
  const payload = chosen.map((d) => ({
    mqtt_identifier: d.mqtt_identifier,
    mqtt_topic_prefix: d.mqtt_topic_prefix || null,
    name: d.mqtt_identifier,
    device_model_id: assignment.value[d.mqtt_identifier] || d.device_model_id,
  }));
  if (payload.some((d) => !d.device_model_id)) {
    toast.add({
      title: "Modell fehlt",
      description: "Bitte für jedes Gerät Hersteller und Modell wählen.",
      color: "red",
    });
    return;
  }
  adding.value = true;
  const res = await heatingApi.bulkCreateEntities({
    devices: payload,
  });
  adding.value = false;
  const count = res?.data?.length || 0;
  const failed = res?.errors?.length || 0;
  toast.add({
    title: `${count} Gerät(e) hinzugefügt`,
    description: failed
      ? `${failed} übersprungen`
      : "Die Geräte erscheinen in der Liste. Räume weisen Sie unter Heizung zu.",
    color: "primary",
  });
  await load(false);
};

const selectedModel = computed(() =>
  models.value.find((m) => m.id === form.value.device_model_id),
);

const locationOf = (entity: HeatingEntity) => {
  if (entityIsUnassigned(entity)) return "Nicht zugeordnet";
  return entityLocationLabel(entity) || "Nicht zugeordnet";
};

const editingId = ref<number | null>(null);
const nameDraft = ref("");
const nameInput = ref<HTMLInputElement | null>(null);

const startEditName = async (entity: HeatingEntity) => {
  editingId.value = entity.id;
  nameDraft.value = entity.name;
  await nextTick();
  nameInput.value?.focus();
  nameInput.value?.select();
};

const cancelName = () => {
  editingId.value = null;
  nameDraft.value = "";
};

const saveName = async (entity: HeatingEntity) => {
  if (editingId.value !== entity.id) return;
  const next = nameDraft.value.trim();
  editingId.value = null;
  if (!next || next === entity.name) {
    nameDraft.value = "";
    return;
  }
  const previous = entity.name;
  entity.name = next;
  const res = await heatingApi.updateEntity(entity.id, { name: next });
  if (res?.data?.name) entity.name = res.data.name;
  else entity.name = previous;
};
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">Geräte</h1>
        <p class="mt-1 text-sm text-neutral-500">
          MQTT
          {{ mqttConnected ? "verbunden" : "nicht verbunden" }}. Neue Geräte
          anlernen und alle registrierten Thermostate verwalten.
        </p>
      </div>
      <div class="flex gap-2">
        <UiButton
          variant="outline"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="load(true)"
        >
          Broker scannen
        </UiButton>
        <UiButton
          :disabled="!selected.length || adding"
          :loading="adding"
          icon="i-lucide-plus"
          @click="addSelected"
        >
          Auswahl hinzufügen ({{ selected.length }})
        </UiButton>
      </div>
    </div>

    <div
      class="mb-6 border p-4"
      :class="
        zigbee.permit_join
          ? 'border-emerald-300 bg-emerald-50'
          : 'border-neutral-200'
      "
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-sm font-medium text-neutral-900">Zigbee anlernen</p>
          <p class="mt-1 text-sm text-neutral-600">
            <template v-if="zigbee.permit_join">
              Netzwerk ist offen
              <span v-if="remainingLabel"> — noch {{ remainingLabel }}</span
              >. Gerät am Thermostat in den Pairing-Modus versetzen.
            </template>
            <template v-else>
              Netzwerk geschlossen. Starten, dann das Thermostat 3–10 Sekunden
              auf Reset/Pairing halten. Es erscheint unten in der Liste.
            </template>
          </p>
        </div>
        <div class="flex gap-2">
          <UiButton
            v-if="zigbee.permit_join"
            variant="outline"
            :loading="pairingBusy"
            :disabled="!mqttConnected"
            @click="stopPairing"
          >
            Anlernen beenden
          </UiButton>
          <UiButton
            v-else
            icon="i-lucide-radio"
            :loading="pairingBusy"
            :disabled="!mqttConnected"
            @click="startPairing(120)"
          >
            2 Minuten anlernen
          </UiButton>
        </div>
      </div>
    </div>

    <p v-if="!models.length" class="mb-6 text-sm text-amber-800">
      Keine Gerätemodelle geladen. API neu starten bzw. Migrationen prüfen.
    </p>

    <h2 class="mb-3 font-semibold">Neu am Broker</h2>
    <p v-if="loading" class="mb-6 text-sm text-neutral-500">
      Broker wird gescannt…
    </p>
    <p v-else-if="devices.length === 0" class="mb-8 text-sm text-neutral-500">
      Keine unregistrierten Geräte. Für Zigbee zuerst „2 Minuten anlernen“
      starten; Comet WiFi erscheint, sobald MQTT-Nachrichten ankommen.
    </p>

    <UiTable
      v-else
      class="mb-10"
      :columns="[
        { id: 'select', header: '' },
        { accessorKey: 'mqtt_identifier', header: 'Identifier' },
        { accessorKey: 'protocol', header: 'Protokoll' },
        { id: 'status', header: 'Status' },
        { id: 'model', header: 'Hersteller / Modell' },
        { id: 'actions', header: '' },
      ]"
      :data="devices"
    >
      <template #select-cell="{ row }">
        <input
          type="checkbox"
          :checked="selected.includes(row.original.mqtt_identifier)"
          @change="
            toggle(
              row.original.mqtt_identifier,
              ($event.target as HTMLInputElement).checked,
            )
          "
        />
      </template>
      <template #mqtt_identifier-cell="{ row }">
        <span class="font-medium">{{ row.original.mqtt_identifier }}</span>
        <span
          v-if="row.original.just_joined"
          class="ml-2 border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-800"
        >
          Neu
        </span>
      </template>
      <template #status-cell="{ row }">
        <span class="text-xs text-neutral-600">{{
          interviewLabel(row.original) || "—"
        }}</span>
      </template>
      <template #model-cell="{ row }">
        <HeatingModelPicker
          :models="models"
          :model-value="assignment[row.original.mqtt_identifier]"
          @update:model-value="
            setAssignment(row.original.mqtt_identifier, $event)
          "
        />
      </template>
      <template #actions-cell="{ row }">
        <UiButton size="xs" @click="openRegister(row.original)">
          Hinzufügen
        </UiButton>
      </template>
    </UiTable>

    <h2 class="mb-3 font-semibold">Alle Geräte</h2>
    <p v-if="!entities.length" class="text-sm text-neutral-500">
      Noch keine Geräte registriert.
    </p>
    <UiTable
      v-else
      :columns="[
        { accessorKey: 'name', header: 'Gerät' },
        { id: 'location', header: 'Ort' },
        { id: 'status', header: 'Status' },
        { id: 'battery', header: 'Batterie' },
        { accessorKey: 'mqtt_identifier', header: 'Identifier' },
      ]"
      :data="entities"
    >
      <template #name-cell="{ row }">
        <div v-if="editingId === row.original.id" class="max-w-xs">
          <input
            ref="nameInput"
            v-model="nameDraft"
            class="dialog-input py-1 text-sm font-medium"
            @keydown.enter.prevent="saveName(row.original)"
            @keydown.esc.prevent="cancelName"
            @blur="saveName(row.original)"
          />
        </div>
        <div v-else class="flex min-w-0 items-center gap-1.5">
          <NuxtLink
            :to="`/heating/entities/${row.original.id}`"
            class="font-medium hover:underline"
          >
            {{ row.original.name }}
          </NuxtLink>
          <button
            type="button"
            class="shrink-0 text-neutral-400 hover:text-neutral-800"
            aria-label="Umbenennen"
            @click="startEditName(row.original)"
          >
            <UiIcon name="i-lucide-pencil" class="size-3.5" />
          </button>
        </div>
      </template>
      <template #location-cell="{ row }">
        {{ locationOf(row.original) }}
      </template>
      <template #battery-cell="{ row }">
        <span :class="row.original.battery < 10 ? 'text-red-600' : ''"
          >{{ row.original.battery }} %</span
        >
      </template>
      <template #status-cell="{ row }">
        <HeatingOfflineBadge :offline="row.original.offline" />
      </template>
    </UiTable>

    <UiModal v-model:open="modalOpen" title="Gerät hinzufügen" max-width="lg">
      <template #body>
        <label class="dialog-label">Name</label>
        <input v-model="form.name" class="dialog-input mb-3" />
        <label class="dialog-label">MQTT-Identifier</label>
        <input
          v-model="form.mqtt_identifier"
          class="dialog-input mb-3"
          disabled
        />
        <label class="dialog-label">Topic-Präfix (Comet WiFi, optional)</label>
        <input v-model="form.mqtt_topic_prefix" class="dialog-input mb-3" />
        <label class="dialog-label">Hersteller / Modell</label>
        <HeatingModelPicker
          class="mb-3"
          stacked
          show-labels
          :models="models"
          v-model="form.device_model_id"
        />
        <p v-if="selectedModel" class="text-xs text-neutral-500">
          Adapter {{ selectedModel.adapter_key }} — nach dem Speichern erscheint
          das Gerät in der Liste.
        </p>
      </template>
      <template #footer>
        <button
          class="btn-dialog-cancel"
          type="button"
          @click="modalOpen = false"
        >
          Abbrechen
        </button>
        <button class="btn-dialog-primary" type="button" @click="save">
          Hinzufügen
        </button>
      </template>
    </UiModal>
  </div>
</template>
