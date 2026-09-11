<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  normalizeHeatingLastState,
  type HeatingEntity,
} from "~/composables/useHeatingApi";
import {
  buildingLabel,
  entityIsUnassigned,
  entityLocationLabel,
  isLegacyDefaultBuilding,
  roomLabel,
  roomsOfUnit,
  unitLabel,
  unitsOfBuilding,
  aggregateRoomState,
} from "~/utils/heatingRoom";

const heatingApi = useHeatingApi();
const route = useRoute();
const { role } = useAuth();
const confirm = useConfirm();
const toast = useToast();
const isAdminUser = computed(() => role.value === "admin");

// Aus der URL übernehmen, falls wir von einem Raum/Thermostat mit Kontext zurückkommen
const initialBuildingId = Number(route.query.building);
const initialUnitId = Number(route.query.unit);
const initialRoomId = Number(route.query.room);

const heatingHirarchy = ref<any[]>([]);
const selectedBuildingId = ref<number>(
  Number.isFinite(initialBuildingId) && initialBuildingId > 0 ? initialBuildingId : 1,
);
const selectedUnitId = ref<number | null>(
  Number.isFinite(initialUnitId) && initialUnitId > 0 ? initialUnitId : null,
);
const selectedRoomId = ref<number | null>(
  Number.isFinite(initialRoomId) && initialRoomId > 0 ? initialRoomId : null,
);

const selectedBuilding = computed(() => {
  return heatingHirarchy.value.find(
    (building) => building.id === selectedBuildingId.value,
  );
});

const selectedUnit = computed(() => {
  return unitsOfBuilding(selectedBuilding.value).find(
    (unit) => unit.id === selectedUnitId.value,
  );
});

const loadHierarchy = async () => {
  const hirachyResponse = await heatingApi.getHierarchy();
  heatingHirarchy.value = hirachyResponse.sort((a, b) => {
    return a.id - b.id;
  });
  if (!selectedBuilding.value && heatingHirarchy.value.length) {
    selectedBuildingId.value = heatingHirarchy.value[0].id;
  }
  if (!selectedUnit.value) {
    selectedUnitId.value = unitsOfBuilding(selectedBuilding.value)[0]?.id ?? null;
  }
};

// Beim Wechsel des Gebäudes auf dessen erste Einheit springen
watch(selectedBuildingId, () => {
  selectedUnitId.value = unitsOfBuilding(selectedBuilding.value)[0]?.id ?? null;
});

// Beim Wechsel der Einheit die Detailansicht eines Raums aus einer anderen Einheit schließen
watch(selectedUnitId, () => {
  selectedRoomId.value = null;
});

const selectRoom = (roomId: number) => {
  selectedRoomId.value = roomId;
};

const closeRoomDetail = () => {
  selectedRoomId.value = null;
};

// --- GEBÄUDE HINZUFÜGEN / BEARBEITEN ---

const buildingModalOpen = ref(false);
const buildingModalMode = ref<"create" | "edit">("create");
const editingBuildingId = ref<number | null>(null);
const buildingForm = ref({ name: "", number: "", notes: "" });

const buildingModalTitle = computed(() =>
  buildingModalMode.value === "edit" ? "Gebäude bearbeiten" : "Gebäude anlegen",
);

const openCreateBuilding = () => {
  buildingModalMode.value = "create";
  editingBuildingId.value = null;
  buildingForm.value = { name: "", number: "", notes: "" };
  buildingModalOpen.value = true;
};

const openEditBuilding = (building: any) => {
  buildingModalMode.value = "edit";
  editingBuildingId.value = building.id;
  buildingForm.value = {
    name: building.name || "",
    number: building.number || "",
    notes: building.notes || "",
  };
  buildingModalOpen.value = true;
};

const saveBuilding = async () => {
  const name = buildingForm.value.name.trim();
  if (!name) return;
  const payload = {
    name,
    number: buildingForm.value.number.trim() || undefined,
    notes: buildingForm.value.notes.trim() || undefined,
  };
  if (buildingModalMode.value === "edit" && editingBuildingId.value) {
    await heatingApi.updateBuilding(editingBuildingId.value, payload);
    buildingModalOpen.value = false;
    await loadHierarchy();
  } else {
    const res = await heatingApi.createBuilding(payload);
    buildingModalOpen.value = false;
    await loadHierarchy();
    if (res?.data?.id) selectedBuildingId.value = res.data.id;
  }
};

const removeBuilding = async (building: any) => {
  const ok = await confirm.confirm({
    title: "Gebäude löschen?",
    message: `${buildingLabel(building) || building.name} wird inklusive aller enthaltenen Einheiten und Räume gelöscht. Zugeordnete Thermostate bleiben erhalten, werden aber nicht mehr zugeordnet.`,
    variant: "danger",
  });
  if (!ok) return;
  await heatingApi.deleteBuilding(building.id);
  await loadHierarchy();
};

// --- NUTZUNGSEINHEIT HINZUFÜGEN / BEARBEITEN ---

const unitModalOpen = ref(false);
const unitModalMode = ref<"create" | "edit">("create");
const editingUnitId = ref<number | null>(null);
const unitForm = ref({ unit_number: "", name: "", notes: "", building_id: 0 });

const unitModalTitle = computed(() =>
  unitModalMode.value === "edit" ? "Einheit bearbeiten" : "Einheit anlegen",
);

const openCreateUnit = () => {
  unitModalMode.value = "create";
  editingUnitId.value = null;
  unitForm.value = {
    unit_number: "",
    name: "",
    notes: "",
    building_id: selectedBuildingId.value,
  };
  unitModalOpen.value = true;
};

const openEditUnit = (unit: any) => {
  unitModalMode.value = "edit";
  editingUnitId.value = unit.id;
  unitForm.value = {
    unit_number: unit.unit_number || "",
    name: unit.name || "",
    notes: unit.notes || "",
    building_id: unit.building_id,
  };
  unitModalOpen.value = true;
};

const saveUnit = async () => {
  const unitNumber = unitForm.value.unit_number.trim();
  const name = unitForm.value.name.trim();
  if (!unitNumber && !name) return;
  if (unitModalMode.value === "edit" && editingUnitId.value) {
    await heatingApi.updateUnit(editingUnitId.value, {
      building_id: unitForm.value.building_id,
      unit_number: unitNumber || null,
      name: name || unitNumber,
      notes: unitForm.value.notes.trim() || null,
    });
    unitModalOpen.value = false;
    await loadHierarchy();
  } else if (unitForm.value.building_id) {
    const res = await heatingApi.createUnit({
      building_id: unitForm.value.building_id,
      name: name || unitNumber,
      unit_number: unitNumber || undefined,
      notes: unitForm.value.notes.trim() || undefined,
    });
    unitModalOpen.value = false;
    await loadHierarchy();
    if (res?.data?.id) {
      selectedBuildingId.value = unitForm.value.building_id;
      // Nach dem Gebäudewechsel wartet der Watcher (setzt sonst die erste Einheit zurück)
      await nextTick();
      selectedUnitId.value = res.data.id;
    }
  }
};

const removeUnit = async (unit: any) => {
  const ok = await confirm.confirm({
    title: "Einheit löschen?",
    message: `${unitLabel(unit)} wird inklusive aller enthaltenen Räume gelöscht. Zugeordnete Thermostate bleiben erhalten, werden aber nicht mehr zugeordnet.`,
    variant: "danger",
  });
  if (!ok) return;
  await heatingApi.deleteUnit(unit.id);
  await loadHierarchy();
};

// --- RAUM HINZUFÜGEN / BEARBEITEN ---

const roomModalOpen = ref(false);
const roomModalMode = ref<"create" | "edit">("create");
const editingRoomId = ref<number | null>(null);
const roomForm = ref({ name: "", room_number: "", notes: "", unit_id: 0 });

const openCreateRoom = () => {
  roomModalMode.value = "create";
  editingRoomId.value = null;
  roomForm.value = {
    name: "",
    room_number: "",
    notes: "",
    unit_id: selectedUnitId.value || 0,
  };
  roomModalOpen.value = true;
};

const openEditRoom = (room: any) => {
  roomModalMode.value = "edit";
  editingRoomId.value = room.id;
  roomForm.value = {
    name: room.name && room.name !== room.room_number ? room.name : "",
    room_number: room.room_number || room.name || "",
    notes: room.notes || "",
    unit_id: room.unit_id,
  };
  roomModalOpen.value = true;
};

const roomModalTitle = computed(() =>
  roomModalMode.value === "edit" ? "Raum bearbeiten" : "Raum anlegen",
);

const saveRoom = async () => {
  const roomNumber = roomForm.value.room_number.trim();
  if (!roomNumber) return;
  if (roomModalMode.value === "edit" && editingRoomId.value) {
    await heatingApi.updateRoom(editingRoomId.value, {
      unit_id: roomForm.value.unit_id,
      room_number: roomNumber,
      name: roomForm.value.name.trim() || roomNumber,
      notes: roomForm.value.notes.trim() || null,
    });
  } else if (roomForm.value.unit_id) {
    await heatingApi.createRoom({
      unit_id: roomForm.value.unit_id,
      room_number: roomNumber,
      name: roomForm.value.name.trim() || undefined,
      notes: roomForm.value.notes.trim() || undefined,
    });
  }
  roomModalOpen.value = false;
  await loadHierarchy();
};

const removeRoom = async (room: any) => {
  const ok = await confirm.confirm({
    title: "Raum löschen?",
    message: `Raum ${roomLabel(room)} wird gelöscht. Zugeordnete Thermostate bleiben erhalten, werden aber nicht mehr zugeordnet.`,
    variant: "danger",
  });
  if (!ok) return;
  await heatingApi.deleteRoom(room.id);
  if (selectedRoomId.value === room.id) selectedRoomId.value = null;
  await loadHierarchy();
};

onMounted(() => {
  loadHierarchy();
});
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
      Heizungssteuerung
    </h1>

    <div class="flex items-center mt-4 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
      <span
        v-for="building in heatingHirarchy"
        :key="building.id"
        :class="
          selectedBuildingId == building.id
            ? 'border-brand-accent'
            : 'border-transparent'
        "
        class="py-2 px-4 border-b-2 hover:cursor-pointer flex items-center gap-2 shrink-0 group"
        @click="selectedBuildingId = building.id"
      >
        {{ buildingLabel(building) || building.name }}
        <IconEdit
          v-if="isAdminUser"
          class="w-3 h-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:cursor-pointer"
          @click.stop="openEditBuilding(building)"
        />
        <IconTrash
          v-if="isAdminUser"
          class="w-3 h-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:cursor-pointer hover:text-red-600"
          @click.stop="removeBuilding(building)"
        />
      </span>
      <span
        v-if="isAdminUser"
        class="py-2 px-4 hover:cursor-pointer text-neutral-400 flex items-center gap-2 shrink-0"
        @click="openCreateBuilding"
      >
        <IconAdd class="w-2 h-2" />
        Gebäude hinzufügen
      </span>
    </div>

    <div v-if="selectedBuilding" class="grid grid-cols-1 lg:grid-cols-6 gap-4 mt-4">
      <!-- Einheiten: 1/3, bei geöffnetem Raum auf 1/6 verkleinert -->
      <div
        :class="[
          selectedRoomId ? 'lg:col-span-1' : 'lg:col-span-2',
          selectedRoomId ? 'hidden lg:block' : 'block',
        ]"
      >
        <div
          class="flex flex-col border border-neutral-200 rounded-xl divide-y divide-neutral-200 bg-white z-20 relative overflow-hidden"
        >
          <div
            v-for="unit in unitsOfBuilding(selectedBuilding)"
            :key="unit.id"
            class="py-3 px-4 flex items-center justify-between hover:cursor-pointer hover:bg-neutral-50"
            :class="selectedUnitId == unit.id ? 'bg-neutral-100' : ''" 
            @click="selectedUnitId = unit.id"
          >
            <div class="flex flex-col">
              <span class="flex items-center gap-2 group text-sm">
                Einheit {{ unitLabel(unit) }}
                <IconEdit
                  v-if="isAdminUser"
                  class="w-3 h-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:cursor-pointer"
                  @click.stop="openEditUnit(unit)"
                />
                <IconTrash
                  v-if="isAdminUser"
                  class="w-3 h-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:cursor-pointer hover:text-red-600"
                  @click.stop="removeUnit(unit)"
              /></span>
              <span class="text-xs text-neutral-400">{{
                (unit.rooms || []).length > 0
                  ? (unit.rooms || []).length + " Räume"
                  : "Keine Räume angelegt"
              }}</span>
            </div>

            <span class="text-neutral-300 text-lg">›</span>
          </div>
        </div>

        <div
          v-if="isAdminUser"
          class="bg-neutral-200 pt-3 pb-2 px-4 rounded-b-xl -top-2 relative z-10"
        >
          <span
            class="text-neutral-500 text-xs flex items-center gap-1 hover:cursor-pointer"
            @click="openCreateUnit"
            ><IconAdd class="w-2 h-2" />Einheit hinzufügen</span
          >
        </div>
      </div>

      <!-- Räume der gewählten Einheit: 2/3, bei geöffnetem Raum auf 1/6 verkleinert -->
      <div
        :class="[
          selectedRoomId ? 'lg:col-span-1' : 'lg:col-span-4',
          selectedRoomId ? 'hidden lg:block' : 'block',
        ]"
      >
        <template v-if="selectedUnit">
          <div
            class="flex flex-col border border-neutral-200 rounded-xl divide-y divide-neutral-200 bg-white z-20 relative overflow-hidden"
          >
            <p
              v-if="!roomsOfUnit(selectedUnit).length"
              class="py-3 px-4 text-sm text-neutral-500"
            >
              Noch keine Räume in dieser Einheit.
            </p>
            <div
              v-for="room in roomsOfUnit(selectedUnit)"
              :key="room.id"
              class="py-3 px-4 flex items-center justify-between hover:cursor-pointer hover:bg-neutral-50"
              :class="room.id == selectedRoomId ? 'bg-neutral-100' : ''"
              @click="selectRoom(room.id)"
            >
              <div class="flex flex-col">
                <span class="flex items-center gap-2 group text-sm">
                  Raum {{ roomLabel(room) }}
                  <IconEdit
                    v-if="isAdminUser"
                    class="w-3 h-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:cursor-pointer"
                    @click.stop="openEditRoom(room)"
                  />
                  <IconTrash
                    v-if="isAdminUser"
                    class="w-3 h-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:cursor-pointer hover:text-red-600"
                    @click.stop="removeRoom(room)"
                /></span>
                <span class="text-xs text-neutral-400">{{
                  room.entities.length > 0
                    ? room.entities.length + " Thermostate"
                    : "Keine Thermostate zugewiesen"
                }}</span>
              </div>

              <div class="flex gap-2 items-center">
                <div class="flex flex-col items-end">
                  <span class="text-lg font-bold">
                    {{
                      aggregateRoomState(room.entities).lastState.current_temperature ? aggregateRoomState(room.entities).lastState.current_temperature + '°' : '–'
                    }}
                  </span>
                  <span class="text-xs text-neutral-400">IST</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="isAdminUser"
            class="bg-neutral-200 pt-3 pb-2 px-4 rounded-b-xl -top-2 relative z-10"
          >
            <span
              class="text-neutral-500 text-xs flex items-center gap-1 hover:cursor-pointer"
              @click="openCreateRoom"
              ><IconAdd class="w-2 h-2" />Raum hinzufügen</span
            >
          </div>
        </template>
        <p v-else class="text-sm text-neutral-500">Wähle links eine Einheit aus.</p>
      </div>

      <!-- Thermostatansicht des gewählten Raums: 4/6 -->
      <div v-if="selectedRoomId" class="lg:col-span-4 border border-neutral-200 rounded-xl p-4">
        <button
          type="button"
          class="lg:hidden mb-4 inline-flex text-sm text-neutral-500 hover:text-neutral-800"
          @click="closeRoomDetail"
        >
          ← Zurück zu den Räumen
        </button>
        <HeatingRoomDetailPanel :room-id="selectedRoomId" @close="closeRoomDetail" />
      </div>
    </div>

    <UiModal v-model:open="buildingModalOpen" :title="buildingModalTitle">
      <template #body>
        <label class="dialog-label">Nummer</label>
        <input
          v-model="buildingForm.number"
          class="dialog-input mb-3"
          placeholder="z. B. 301.09"
        />
        <label class="dialog-label">Name</label>
        <input v-model="buildingForm.name" class="dialog-input mb-3" placeholder="z. B. Haus 9" />
        <label class="dialog-label">Bemerkung</label>
        <textarea
          v-model="buildingForm.notes"
          class="dialog-input"
          rows="3"
          placeholder="Freie Notizen zu diesem Gebäude..."
        />
      </template>
      <template #footer>
        <button class="btn-dialog-cancel" type="button" @click="buildingModalOpen = false">
          Abbrechen
        </button>
        <button class="btn-dialog-primary" type="button" @click="saveBuilding">
          Speichern
        </button>
      </template>
    </UiModal>

    <UiModal v-model:open="unitModalOpen" :title="unitModalTitle">
      <template #body>
        <label class="dialog-label">Gebäude</label>
        <select v-model.number="unitForm.building_id" class="dialog-input mb-3">
          <option v-for="building in heatingHirarchy" :key="building.id" :value="building.id">
            {{ buildingLabel(building) || building.name }}
          </option>
        </select>
        <label class="dialog-label">Nummer</label>
        <input
          v-model="unitForm.unit_number"
          class="dialog-input mb-3"
          placeholder="z. B. 001"
        />
        <label class="dialog-label">Bezeichnung</label>
        <input
          v-model="unitForm.name"
          class="dialog-input mb-3"
          placeholder="z. B. EG, links"
        />
        <label class="dialog-label">Bemerkung</label>
        <textarea
          v-model="unitForm.notes"
          class="dialog-input"
          rows="3"
          placeholder="Freie Notizen zu dieser Einheit..."
        />
      </template>
      <template #footer>
        <button class="btn-dialog-cancel" type="button" @click="unitModalOpen = false">
          Abbrechen
        </button>
        <button class="btn-dialog-primary" type="button" @click="saveUnit">
          Speichern
        </button>
      </template>
    </UiModal>

    <UiModal v-model:open="roomModalOpen" :title="roomModalTitle">
      <template #body>
        <label class="dialog-label">Einheit</label>
        <select v-model.number="roomForm.unit_id" class="dialog-input mb-3">
          <optgroup
            v-for="building in heatingHirarchy"
            :key="building.id"
            :label="buildingLabel(building) || building.name"
          >
            <option v-for="unit in unitsOfBuilding(building)" :key="unit.id" :value="unit.id">
              {{ unitLabel(unit) }}
            </option>
          </optgroup>
        </select>
        <label class="dialog-label">Raumnummer</label>
        <input
          v-model="roomForm.room_number"
          class="dialog-input mb-3"
          placeholder="z. B. 104"
        />
        <label class="dialog-label">Name (optional)</label>
        <input v-model="roomForm.name" class="dialog-input mb-3" placeholder="z. B. Büro" />
        <label class="dialog-label">Bemerkung</label>
        <textarea
          v-model="roomForm.notes"
          class="dialog-input"
          rows="3"
          placeholder="Freie Notizen zu diesem Raum..."
        />
      </template>
      <template #footer>
        <button class="btn-dialog-cancel" type="button" @click="roomModalOpen = false">
          Abbrechen
        </button>
        <button class="btn-dialog-primary" type="button" @click="saveRoom">
          Speichern
        </button>
      </template>
    </UiModal>
  </div>
</template>
