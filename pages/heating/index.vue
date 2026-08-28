<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
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
  roomsOfBuilding,
  visibleRoomsOfBuilding,
} from "~/utils/heatingRoom";

const heatingApi = useHeatingApi();
const { role } = useAuth();
const confirm = useConfirm();
const toast = useToast();
const isAdminUser = computed(() => role.value === "admin");

const loading = ref(false);
const buildings = ref<any[]>([]);
const allEntities = ref<HeatingEntity[]>([]);

const modalOpen = ref(false);
const modalKind = ref<"building" | "room">("building");
const modalMode = ref<"create" | "edit">("create");
const modalParentId = ref<number | null>(null);
const editingId = ref<number | null>(null);
const form = ref({
  name: "",
  number: "",
  address: "",
  room_number: "",
});

const assignRoomId = ref<number | null>(null);
const selectedIds = ref<number[]>([]);
const assigning = ref(false);

const assignRoom = computed(() => {
  if (assignRoomId.value == null) return null;
  for (const building of buildings.value) {
    for (const room of roomsOfBuilding(building)) {
      if (room.id === assignRoomId.value) return room;
    }
  }
  return null;
});

const assignModalOpen = computed({
  get: () => assignRoomId.value != null,
  set: (open: boolean) => {
    if (!open) {
      assignRoomId.value = null;
      selectedIds.value = [];
    }
  },
});

const load = async (full = true) => {
  if (full) loading.value = true;
  buildings.value = await heatingApi.getHierarchy();
  if (isAdminUser.value) {
    allEntities.value = await heatingApi.getEntities();
  }
  if (full) loading.value = false;
};

let pollTimer: ReturnType<typeof setInterval> | null = null;

const savingRoomIds = ref(new Set<number>());

const eachRoom = (fn: (building: any, room: any) => void) => {
  for (const building of buildings.value) {
    for (const room of roomsOfBuilding(building)) {
      fn(building, room);
    }
  }
};

const applyEntityUpdate = (updated: Record<string, any>) => {
  eachRoom((_building, room) => {
    const list = room.entities || [];
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
  });
  const idx = allEntities.value.findIndex((entity) => entity.id === updated.id);
  if (idx < 0) return;
  const current = allEntities.value[idx];
  allEntities.value[idx] = {
    ...current,
    ...updated,
    last_state: {
      ...normalizeHeatingLastState(current.last_state),
      ...normalizeHeatingLastState(updated.last_state),
    },
  };
};

const onRoomThermostatChange = async (
  room: any,
  key: string,
  value: unknown,
) => {
  const previous = (room.entities || []).map((entity: any) => ({
    id: entity.id,
    value: normalizeHeatingLastState(entity.last_state)[key],
  }));
  savingRoomIds.value = new Set(savingRoomIds.value).add(room.id);
  for (const entity of room.entities || []) {
    applyEntityUpdate({
      id: entity.id,
      last_state: { [key]: value },
    });
  }
  const res = await heatingApi.setRoomCapability(room.id, key, value);
  if (res?.data?.entities) {
    for (const entity of res.data.entities) applyEntityUpdate(entity);
  } else {
    for (const item of previous) {
      applyEntityUpdate({
        id: item.id,
        last_state: { [key]: item.value },
      });
    }
  }
  const next = new Set(savingRoomIds.value);
  next.delete(room.id);
  savingRoomIds.value = next;
};

const visibleBuildings = computed(() =>
  buildings.value.filter((building) => !isLegacyDefaultBuilding(building)),
);

const pickerItems = computed(() => {
  const roomId = assignRoomId.value;
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

const openAssign = (room: any) => {
  assignRoomId.value = room.id;
  selectedIds.value = (room.entities || []).map((entity: any) => entity.id);
};

const togglePickerId = (id: number) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
    return;
  }
  selectedIds.value = [...selectedIds.value, id];
};

const assignSelected = async () => {
  const room = assignRoom.value;
  if (!room) return;
  assigning.value = true;
  const res = await heatingApi.assignEntitiesToRoom(room.id, selectedIds.value, {
    replace: true,
  });
  assigning.value = false;
  if (!res?.data) return;
  const count = selectedIds.value.length;
  selectedIds.value = [];
  assignRoomId.value = null;
  await load(false);
  toast.add({
    title:
      count === 1 ? "1 Thermostat zugeordnet" : `${count} Thermostate zugeordnet`,
    color: "primary",
  });
};

onMounted(() => {
  load(true);
  pollTimer = setInterval(() => {
    if (savingRoomIds.value.size || assigning.value) {
      return;
    }
    load(false);
  }, 15000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

const openCreate = (
  kind: "building" | "room",
  parentId: number | null = null,
) => {
  modalKind.value = kind;
  modalMode.value = "create";
  modalParentId.value = parentId;
  editingId.value = null;
  form.value = { name: "", number: "", address: "", room_number: "" };
  modalOpen.value = true;
};

const openEditBuilding = (building: any) => {
  modalKind.value = "building";
  modalMode.value = "edit";
  editingId.value = building.id;
  form.value = {
    name: building.name || "",
    number: building.number || "",
    address: building.address || "",
    room_number: "",
  };
  modalOpen.value = true;
};

const openEditRoom = (room: any) => {
  modalKind.value = "room";
  modalMode.value = "edit";
  editingId.value = room.id;
  form.value = {
    name: room.name && room.name !== room.room_number ? room.name : "",
    number: "",
    address: "",
    room_number: room.room_number || room.name || "",
  };
  modalOpen.value = true;
};

const modalTitle = computed(() => {
  if (modalKind.value === "building") {
    return modalMode.value === "edit"
      ? "Gebäude bearbeiten"
      : "Gebäude anlegen";
  }
  return modalMode.value === "edit" ? "Raum bearbeiten" : "Raum anlegen";
});

const saveModal = async () => {
  if (modalKind.value === "building") {
    if (!form.value.name.trim()) return;
    const payload = {
      name: form.value.name.trim(),
    };
    if (modalMode.value === "edit" && editingId.value) {
      await heatingApi.updateBuilding(editingId.value, payload);
    } else {
      await heatingApi.createBuilding(payload);
    }
  } else if (modalKind.value === "room") {
    const roomNumber = form.value.room_number.trim();
    if (!roomNumber) return;
    if (modalMode.value === "edit" && editingId.value) {
      await heatingApi.updateRoom(editingId.value, {
        room_number: roomNumber,
        name: form.value.name.trim() || roomNumber,
      });
    } else if (modalParentId.value) {
      await heatingApi.createRoom({
        building_id: modalParentId.value,
        room_number: roomNumber,
        name: form.value.name.trim() || undefined,
      });
    }
  }
  modalOpen.value = false;
  await load();
};

const removeBuilding = async (building: any) => {
  const ok = await confirm.confirm({
    title: "Gebäude löschen?",
    message: `${buildingLabel(building)} und alle enthaltenen Räume werden gelöscht.`,
    variant: "danger",
  });
  if (!ok) return;
  await heatingApi.deleteBuilding(building.id);
  await load();
};

const removeRoom = async (room: any) => {
  const ok = await confirm.confirm({
    title: "Raum löschen?",
    message: roomLabel(room),
    variant: "danger",
  });
  if (!ok) return;
  await heatingApi.deleteRoom(room.id);
  await load();
};

const buildingMenu = (building: any) => [
  {
    label: "Bearbeiten",
    icon: "i-lucide-pencil",
    onSelect: () => openEditBuilding(building),
  },
  {
    label: "Löschen",
    icon: "i-lucide-trash",
    color: "error",
    onSelect: () => removeBuilding(building),
  },
];

const roomMenu = (room: any) => [
  {
    label: "Bearbeiten",
    icon: "i-lucide-pencil",
    onSelect: () => openEditRoom(room),
  },
  {
    label: "Löschen",
    icon: "i-lucide-trash",
    color: "error",
    onSelect: () => removeRoom(room),
  },
];
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Heizung</h1>
    </div>

    <div
      v-if="loading && !buildings.length"
      class="space-y-8"
      aria-busy="true"
    >
      <section>
        <div class="mb-4 h-6 w-44 animate-pulse bg-neutral-200" />
        <div class="mb-3 h-5 w-24 animate-pulse bg-neutral-100" />
        <div class="flex flex-wrap items-start gap-3">
          <HeatingThermostatCardSkeleton />
          <div class="flex flex-wrap gap-2">
            <div
              v-for="n in 3"
              :key="n"
              class="h-[6.5rem] w-[7.5rem] animate-pulse border border-neutral-200 bg-neutral-50"
            />
          </div>
        </div>
      </section>
    </div>

    <div v-else class="space-y-10">
      <p
        v-if="!visibleBuildings.length"
        class="text-sm text-neutral-500"
      >
        <span v-if="isAdminUser">Noch keine Gebäude.</span>
        <span v-else>Ihnen sind noch keine Bereiche zugewiesen.</span>
      </p>

      <section
        v-for="building in visibleBuildings"
        :key="building.id"
        class="p-4 border border-neutral-200 rounded-lg"
      >
        <div class="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 class="font-semibold">{{ building.name }}</h2>
          </div>
          <div v-if="isAdminUser" class="flex items-center gap-1">
            <UiDropdownMenu
              :items="buildingMenu(building)"
              :ui="{ content: 'w-44' }"
            >
              <UiButton size="xs" variant="ghost" icon="i-lucide-ellipsis" />
            </UiDropdownMenu>
          </div>
        </div>

        <p
          v-if="!visibleRoomsOfBuilding(building).length"
          class="text-sm text-neutral-500"
        >
          Noch keine Räume.
          <button
            v-if="isAdminUser"
            type="button"
            class="underline"
            @click="openCreate('room', building.id)"
          >
            Raum anlegen
          </button>
        </p>

        <div class="space-y-8">
          <div
            v-for="room in visibleRoomsOfBuilding(building)"
            :key="room.id"
            class="border border-neutral-200 rounded-lg p-4"
          >
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div class="flex min-w-0 flex-wrap items-center gap-3">
                <NuxtLink
                  :to="`/heating/rooms/${room.id}`"
                  class="font-medium text-neutral-900 hover:underline"
                >
                  Raum {{ roomLabel(room) }}
                </NuxtLink>
              </div>
              <div v-if="isAdminUser" class="flex items-center gap-1">
                <UiDropdownMenu
                  :items="roomMenu(room)"
                  :ui="{ content: 'w-44' }"
                >
                  <UiButton
                    size="xs"
                    variant="ghost"
                    icon="i-lucide-ellipsis"
                  />
                </UiDropdownMenu>
              </div>
            </div>

            <div
              v-if="!(room.entities || []).length"
              class="text-sm text-neutral-500"
            >
              Keine Thermostate in diesem Raum.
              <button
                v-if="isAdminUser"
                type="button"
                class="underline"
                @click="openAssign(room)"
              >
                Thermostat hinzufügen
              </button>
            </div>
            <div v-else class="flex flex-wrap items-start gap-3">
              <HeatingRoomThermostatCard
                :room="room"
                :building="building"
                @change="
                  (key, value) => onRoomThermostatChange(room, key, value)
                "
              />
              <div class="grid grid-cols-4 gap-2">
                <HeatingThermostatTile
                  v-for="entity in room.entities"
                  :key="entity.id"
                  :entity="entity"
                />
                <button
                  v-if="isAdminUser"
                  type="button"
                  class="flex w-64 shrink-0 items-center justify-center border border-dashed border-neutral-300 p-2.5 text-center text-xs text-neutral-500 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-800"
                  @click="openAssign(room)"
                >
                  Thermostat hinzufügen
                </button>
              </div>
            </div>
          </div>
          <div
            v-if="isAdminUser"
            class="border border-neutral-200 rounded-lg p-4 border-dashed text-center hover:bg-neutral-50 hover:cursor-pointer"
            @click="openCreate('room', building.id)"
          >
            <button type="button" class="underline">Raum anlegen</button>
          </div>
        </div>
      </section>

      <div
        v-if="isAdminUser"
        class="border border-dashed border-neutral-200 rounded-lg p-4 text-center hover:bg-neutral-50 hover:cursor-pointer"
        @click="openCreate('building')"
      >
        <button type="button" class="underline">Gebäude hinzufügen</button>
      </div>
    </div>

    <UiModal
      v-model:open="assignModalOpen"
      :title="assignRoom ? `Geräte in „${roomLabel(assignRoom)}“` : 'Geräte'"
      description="Wählen Sie die Geräte aus, die diesem Raum zugeordnet sind."
      max-width="lg"
    >
      <template #body>
        <p v-if="!pickerItems.length" class="text-sm text-neutral-500">
          Keine Thermostate registriert. Lernen Sie zuerst Geräte an.
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
              @change="togglePickerId(item.id)"
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

    <UiModal v-model:open="modalOpen" :title="modalTitle">
      <template #body>
        <template v-if="modalKind === 'building'">
          <label class="dialog-label">Name</label>
          <input v-model="form.name" class="dialog-input" placeholder="z. B. Haus 2" />
        </template>
        <template v-else>
          <label class="dialog-label">Raumnummer</label>
          <input
            v-model="form.room_number"
            class="dialog-input mb-3"
            placeholder="z. B. 104"
          />
        </template>
      </template>
      <template #footer>
        <button
          class="btn-dialog-cancel"
          type="button"
          @click="modalOpen = false"
        >
          Abbrechen
        </button>
        <button class="btn-dialog-primary" type="button" @click="saveModal">
          Speichern
        </button>
      </template>
    </UiModal>

  </div>
</template>
