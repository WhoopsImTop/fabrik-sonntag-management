<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  buildingLabel,
  isLegacyDefaultBuilding,
  isLegacyDefaultRoom,
  roomLabel,
  visibleRoomsOfBuilding,
} from "~/utils/heatingRoom";

type TenantGrant = {
  id?: number;
  scope_type: string;
  scope_id: number;
};

type HeatingTenant = {
  id: number;
  username: string;
  name?: string;
  email: string;
  role: string;
  isActive: boolean;
  has_password?: boolean;
  grants: TenantGrant[];
};

const heatingApi = useHeatingApi();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const tenants = ref<HeatingTenant[]>([]);
const buildings = ref<any[]>([]);

const modalOpen = ref(false);
const modalMode = ref<"create" | "grants">("create");
const editingTenant = ref<HeatingTenant | null>(null);
const form = ref({
  name: "",
  email: "",
});
const selectedBuildingIds = ref<number[]>([]);
const selectedRoomIds = ref<number[]>([]);

const visibleBuildings = computed(() =>
  buildings.value.filter((building) => !isLegacyDefaultBuilding(building)),
);

const modalTitle = computed(() =>
  modalMode.value === "create" ? "Mieter einladen" : "Bereiche zuweisen",
);

const roomLocation = (roomId: number) => {
  for (const building of buildings.value) {
    for (const room of visibleRoomsOfBuilding(building)) {
      if (room.id === roomId) return { building, room };
    }
  }
  return null;
};

const tenantAccessLabels = (tenant: HeatingTenant) => {
  const buildingIds = new Set(
    (tenant.grants || [])
      .filter((grant) => grant.scope_type === "building")
      .map((grant) => grant.scope_id),
  );
  const labels: string[] = [];
  for (const grant of tenant.grants || []) {
    if (grant.scope_type === "building") {
      const building = buildings.value.find((item) => item.id === grant.scope_id);
      if (building && isLegacyDefaultBuilding(building)) continue;
      labels.push(building ? buildingLabel(building) : `Gebäude ${grant.scope_id}`);
      continue;
    }
    if (grant.scope_type === "room") {
      const found = roomLocation(grant.scope_id);
      if (found && buildingIds.has(found.building.id)) continue;
      if (
        found &&
        (isLegacyDefaultBuilding(found.building) || isLegacyDefaultRoom(found.room))
      ) {
        continue;
      }
      labels.push(
        found
          ? `${buildingLabel(found.building)} / ${roomLabel(found.room)}`
          : `Raum ${grant.scope_id}`,
      );
    }
  }
  return labels;
};

const grantsPayload = () => {
  const buildingSet = new Set(selectedBuildingIds.value);
  const grants: { scope_type: string; scope_id: number }[] = selectedBuildingIds.value.map(
    (id) => ({ scope_type: "building", scope_id: id }),
  );
  for (const roomId of selectedRoomIds.value) {
    const found = roomLocation(roomId);
    if (found && buildingSet.has(found.building.id)) continue;
    grants.push({ scope_type: "room", scope_id: roomId });
  }
  return grants;
};

const applyGrantsToSelection = (grants: TenantGrant[] = []) => {
  selectedBuildingIds.value = grants
    .filter((grant) => grant.scope_type === "building")
    .map((grant) => grant.scope_id);
  const buildingSet = new Set(selectedBuildingIds.value);
  selectedRoomIds.value = grants
    .filter((grant) => grant.scope_type === "room")
    .filter((grant) => {
      const found = roomLocation(grant.scope_id);
      return !found || !buildingSet.has(found.building.id);
    })
    .map((grant) => grant.scope_id);
};

const isBuildingGranted = (id: number) => selectedBuildingIds.value.includes(id);
const isRoomGranted = (id: number) => selectedRoomIds.value.includes(id);

const toggleBuilding = (building: any, checked: boolean) => {
  const roomIds = visibleRoomsOfBuilding(building).map((room: any) => room.id);
  if (checked) {
    if (!selectedBuildingIds.value.includes(building.id)) {
      selectedBuildingIds.value = [...selectedBuildingIds.value, building.id];
    }
    selectedRoomIds.value = selectedRoomIds.value.filter(
      (id) => !roomIds.includes(id),
    );
    return;
  }
  selectedBuildingIds.value = selectedBuildingIds.value.filter(
    (id) => id !== building.id,
  );
};

const toggleRoom = (room: any, checked: boolean) => {
  if (checked) {
    if (!selectedRoomIds.value.includes(room.id)) {
      selectedRoomIds.value = [...selectedRoomIds.value, room.id];
    }
    return;
  }
  selectedRoomIds.value = selectedRoomIds.value.filter((id) => id !== room.id);
};

const load = async () => {
  loading.value = true;
  const [tenantRows, hierarchy] = await Promise.all([
    heatingApi.getTenants(),
    heatingApi.getHierarchy(),
  ]);
  tenants.value = tenantRows;
  buildings.value = hierarchy;
  loading.value = false;
};

onMounted(load);

const openCreate = () => {
  modalMode.value = "create";
  editingTenant.value = null;
  form.value = { name: "", email: "" };
  selectedBuildingIds.value = [];
  selectedRoomIds.value = [];
  modalOpen.value = true;
};

const openGrants = (tenant: HeatingTenant) => {
  modalMode.value = "grants";
  editingTenant.value = tenant;
  applyGrantsToSelection(tenant.grants);
  modalOpen.value = true;
};

const saveModal = async () => {
  saving.value = true;
  if (modalMode.value === "create") {
    const name = form.value.name.trim();
    const email = form.value.email.trim();
    if (!name || !email) {
      saving.value = false;
      return;
    }
    const res = await heatingApi.createTenant({
      name,
      email,
      grants: grantsPayload(),
    });
    saving.value = false;
    if (!res?.data) return;
    toast.add({
      title: res.invite_sent
        ? "Einladung gesendet"
        : "Mieter angelegt, E-Mail konnte nicht gesendet werden",
      color: res.invite_sent ? "primary" : "warning",
    });
  } else if (editingTenant.value) {
    const res = await heatingApi.replaceTenantGrants(
      editingTenant.value.id,
      grantsPayload(),
    );
    saving.value = false;
    if (!res?.data) return;
    toast.add({ title: "Zuweisung gespeichert", color: "primary" });
  } else {
    saving.value = false;
    return;
  }
  modalOpen.value = false;
  await load();
};

const toggleActive = async (tenant: HeatingTenant) => {
  const res = await heatingApi.updateTenant(tenant.id, {
    isActive: !tenant.isActive,
  });
  if (!res?.data) return;
  toast.add({
    title: tenant.isActive ? "Konto deaktiviert" : "Konto aktiviert",
    color: "primary",
  });
  await load();
};

const onBuildingChange = (building: any, event: Event) => {
  const target = event.target as HTMLInputElement;
  toggleBuilding(building, target.checked);
};

const onRoomChange = (room: any, event: Event) => {
  const target = event.target as HTMLInputElement;
  toggleRoom(room, target.checked);
};

const tenantLabel = (tenant: HeatingTenant) =>
  tenant.name || tenant.username || tenant.email;

const resendInvite = async (tenant: HeatingTenant) => {
  const res = await heatingApi.inviteTenant(tenant.id);
  if (!res) return;
  toast.add({ title: "Einladung erneut gesendet", color: "primary" });
};

const tenantMenu = (tenant: HeatingTenant) => [
  {
    label: "Bereiche zuweisen",
    icon: "i-lucide-building-2",
    onSelect: () => openGrants(tenant),
  },
  {
    label: "Einladung senden",
    icon: "i-lucide-mail",
    onSelect: () => resendInvite(tenant),
  },
  {
    label: tenant.isActive ? "Deaktivieren" : "Aktivieren",
    icon: tenant.isActive ? "i-lucide-user-x" : "i-lucide-user-check",
    color: tenant.isActive ? "error" : undefined,
    onSelect: () => toggleActive(tenant),
  },
];
</script>

<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">Mieter</h1>
        <p class="mt-1 text-sm text-neutral-500">
          Legen Sie Heizungs-Mieter an. Sie erhalten eine E-Mail, um selbst ein Passwort zu vergeben.
        </p>
      </div>
      <UiButton icon="i-lucide-plus" @click="openCreate">
        Mieter einladen
      </UiButton>
    </div>

    <p v-if="loading && !tenants.length" class="text-sm text-neutral-500">
      Lädt…
    </p>
    <p v-else-if="!tenants.length" class="text-sm text-neutral-500">
      Noch keine Mieter. Laden Sie den ersten Zugang per E-Mail ein.
    </p>
    <UiTable
      v-else
      :loading="loading"
      :columns="[
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'email', header: 'E-Mail' },
        { id: 'access', header: 'Bereiche' },
        { id: 'status', header: 'Status' },
        { id: 'actions', header: '' },
      ]"
      :data="tenants"
    >
      <template #name-cell="{ row }">
        <span class="font-medium">{{ tenantLabel(row.original) }}</span>
      </template>
      <template #email-cell="{ row }">
        <a
          :href="`mailto:${row.original.email}`"
          class="text-brand-accent hover:underline"
        >
          {{ row.original.email }}
        </a>
      </template>
      <template #access-cell="{ row }">
        <span
          v-if="!tenantAccessLabels(row.original).length"
          class="text-neutral-400"
        >
          Keine Zuweisung
        </span>
        <span v-else class="flex flex-wrap gap-1">
          <span
            v-for="label in tenantAccessLabels(row.original)"
            :key="label"
            class="border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-xs text-neutral-700"
          >
            {{ label }}
          </span>
        </span>
      </template>
      <template #status-cell="{ row }">
        <span
          v-if="!row.original.isActive"
          class="text-neutral-400"
        >
          Deaktiviert
        </span>
        <span
          v-else-if="!row.original.has_password"
          class="text-amber-700"
        >
          Einladung ausstehend
        </span>
        <span v-else class="text-emerald-700">Aktiv</span>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UiDropdownMenu
            :items="tenantMenu(row.original)"
            :ui="{ content: 'w-48' }"
          >
            <UiButton size="xs" variant="ghost" icon="i-lucide-ellipsis" />
          </UiDropdownMenu>
        </div>
      </template>
    </UiTable>

    <UiModal v-model:open="modalOpen" :title="modalTitle" max-width="lg">
      <template #body>
        <template v-if="modalMode === 'create'">
          <label class="dialog-label">Name</label>
          <input
            v-model="form.name"
            class="dialog-input mb-3"
            autocomplete="off"
            placeholder="z. B. Müller"
          />
          <label class="dialog-label">E-Mail</label>
          <input
            v-model="form.email"
            type="email"
            class="dialog-input mb-4"
            autocomplete="off"
            placeholder="mieter@example.com"
          />
          <p class="mb-4 text-xs text-neutral-500">
            Der Mieter erhält eine E-Mail mit einem Link, über den er selbst ein Passwort vergibt.
          </p>
        </template>
        <p v-if="modalMode === 'grants' && editingTenant" class="mb-3 text-sm text-neutral-600">
          {{ tenantLabel(editingTenant) }} ({{ editingTenant.email }})
        </p>
        <p class="dialog-label">Gebäude und Räume</p>
        <p v-if="!visibleBuildings.length" class="text-sm text-neutral-500">
          Noch keine Gebäude angelegt.
        </p>
        <div v-else class="max-h-80 space-y-3 overflow-y-auto">
          <div
            v-for="building in visibleBuildings"
            :key="building.id"
            class="border border-neutral-200 px-3 py-2.5"
          >
            <label class="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                class="mt-1"
                :checked="isBuildingGranted(building.id)"
                :disabled="saving"
                @change="onBuildingChange(building, $event)"
              />
              <span>
                <span class="block font-medium text-neutral-900">
                  {{ buildingLabel(building) }}
                </span>
                <span class="block text-xs text-neutral-500">
                  Ganzes Gebäude
                </span>
              </span>
            </label>
            <div
              v-if="
                !isBuildingGranted(building.id) &&
                visibleRoomsOfBuilding(building).length
              "
              class="mt-2 ml-7 space-y-1.5"
            >
              <label
                v-for="room in visibleRoomsOfBuilding(building)"
                :key="room.id"
                class="flex cursor-pointer items-center gap-2 text-sm text-neutral-700"
              >
                <input
                  type="checkbox"
                  :checked="isRoomGranted(room.id)"
                  :disabled="saving"
                  @change="onRoomChange(room, $event)"
                />
                {{ roomLabel(room) }}
              </label>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <button
          class="btn-dialog-cancel"
          type="button"
          :disabled="saving"
          @click="modalOpen = false"
        >
          Abbrechen
        </button>
        <button
          class="btn-dialog-primary"
          type="button"
          :disabled="saving"
          @click="saveModal"
        >
          {{ modalMode === "create" ? "Einladen" : "Speichern" }}
        </button>
      </template>
    </UiModal>
  </div>
</template>
