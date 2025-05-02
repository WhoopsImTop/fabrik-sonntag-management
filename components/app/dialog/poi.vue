<template>
  <div class="rounded-md bg-white shadow-xs p-4">
    <form @submit.prevent="submitForm">
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold">{{ formTitle }}</span>
        <button
          type="button"
          @click="cancelForm"
          class="text-gray-500 hover:text-gray-700"
        >
          <UIcon name="i-lucide-x" class="size-5" />
        </button>
      </div>
      <hr class="border border-neutral-900/10 my-2" />

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

      <div class="flex justify-start mt-4">
        <button
          type="button"
          @click="startDrawing"
          class="py-1 px-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          Zeichnen starten
        </button>
      </div>

      <div class="flex justify-end gap-3 mt-5">
        <button
          @click="cancelForm"
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
  </div>
</template>

<script setup>
import { UIcon } from "#components";
import { ref, watch, computed } from "vue";

// --- Props ---
const props = defineProps({
  poiToEdit: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["save", "cancel"]);

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

const startDrawing = () => {
  const type = formData.value.poiType;
  if (type === "POINT") {
    emit("start-drawing", "point");
  } else if (type === "BUILDING" || type === "AREA") {
    emit("start-drawing", "polygon");
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

const cancelForm = () => {
  console.log("Cancel form");
  emit("cancel");
};
</script>

<style scoped>
label {
  cursor: pointer;
}
</style>
