<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { entityIsUnassigned, entityLocationLabel } from "~/utils/heatingRoom";
import type {
  HeatingEntity,
  ZigbeeCoordinator,
  ZigbeeCoordinatorStatus,
} from "~/composables/useHeatingApi";

const heatingApi = useHeatingApi();
const toast = useToast();
const confirm = useConfirm();

const loading = ref(false);
const adding = ref(false);
const mqttConnected = ref(false);
const devices = ref<any[]>([]);
const entities = ref<HeatingEntity[]>([]);
const models = ref<any[]>([]);
const selected = ref<string[]>([]);
const coordinators = ref<ZigbeeCoordinator[]>([]);
// Pro Koordinator eigener lokal heruntergezählter Restsekunden-Wert.
const pairingState = ref<Record<number, number | null>>({});
const pairingBusyId = ref<number | "all" | null>(null);

const form = ref({
  mqtt_identifier: "",
  mqtt_topic_prefix: "",
  name: "",
  device_model_id: null as number | null,
  coordinator_id: null as number | null,
});
const modalOpen = ref(false);
const assignment = ref<Record<string, number | null>>({});
const initialSelectDone = ref(false);

const coordinatorModalOpen = ref(false);
const coordinatorSaving = ref(false);
const coordinatorForm = ref({ key: "", base_topic: "", label: "" });

let pollTimer: ReturnType<typeof setInterval> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

const coordinatorLabel = (id: number | null | undefined) => {
  if (id == null) return "Comet WiFi";
  const found = coordinators.value.find((c) => c.id === id);
  return found ? `${found.label} (${found.base_topic})` : `#${id}`;
};

// Der Backend-Fix erlaubt denselben mqtt_identifier bewusst an mehreren
// Koordinatoren gleichzeitig (das ist der ganze Zweck dieser Funktion) – die
// Auswahl-/Zuordnungs-Maps unten müssen deshalb auf (coordinator_id,
// mqtt_identifier) schlüsseln, sonst checkt/ordnet ein Klick auf "Buero_1"
// an Koordinator 1 versehentlich auch "Buero_1" an Koordinator 2 mit.
const deviceKey = (device: { coordinator_id?: number | null; mqtt_identifier: string }) =>
  `${device.coordinator_id ?? "-"}:${device.mqtt_identifier}`;

// Nur den Pairing-Status übernehmen. Achtung: dieses Objekt heißt
// "coordinator_id" statt "id" (anders als GET /heating/coordinators) –
// coordinators.value hier NICHT überschreiben, sonst brechen alle .id-Lookups
// (z. B. coordinatorLabel) auf den nächsten Poll hin.
const applyZigbeeCoordinators = (list?: ZigbeeCoordinatorStatus[]) => {
  if (!list) return;
  const next: Record<number, number | null> = {};
  for (const status of list) {
    next[status.coordinator_id] = status.permit_join
      ? (status.remaining_seconds ?? null)
      : null;
  }
  pairingState.value = next;
};

const applyDiscovery = (
  discovery: {
    devices: any[];
    mqtt_connected: boolean;
    zigbeeCoordinators?: ZigbeeCoordinatorStatus[];
  },
  { firstLoad = false } = {},
) => {
  const previousKeys = new Set(devices.value.map(deviceKey));
  devices.value = discovery.devices;
  mqttConnected.value = discovery.mqtt_connected;
  applyZigbeeCoordinators(discovery.zigbeeCoordinators);
  const next = { ...assignment.value };
  const newlyJoined: string[] = [];
  for (const device of discovery.devices) {
    const key = deviceKey(device);
    // Herstellerdaten kommen oft erst nach den ersten Zustandsnachrichten –
    // den Vorschlag deshalb nachziehen, solange niemand manuell gewählt hat.
    if (!manualAssignment.has(key)) {
      next[key] =
        device.device_model_id || next[key] || models.value[0]?.id || null;
    }
    if (!firstLoad && !previousKeys.has(key) && device.just_joined) {
      newlyJoined.push(key);
    }
  }
  assignment.value = next;
  if (firstLoad || !initialSelectDone.value) {
    selected.value = discovery.devices.map(deviceKey);
    initialSelectDone.value = true;
    return;
  }
  const visible = new Set(discovery.devices.map(deviceKey));
  selected.value = [
    ...new Set([
      ...selected.value.filter((id) => visible.has(id)),
      ...newlyJoined,
    ]),
  ];
};

// Manuell gewählte Modelle nicht vom Discovery-Vorschlag überschreiben.
const manualAssignment = new Set<string>();

const setAssignment = (identifier: string, modelId: number | null) => {
  manualAssignment.add(identifier);
  assignment.value = { ...assignment.value, [identifier]: modelId };
};

const load = async (scan = true, silent = false) => {
  if (!silent) loading.value = true;
  if (!silent || !models.value.length) {
    models.value = await heatingApi.getDeviceModels();
  }
  if (!silent) {
    entities.value = await heatingApi.getEntities();
    coordinators.value = await heatingApi.getCoordinators();
  }
  const discovery = scan
    ? await heatingApi.refreshDiscovery()
    : await heatingApi.getDiscovery();
  applyDiscovery(
    discovery || { devices: [], mqtt_connected: false, zigbeeCoordinators: [] },
    { firstLoad: !silent && !initialSelectDone.value },
  );
  if (!silent) loading.value = false;
};

// coordinatorId = null -> alle aktivierten Koordinatoren gleichzeitig öffnen/schließen.
const startPairing = async (coordinatorId: number | null, seconds = 120) => {
  pairingBusyId.value = coordinatorId ?? "all";
  const res = await heatingApi.setPermitJoin(seconds, coordinatorId);
  pairingBusyId.value = null;
  if (res?.zigbee_coordinators) applyZigbeeCoordinators(res.zigbee_coordinators);
  toast.add({
    title: "Zigbee-Anlernen aktiv",
    description:
      "Gerät in Pairing-Modus versetzen (meist Reset-Taste 3–10 Sekunden).",
    color: "primary",
  });
  await load(true, true);
};

const stopPairing = async (coordinatorId: number | null) => {
  pairingBusyId.value = coordinatorId ?? "all";
  const res = await heatingApi.setPermitJoin(0, coordinatorId);
  pairingBusyId.value = null;
  if (res?.zigbee_coordinators) applyZigbeeCoordinators(res.zigbee_coordinators);
};

const anyPairingActive = computed(() =>
  coordinators.value.some((c) => (pairingState.value[c.id] ?? 0) > 0),
);

const formatRemaining = (seconds: number | null | undefined) => {
  if (seconds == null || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

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
    const next = { ...pairingState.value };
    let changed = false;
    for (const id of Object.keys(next)) {
      const value = next[Number(id)];
      if (value == null || value <= 0) continue;
      next[Number(id)] = value - 1;
      changed = true;
    }
    if (changed) pairingState.value = next;
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
      assignment.value[deviceKey(device)] ||
      device.device_model_id ||
      models.value[0]?.id ||
      null,
    // Der Koordinator ist durch das Pairing physisch festgelegt – hier nur
    // übernommen, nicht frei wählbar.
    coordinator_id: device.coordinator_id ?? null,
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
    coordinator_id: form.value.coordinator_id,
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
  const chosen = devices.value.filter((d) => selected.value.includes(deviceKey(d)));
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
    device_model_id: assignment.value[deviceKey(d)] || d.device_model_id,
    coordinator_id: d.coordinator_id ?? null,
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

const removeEntity = async (entity: HeatingEntity) => {
  const ok = await confirm.confirm({
    title: "Gerät löschen?",
    message: `${entity.name} wird endgültig gelöscht, inklusive Verlauf und eigenem Zeitplan. Das Gerät taucht danach wieder unter den unregistrierten Geräten auf, solange es noch sendet.`,
    variant: "danger",
  });
  if (!ok) return;
  const res = await heatingApi.deleteEntity(entity.id);
  if (!res?.success) return;
  entities.value = entities.value.filter((e) => e.id !== entity.id);
  toast.add({ title: "Gerät gelöscht", description: "", color: "primary" });
  await load(false, true);
};

// --- Koordinatoren verwalten ---------------------------------------------

const openCreateCoordinator = () => {
  coordinatorForm.value = { key: "", base_topic: "", label: "" };
  coordinatorModalOpen.value = true;
};

const saveCoordinator = async () => {
  if (
    !coordinatorForm.value.key ||
    !coordinatorForm.value.base_topic ||
    !coordinatorForm.value.label
  ) {
    toast.add({
      title: "Bitte alle Felder ausfüllen",
      description: "",
      color: "red",
    });
    return;
  }
  coordinatorSaving.value = true;
  const res = await heatingApi.createCoordinator(coordinatorForm.value);
  coordinatorSaving.value = false;
  if (!res?.data) return;
  coordinatorModalOpen.value = false;
  coordinators.value = await heatingApi.getCoordinators();
  toast.add({
    title: "Koordinator angelegt",
    description: `Wird jetzt live abonniert: ${res.data.base_topic}/#`,
    color: "primary",
  });
};

const toggleCoordinatorEnabled = async (coordinator: ZigbeeCoordinator) => {
  const res = await heatingApi.updateCoordinator(coordinator.id, {
    enabled: !coordinator.enabled,
  });
  if (res?.data) coordinators.value = await heatingApi.getCoordinators();
};

const removeCoordinator = async (coordinator: ZigbeeCoordinator) => {
  const res = await heatingApi.deleteCoordinator(coordinator.id);
  if (res?.success) {
    coordinators.value = await heatingApi.getCoordinators();
    toast.add({
      title: "Koordinator gelöscht",
      description: "",
      color: "primary",
    });
  }
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

    <div class="mb-6 border border-neutral-200 p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold">Zigbee-Koordinatoren</h2>
        <div class="flex gap-2">
          <UiButton
            v-if="coordinators.length > 1"
            size="xs"
            variant="outline"
            :loading="pairingBusyId === 'all'"
            :disabled="!mqttConnected"
            @click="
              anyPairingActive ? stopPairing(null) : startPairing(null)
            "
          >
            {{ anyPairingActive ? "Alle beenden" : "Alle 2 Min. anlernen" }}
          </UiButton>
          <UiButton size="xs" icon="i-lucide-plus" @click="openCreateCoordinator">
            Koordinator hinzufügen
          </UiButton>
        </div>
      </div>

      <p v-if="!coordinators.length" class="text-sm text-neutral-500">
        Noch kein Zigbee-Koordinator angelegt. Jede zusätzliche
        zigbee2mqtt-Instanz auf dem Server bekommt hier einen eigenen Eintrag
        (Base-Topic, z. B. „zigbee2mqtt_Haus9“).
      </p>

      <div v-else class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="coordinator in coordinators"
          :key="coordinator.id"
          class="border p-3"
          :class="
            (pairingState[coordinator.id] ?? 0) > 0
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-neutral-200'
          "
        >
          <div class="mb-1 flex items-center justify-between gap-2">
            <div>
              <p class="text-sm font-medium text-neutral-900">
                {{ coordinator.label }}
              </p>
              <p class="font-mono text-xs text-neutral-500">
                {{ coordinator.base_topic }}
              </p>
            </div>
            <span
              v-if="!coordinator.enabled"
              class="border border-neutral-300 px-1.5 py-0.5 text-xs text-neutral-500"
            >
              Deaktiviert
            </span>
          </div>

          <p class="mb-2 text-xs text-neutral-600">
            <template v-if="(pairingState[coordinator.id] ?? 0) > 0">
              Netzwerk offen — noch
              {{ formatRemaining(pairingState[coordinator.id]) }}
            </template>
            <template v-else> Netzwerk geschlossen </template>
          </p>

          <div class="flex flex-wrap gap-2">
            <UiButton
              v-if="(pairingState[coordinator.id] ?? 0) > 0"
              size="xs"
              variant="outline"
              :loading="pairingBusyId === coordinator.id"
              @click="stopPairing(coordinator.id)"
            >
              Anlernen beenden
            </UiButton>
            <UiButton
              v-else
              size="xs"
              icon="i-lucide-radio"
              :loading="pairingBusyId === coordinator.id"
              :disabled="!mqttConnected || !coordinator.enabled"
              @click="startPairing(coordinator.id)"
            >
              2 Min. anlernen
            </UiButton>
            <button
              type="button"
              class="text-xs text-neutral-500 underline"
              @click="toggleCoordinatorEnabled(coordinator)"
            >
              {{ coordinator.enabled ? "deaktivieren" : "aktivieren" }}
            </button>
            <button
              type="button"
              class="text-xs text-red-600 underline"
              @click="removeCoordinator(coordinator)"
            >
              löschen
            </button>
          </div>
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
      Keine unregistrierten Geräte. Für Zigbee zuerst an einem Koordinator
      „anlernen“ starten; Comet WiFi erscheint, sobald MQTT-Nachrichten
      ankommen.
    </p>

    <UiTable
      v-else
      class="mb-10"
      :columns="[
        { id: 'select', header: '' },
        { accessorKey: 'mqtt_identifier', header: 'Identifier' },
        { id: 'coordinator', header: 'Koordinator' },
        { id: 'status', header: 'Status' },
        { id: 'model', header: 'Hersteller / Modell' },
        { id: 'actions', header: '' },
      ]"
      :data="devices"
    >
      <template #select-cell="{ row }">
        <input
          type="checkbox"
          :checked="selected.includes(deviceKey(row.original))"
          @change="
            toggle(
              deviceKey(row.original),
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
      <template #coordinator-cell="{ row }">
        <span class="text-xs text-neutral-600">{{
          coordinatorLabel(row.original.coordinator_id)
        }}</span>
      </template>
      <template #status-cell="{ row }">
        <span class="text-xs text-neutral-600">{{
          interviewLabel(row.original) || "—"
        }}</span>
      </template>
      <template #model-cell="{ row }">
        <HeatingModelPicker
          :models="models"
          :model-value="assignment[deviceKey(row.original)]"
          @update:model-value="setAssignment(deviceKey(row.original), $event)"
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
        { id: 'coordinator', header: 'Koordinator' },
        { id: 'status', header: 'Status' },
        { id: 'battery', header: 'Batterie' },
        { accessorKey: 'mqtt_identifier', header: 'Identifier' },
        { id: 'actions', header: '' },
      ]"
      :data="entities"
    >
      <template #actions-cell="{ row }">
        <button
          type="button"
          class="text-neutral-400 hover:text-red-600"
          aria-label="Gerät löschen"
          @click="removeEntity(row.original)"
        >
          <UiIcon name="i-lucide-trash-2" class="size-4" />
        </button>
      </template>
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
      <template #coordinator-cell="{ row }">
        <span class="text-xs text-neutral-600">{{
          coordinatorLabel(row.original.coordinator_id)
        }}</span>
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
        <template v-if="form.coordinator_id != null">
          <label class="dialog-label">Zigbee-Koordinator</label>
          <p class="dialog-input mb-3 bg-neutral-50 text-neutral-600">
            {{ coordinatorLabel(form.coordinator_id) }}
          </p>
          <p class="mb-3 text-xs text-neutral-500">
            Durch das Anlernen an diesem Koordinator festgelegt. Ändern Sie
            das nach dem Speichern über die Geräteseite, falls es umgehängt
            werden soll.
          </p>
        </template>
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

    <UiModal
      v-model:open="coordinatorModalOpen"
      title="Zigbee-Koordinator hinzufügen"
      max-width="md"
    >
      <template #body>
        <label class="dialog-label">Bezeichnung</label>
        <input
          v-model="coordinatorForm.label"
          class="dialog-input mb-3"
          placeholder="z. B. Haus 9"
        />
        <label class="dialog-label">Base-Topic</label>
        <input
          v-model="coordinatorForm.base_topic"
          class="dialog-input mb-3 font-mono"
          placeholder="z. B. zigbee2mqtt_Haus9"
        />
        <label class="dialog-label">Interner Schlüssel</label>
        <input
          v-model="coordinatorForm.key"
          class="dialog-input mb-3"
          placeholder="z. B. z2m-haus9"
        />
        <p class="text-xs text-neutral-500">
          Entspricht dem Namen der zigbee2mqtt-Instanz, die auf dem Server für
          diesen Koordinator läuft.
        </p>
      </template>
      <template #footer>
        <button
          class="btn-dialog-cancel"
          type="button"
          @click="coordinatorModalOpen = false"
        >
          Abbrechen
        </button>
        <button
          class="btn-dialog-primary"
          type="button"
          :disabled="coordinatorSaving"
          @click="saveCoordinator"
        >
          Anlegen
        </button>
      </template>
    </UiModal>
  </div>
</template>
