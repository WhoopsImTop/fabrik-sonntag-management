<template>
  <div
    class="bg-white rounded-lg shadow-lg p-4 flex flex-col gap-4 max-h-full overflow-auto"
  >
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">
        {{ poiToEdit?.id ? "POI bearbeiten" : "Neuer POI" }}
      </h2>
      <div class="flex items-center gap-2">
        <div class="relative group">
          <button
            @click="handleGeometryAction"
            class="p-2 rounded-md border"
            :class="{
              'bg-orange-100 border-orange-500': isGeometryEditMode,
              'bg-white border-neutral-200': !isGeometryEditMode,
            }"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              :class="{
                'text-orange-500': isGeometryEditMode,
                'text-neutral-500': !isGeometryEditMode,
              }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 4v16m8-8H4" v-if="!poiToEdit?.id" />
              <path d="M3 17v3h3l10-10-3-3-10 10z" v-else />
            </svg>
          </button>
          <div
            class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {{ geometryButtonTooltip }}
          </div>
        </div>
        <div class="relative group">
          <button
            @click="handleCancel"
            class="p-2 rounded-md border border-neutral-200 bg-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5 text-neutral-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div
            class="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Schließen
          </div>
        </div>
      </div>
    </div>

    <form @submit.prevent="submitForm" class="flex flex-col gap-6">
      <div>
        <h3 class="text-sm font-semibold mb-3 text-neutral-500">
          Basis Informationen
        </h3>
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
            <label
              for="shortName"
              class="text-sm mb-1 font-medium text-gray-700"
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
          <!-- Custom Icon Selection -->
          <div class="flex flex-col mt-2">
            <label class="block text-sm font-medium mb-1">Eigenes Icon</label>
            <div class="flex items-center gap-4">
              <div
                v-if="formData.iconId && !isPredefinedIcon(formData.iconId)"
                class="relative w-12 h-12 bg-neutral-200"
              >
                <img
                  :src="getIconPreviewUrl(formData.iconId)"
                  alt="Icon"
                  class="w-full h-full object-contain border rounded-lg"
                />
                <button
                  type="button"
                  @click="formData.iconId = null"
                  class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 w-6 h-6 flex items-center justify-center"
                >
                  <UIcon name="i-lucide-x" size="12" />
                </button>
              </div>
              <button
                type="button"
                @click="showIconMediaLibrary = true"
                class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
              >
                {{
                  formData.iconId && !isPredefinedIcon(formData.iconId)
                    ? "Icon ändern"
                    : "Icon auswählen"
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 class="text-sm font-semibold mb-3 text-neutral-500">
          Marketing Bilder
        </h3>
        <div v-if="images.length > 0">
          <label class="block text-sm font-medium mb-1">Marketing Bilder</label>
          <div class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <div
                v-for="(imageId, index) in formData.marketingImages"
                :key="imageId"
                class="relative aspect-square bg-neutral-200"
              >
                <img
                  :src="getMarketingImageUrl(imageId)"
                  alt="Marketing Image"
                  class="w-full h-full object-cover border rounded-lg"
                />
                <button
                  type="button"
                  @click="removeMarketingImage(index)"
                  class="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center h-6 w-6"
                >
                  <UIcon name="i-lucide-x" size="16" />
                </button>
              </div>
            </div>
            <button
              type="button"
              @click="showMarketingMediaLibrary = true"
              class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
            >
              Marketing Bilder hinzufügen
            </button>
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
        <div v-if="renters.length > 1" class="text-sm text-blue-600 bg-blue-50 p-2 rounded-md mb-3">
          💡 Ziehen Sie die Mieter-Karten, um die Reihenfolge zu ändern. Änderungen werden automatisch gespeichert.
        </div>
        
        <div
          v-for="(renter, index) in renters"
          :key="renter.id"
          :draggable="renters.length > 1"
          class="border border-neutral-200 rounded-lg p-3 transition-all"
          :class="{
            'cursor-move border-blue-300 shadow-sm': renters.length > 1,
            'bg-neutral-50': isDragging && draggedIndex === index
          }"
          @dragstart="handleDragStart($event, index)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver"
          @drop="handleDrop($event, index)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div v-if="renters.length > 1" class="text-neutral-400">
                <UIcon name="i-lucide-grip-vertical" class="h-5 w-5" />
              </div>
              <div>
                <h4 class="font-medium">{{ renter.name }}</h4>
                <p v-if="renter.area" class="text-sm text-neutral-600">
                  Fläche: {{ renter.area.squaremeters }}m² | Kosten:
                  {{ renter.area.costs }}€
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                @click="editRenter(renter)"
                class="p-1 rounded-md border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center"
              >
                <UIcon name="i-lucide-edit" class="h-6 m-0 p-0" />
              </button>
              <button
                type="button"
                @click="deleteRenter(renter)"
                class="p-1 rounded-md border border-neutral-200 hover:bg-neutral-50 text-red-500 flex items-center justify-center"
              >
                <UIcon name="i-lucide-trash" class="h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-neutral-500 italic">
        Noch keine Mieter vorhanden
      </p>
    </div>

    <RenterForm
      v-if="showRenterForm"
      v-model="showRenterForm"
      :editing-renter="editingRenter"
      :poi-id="poiToEdit?.id"
      :poi="poiToEdit"
      @renter-saved="handleRenterSaved"
    />
    <!-- Media Library Modals -->
    <div
      v-if="showMarketingMediaLibrary"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
    >
      <div
        class="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Marketing Bilder auswählen</h3>
          <button
            type="button"
            @click="showMarketingMediaLibrary = false"
            class="p-2 rounded-md hover:bg-neutral-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <MediaLibrary
          :is-multi-select="true"
          :initial-selection="formData.marketingImages"
          @images-selected="handleMarketingMediaSelected"
        />
      </div>
    </div>

    <div
      v-if="showIconMediaLibrary"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
    >
      <div
        class="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Icon auswählen</h3>
          <button
            type="button"
            @click="showIconMediaLibrary = false"
            class="p-2 rounded-md hover:bg-neutral-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <MediaLibrary
          :is-multi-select="false"
          :initial-selection="
            formData.iconId && !isPredefinedIcon(formData.iconId)
              ? [formData.iconId]
              : []
          "
          @images-selected="handleIconMediaSelected"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue";
import RenterForm from "./RenterForm.vue";
import MediaLibrary from "@/components/app/MediaLibrary.vue"; // Import MediaLibrary

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
  marketingImages: [], // Initialisiere marketingImages als leeres Array
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

      // Marketing-Bilder korrekt laden
      if (newPoi.marketingImages && Array.isArray(newPoi.marketingImages)) {
        // Falls marketingImages ein Array von Objekten ist (mit id, url etc.)
        formData.value.marketingImages = newPoi.marketingImages.map((img) =>
          typeof img === "object" ? img.id : img
        );
      } else if (
        newPoi.marketingImageIds &&
        Array.isArray(newPoi.marketingImageIds)
      ) {
        // Falls es ein marketingImageIds Feld gibt
        formData.value.marketingImages = [...newPoi.marketingImageIds];
      } else {
        formData.value.marketingImages = [];
      }

      console.log("Loaded marketing images:", formData.value.marketingImages);
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
    return props.isGeometryEditMode
      ? "Bearbeitung beenden"
      : "Position bearbeiten";
  }
  return "Zeichnen starten";
});

const geometryButtonIcon = computed(() => {
  if (props.poiToEdit?.id) {
    return "i-lucide-move";
  }
  return "i-lucide-pencil";
});

const handleGeometryAction = () => {
  if (props.poiToEdit?.id) {
    emit("edit-position");
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
const showMarketingMediaLibrary = ref(false); // Ref für die Sichtbarkeit der Marketing Media Library
const showIconMediaLibrary = ref(false); // Ref für die Sichtbarkeit der Icon Media Library

// Sortierungsfunktionalität
const isDragging = ref(false);
const draggedIndex = ref(null);

// Load images on component mount
onMounted(async () => {
  await loadImages();
});

const initialRenterForm = {
  name: "",
  operator: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  hasArea: false,
  description: "",
  openingHours: null,
  area: {
    squaremeters: null,
    costs: null,
    isAvailable: false,
    advertised: false,
    showByDefault: true,
  },
};

const renterForm = ref({ ...initialRenterForm });

// Watch für poiToEdit um Mieter zu laden
watch(
  () => props.poiToEdit,
  async (newPoi) => {
    if (newPoi?.id) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_INTERNAL_API_URL}/pois/${newPoi.id}/renters`
        );
        if (!response.ok) throw new Error("Failed to load renters");
        const data = await response.json();
        renters.value = data;
      } catch (error) {
        console.error("Error loading renters:", error);
      }
    } else {
      renters.value = [];
    }
  },
  { immediate: true }
);

function editRenter(renter) {
  console.log("Edit renter", renter);
  editingRenter.value = renter;
  renterForm.value = {
    ...renter,
    hasArea: !!renter.area,
    area: renter.area || { ...initialRenterForm.area },
  };
  showRenterForm.value = true;
}

async function deleteRenter(renter) {
  if (!confirm("Möchten Sie diesen Mieter wirklich löschen?")) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/renters/${renter.id}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) throw new Error("Failed to delete renter");
    renters.value = renters.value.filter((r) => r.id !== renter.id);
  } catch (error) {
    console.error("Error deleting renter:", error);
    alert("Fehler beim Löschen des Mieters");
  }
}

function handleRenterSaved(savedRenter) {
  if (editingRenter.value) {
    const index = renters.value.findIndex((r) => r.id === savedRenter.id);
    if (index !== -1) renters.value[index] = savedRenter;
  } else {
    renters.value.push(savedRenter);
  }
  editingRenter.value = null;
}

// Sortierungsfunktionen
function handleDragStart(event, index) {
  if (renters.value.length <= 1) return;
  
  isDragging.value = true;
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
  isDragging.value = false;
  draggedIndex.value = null;
}

function handleDragOver(event) {
  if (renters.value.length <= 1) return;
  
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

async function handleDrop(event, targetIndex) {
  if (renters.value.length <= 1 || draggedIndex.value === null) return;
  
  event.preventDefault();
  
  if (draggedIndex.value !== targetIndex) {
    // Element an der Zielposition einfügen
    const draggedRenter = renters.value.splice(draggedIndex.value, 1)[0];
    renters.value.splice(targetIndex, 0, draggedRenter);
    
    // Automatisch speichern nach dem Verschieben
    await saveSortOrder();
  }
  
  isDragging.value = false;
  draggedIndex.value = null;
}

async function saveSortOrder() {
  if (!props.poiToEdit?.id) return;
  
  try {
    // Erstelle Array mit den Area-IDs in der neuen Reihenfolge
    // (nicht Renter-IDs, sondern Area-IDs, da das Backend Area-IDs erwartet)
    const sortedAreaIds = renters.value
      .filter(renter => renter.area && renter.area.id) // Nur Mieter mit gültiger Area
      .map(renter => renter.area.id);
    
    // Floor-ID aus dem ersten Renter mit Area extrahieren
    const firstRenterWithArea = renters.value.find(renter => renter.area && renter.area.floorId);
    const floorId = firstRenterWithArea?.area?.floorId;
    
    if (!floorId) {
      console.error('Keine Floor-ID gefunden. POI-Struktur:', props.poiToEdit);
      console.error('Renters-Struktur:', renters.value);
      throw new Error('Floor-ID konnte nicht ermittelt werden');
    }
    
    console.log("Saving renter sort order:", {
      poiToEdit: props.poiToEdit,
      floorId: floorId,
      sortedAreaIds: sortedAreaIds
    });
    
    // Verwende die korrekte API-Route basierend auf der Backend-Funktion
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/sort/floor/${floorId}/renters`,
      {
        method: 'PATCH', // Backend verwendet PUT statt PATCH
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sortedAreaIds }) // Backend erwartet sortedAreaIds
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to save sort order');
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Mieter-Reihenfolge erfolgreich gespeichert');
    } else {
      throw new Error(result.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('Error saving sort order:', error);
    // Optional: Fehler-Nachricht anzeigen
    alert('Fehler beim Speichern der Reihenfolge: ' + error.message);
  }
}

// Umbenannt und angepasst von getImageUrl zu getIconPreviewUrl
function getIconPreviewUrl(iconId) {
  if (!iconId || isPredefinedIcon(iconId)) {
    // Für vordefinierte Icons oder kein Icon keine URL vom Server generieren
    return "";
  }
  // Verwende gleiche Logik wie RenterForm.vue
  const image = images.value.find((img) => img.id === iconId);
  if (!image) return "";
  return `${import.meta.env.VITE_INTERNAL_IMAGE_URL}${image.url}`;
}

function isPredefinedIcon(iconId) {
  return typeof iconId === "string" && iconId.startsWith("icon-");
}

// handleIconUpload wird entfernt, da wir MediaLibrary verwenden
// function handleIconUpload(event) { ... }

function handleIconMediaSelected(selectedImages) {
  if (selectedImages && selectedImages.length > 0) {
    formData.value.iconId = selectedImages[0];
  }
  showIconMediaLibrary.value = false;
}

// Entferne die alte handleMarketingImageUpload Funktion oder kommentiere sie aus
function handleMarketingMediaSelected(selectedImages) {
  if (!selectedImages) return;
  formData.value.marketingImages = selectedImages || [];
  showMarketingMediaLibrary.value = false;
}

function getMarketingImageUrl(imageId) {
  if (!imageId) return "";

  // Versuche, das Bild im geladenen images Array zu finden
  const image = images.value.find((img) => img.id === imageId);
  if (image) {
    return `${import.meta.env.VITE_INTERNAL_IMAGE_URL}${image.url}`;
  }

  // Fallback: Direkte URL-Konstruktion wenn das Bild nicht im Array ist
  console.warn(
    "Bild nicht in geladenen Bildern gefunden, Fallback-URL wird verwendet für:",
    imageId
  );
  return `${import.meta.env.VITE_INTERNAL_IMAGE_URL}/media/${imageId}`;
}

function removeMarketingImage(index) {
  formData.value.marketingImages.splice(index, 1);
}

// Add images ref to store all available images
const images = ref([]);

// Add function to load images
async function loadImages() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/media`
    );
    if (!response.ok) throw new Error("Failed to load images");
    images.value = await response.json();
  } catch (error) {
    console.error("Error loading images:", error);
  }
}
</script>

<style scoped>
label {
  cursor: pointer;
}
</style>
