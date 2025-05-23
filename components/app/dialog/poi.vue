<template>
  <div class="bg-white rounded-lg shadow-lg p-4 flex flex-col gap-4 max-h-full overflow-auto">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">
        {{ poiToEdit?.id ? 'POI bearbeiten' : 'Neuer POI' }}
      </h2>
      <div class="flex items-center gap-2">
        <div class="relative group">
          <button
            @click="handleGeometryAction"
            class="p-2 rounded-md border"
            :class="{
              'bg-orange-100 border-orange-500': isGeometryEditMode,
              'bg-white border-neutral-200': !isGeometryEditMode
            }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" :class="{
              'text-orange-500': isGeometryEditMode,
              'text-neutral-500': !isGeometryEditMode
            }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 4v16m8-8H4" v-if="!poiToEdit?.id"/>
              <path d="M3 17v3h3l10-10-3-3-10 10z" v-else/>
            </svg>
          </button>
          <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            {{ geometryButtonTooltip }}
          </div>
        </div>
        <div class="relative group">
          <button
            @click="handleCancel"
            class="p-2 rounded-md border border-neutral-200 bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Schließen
          </div>
        </div>
      </div>
    </div>

    <form @submit.prevent="submitForm" class="flex flex-col gap-6">
      <div>
        <h3 class="text-sm font-semibold mb-3 text-neutral-500">Basis Informationen</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col mt-2">
            <label for="poiType" class="text-sm mb-1 font-medium text-gray-700"
              >Typ:</label
            >
            <select
              id="poiType"
              v-model="formData.poiType"
              class="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="BUILDING">Gebäude</option>
              <option value="AREA">Fläche</option>
              <option value="POINT">Punkt / Symbol</option>
            </select>
          </div>

          <div class="flex flex-col mt-2">
            <label for="name" class="text-sm mb-1 font-medium text-gray-700"
              >Name:</label
            >
            <input
              id="name"
              type="text"
              v-model.trim="formData.name"
              required
              placeholder="Name des Ortes"
              class="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="flex flex-col mt-2">
            <label for="address" class="text-sm mb-1 font-medium text-gray-700"
              >Adresse:</label
            >
            <input
              id="address"
              type="text"
              v-model.trim="formData.address"
              placeholder="Vollständige Adresse"
              class="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="flex flex-col mt-2">
            <label for="shortName" class="text-sm mb-1 font-medium text-gray-700"
              >Abgekürzter Name:</label
            >
            <input
              id="shortName"
              type="text"
              v-model.trim="formData.shortName"
              placeholder="z.B. Hausnummer, Symbol"
              class="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div class="flex flex-col mt-2 md:col-span-2">
            <label
              for="description"
              class="text-sm mb-1 font-medium text-gray-700"
              >Kurze Beschreibung (optional):</label
            >
            <textarea
              id="description"
              rows="4"
              v-model="formData.directionDescription"
              placeholder="Zusätzliche Informationen oder Hinweise zum Ort"
              class="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <div class="flex flex-col mt-2" v-if="formData.poiType === 'POINT'">
            <label for="iconId" class="text-sm mb-1 font-medium text-gray-700"
              >Icon (optional):</label
            >
            <select
              id="iconId"
              v-model="formData.iconId"
              class="p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option :value="null">Kein Icon</option>
              <option value="icon-pin">Pin</option>
              <option value="icon-info">Info</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button
          @click="handleCancel"
          type="button"
          class="py-1 px-2 text-sm bg-neutral-200 border border-neutral-900/5 rounded-md hover:bg-neutral-300 hover:cursor-pointer transition"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          class="py-1 px-2 text-sm bg-yellow-400 border border-neutral-900/5 rounded-md text-neutral-900 hover:bg-yellow-500 hover:cursor-pointer transition"
          @click="saveEntry"
        >
          {{ isEditMode ? "Änderungen speichern" : "POI erstellen" }}
        </button>
      </div>
    </form>

    <!-- Renter section - moved outside the form -->
    <div v-if="poiToEdit.poiType === 'BUILDING'" class="border-t pt-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium">Mieter</h3>
        <button
          type="button"
          @click="showRenterForm = true"
          class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
        >
          Mieter hinzufügen
        </button>
      </div>

      <div v-if="renters.length > 0" class="space-y-3">
        <div v-for="renter in renters" :key="renter.id" class="border rounded-lg p-3">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-medium">{{ renter.name }}</h4>
              <p v-if="renter.area" class="text-sm text-neutral-600">
                Fläche: {{ renter.area.squaremeters }}m² | Kosten: {{ renter.area.costs }}€
              </p>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                @click="editRenter(renter)"
                class="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                type="button"
                @click="deleteRenter(renter)"
                class="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-neutral-500 italic">Noch keine Mieter vorhanden</p>
    </div>

    <RenterForm
      v-model="showRenterForm"
      :editing-renter="editingRenter"
      :poi-id="poiToEdit?.id"
      :poi="poiToEdit"
      @renter-saved="handleRenterSaved"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import RenterForm from './RenterForm.vue';

// --- Props ---
const props = defineProps({
  poiToEdit: {
    type: Object,
    default: null,
  },
  isGeometryEditMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["save", "cancel", "edit-position", "start-drawing"]);

const getInitialFormData = () => ({
  id: null,
  poiType: "BUILDING",
  name: "",
  address: "",
  shortName: "",
  directionDescription: "",
  iconId: null,
  areaGeoJson: null,
});

const formData = ref(getInitialFormData());

const isEditMode = computed(() => !!props.poiToEdit);

const formTitle = computed(() =>
  isEditMode.value ? "POI bearbeiten" : "Neuen POI erstellen"
);

watch(
  () => props.poiToEdit,
  (newPoi) => {
    console.log("Watcher: poiToEdit changed", newPoi);
    if (newPoi && typeof newPoi === "object") {
      const initialData = getInitialFormData();
      for (const key in initialData) {
        formData.value[key] =
          newPoi[key] !== undefined ? newPoi[key] : initialData[key];
      }
      if (newPoi.areaGeoJson) {
        formData.value.areaGeoJson = JSON.parse(
          JSON.stringify(newPoi.areaGeoJson)
        );
      }
    } else {
      formData.value = getInitialFormData();
    }
  },
  {
    immediate: true,
  }
);

const geometryButtonTooltip = computed(() => {
  if (props.poiToEdit?.id) {
    return props.isGeometryEditMode ? 'Bearbeitung beenden' : 'Position bearbeiten';
  }
  return 'Zeichnen starten';
});

const geometryButtonIcon = computed(() => {
  if (props.poiToEdit?.id) {
    return 'i-lucide-move';
  }
  return 'i-lucide-pencil';
});

const handleGeometryAction = () => {
  if (props.poiToEdit?.id) {
    emit('edit-position');
  } else {
    const type = formData.value.poiType;
    if (type === "POINT") {
      emit("start-drawing", "point");
    } else if (type === "BUILDING" || type === "AREA") {
      emit("start-drawing", "polygon");
    }
  }
};

const submitForm = () => {
  if (!formData.value.name) {
    alert("Bitte geben Sie einen Namen für den POI an.");
    return;
  }
  if (!formData.value.poiType) {
    alert("Bitte wählen Sie einen Typ für den POI aus.");
    return;
  }
  emit("save", { ...formData.value });
};

const handleCancel = () => {
  console.log("Cancel form");
  emit("cancel");
};

// Neue Refs für Mieter-Verwaltung
const showRenterForm = ref(false);
const editingRenter = ref(null);
const renters = ref([]);

const initialRenterForm = {
  name: '',
  operator: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  hasArea: false,
  area: {
    squaremeters: null,
    costs: null,
    isAvailable: false,
    advertised: false,
    showByDefault: true
  }
};

const renterForm = ref({ ...initialRenterForm });

// Watch für poiToEdit um Mieter zu laden
watch(() => props.poiToEdit, async (newPoi) => {
  if (newPoi?.id) {
    try {
      const response = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/pois/${newPoi.id}/renters`);
      if (!response.ok) throw new Error('Failed to load renters');
      const data = await response.json();
      renters.value = data;
    } catch (error) {
      console.error('Error loading renters:', error);
    }
  } else {
    renters.value = [];
  }
}, { immediate: true });

function editRenter(renter) {
  console.log("Edit renter", renter);
  editingRenter.value = renter;
  renterForm.value = {
    ...renter,
    hasArea: !!renter.area,
    area: renter.area || { ...initialRenterForm.area }
  };
  showRenterForm.value = true;
}

async function deleteRenter(renter) {
  if (!confirm('Möchten Sie diesen Mieter wirklich löschen?')) return;

  try {
    const response = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/renters/${renter.id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete renter');
    renters.value = renters.value.filter(r => r.id !== renter.id);
  } catch (error) {
    console.error('Error deleting renter:', error);
    alert('Fehler beim Löschen des Mieters');
  }
}

function handleRenterSaved(savedRenter) {
  if (editingRenter.value) {
    const index = renters.value.findIndex(r => r.id === savedRenter.id);
    if (index !== -1) renters.value[index] = savedRenter;
  } else {
    renters.value.push(savedRenter);
  }
  editingRenter.value = null;
}
</script>

<style scoped>
label {
  cursor: pointer;
}
</style>
