<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div
      class="bg-white rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">
          {{ form.id != null ? "Mieter bearbeiten" : "Neuer Mieter" }}
        </h3>
        <button
          type="button"
          @click="closeModal"
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

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Name</label>
          <input
            v-model="form.title"
            type="text"
            required
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Beschreibung</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Typ</label>
          <select
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            v-model="form.type"
          >
            <option value="desk">Tisch</option>
            <option value="room">Meetingraum</option>
            <option value="office">Büro</option>
            <option value="event">Eventlocation</option>
            <option value="other">Andere</option>
          </select>
        </div>

        <div class="grid grid-cols-4 gap-4 items-center">
          <div class="col-span-3">
            <label class="block text-sm font-medium mb-1">Kapazität</label>
            <input
              v-model="form.capacity"
              type="number"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
          <div>
            <label class="flex items-center gap-2 text-sm font-medium mb-1">
              <input
                v-model="form.isActive"
                type="checkbox"
                class="border rounded-lg border-black/10 shadow-sm"
              />Aktiv
            </label>
          </div>
        </div>

        <!-- Preise -->
        <div
          v-for="(p, index) in form.prices"
          :key="index"
          class="grid grid-cols-6 gap-2"
        >
          <div class="flex flex-col col-span-5">
            <label>Preis ({{ p.interval }})</label>
            <input
              type="number"
              v-model="p.price"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
          <div class="col-span-1">
            <label>Währung</label>
            <input
              type="text"
              v-model="p.currency"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
        </div>

        <!-- Haus -->
        <div>
          <label class="block text-sm font-medium mb-1">Haus</label>
          <select
            @change="updateAreaPoiRelation(form.area?.id, selectedHouseId)"
            v-model="selectedHouseId"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          >
            <option
              v-for="house in allHouses"
              :key="house.id"
              :value="house.id"
            >
              {{ house.name }}
            </option>
          </select>
        </div>

        <!-- Logo Selection -->
        <div>
          <label class="block text-sm font-medium mb-1">Logo</label>
          <div class="flex items-center gap-4">
            <div v-if="form.logoId" class="relative w-20 h-20 bg-neutral-200">
              <img
                :src="getImageUrl(form.logoId)"
                alt="Logo"
                class="w-full h-full object-contain border rounded-lg"
              />
              <button
                type="button"
                @click="form.logoId = null"
                class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 w-6 h-6 flex items-center justify-center"
              >
                <UIcon name="i-lucide-x" size="16" />
              </button>
            </div>
            <button
              type="button"
              @click="showLogoSelector = true"
              class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
            >
              {{ form.logoId ? "Logo ändern" : "Logo auswählen" }}
            </button>
          </div>
        </div>

        <!-- Marketing Images Selection -->
        <div>
          <label class="block text-sm font-medium mb-1">Marketing Bilder</label>
          <div class="flex items-center gap-4 flex-wrap">
            <div
              v-for="imgId in form.images"
              :key="imgId"
              class="relative w-20 h-20 bg-neutral-200"
            >
              <img
                :src="getImageUrl(imgId)"
                alt="Marketing Bild"
                class="w-full h-full object-contain border rounded-lg"
              />
              <button
                type="button"
                @click="removeMarketingImage(imgId)"
                class="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 w-6 h-6 flex items-center justify-center"
              >
                <UIcon name="i-lucide-x" size="16" />
              </button>
            </div>
            <button
              type="button"
              @click="showMarketingImagesSelector = true"
              class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
            >
              Bilder hinzufügen
            </button>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            @click="closeModal"
            class="bg-neutral-100 hover:bg-neutral-200 font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
          >
            Abbrechen
          </button>
          <button
            @click="saveresource"
            class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
          >
            {{ form.id != null ? "Speichern" : "Hinzufügen" }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Logo Selector Modal -->
  <div
    v-if="showLogoSelector"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
  >
    <div
      class="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Logo auswählen</h3>
        <button
          type="button"
          @click="showLogoSelector = false"
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
        :initial-selection="form.logoId ? [form.logoId] : []"
        @images-selected="handleLogoSelection"
      />
    </div>
  </div>

  <!-- Marketing Images Selector Modal -->
  <div
    v-if="showMarketingImagesSelector"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
  >
    <div
      class="bg-white rounded-lg p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Marketing Bilder auswählen</h3>
        <button
          type="button"
          @click="showMarketingImagesSelector = false"
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
        :initial-selection="form.images"
        @images-selected="handleMarketingImagesSelection"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import MediaLibrary from "../MediaLibrary.vue";

const props = defineProps({
  form: Object,
});

const emit = defineEmits(["closeModal", "resource-saved"]);

const selectedHouseId = ref("");
const showLogoSelector = ref(false);
const showMarketingImagesSelector = ref(false);

const images = ref([]);

const initialForm = {
  id: null,
  title: "",
  description: "",
  type: "desk",
  capacity: 1,
  prices: [],
  isActive: false,
  areaId: null,
  logoId: null,
  marketingImageIds: [],
};

const form = ref(props.form ? props.form : initialForm);

// Lade alle verfügbaren Bilder
async function loadImages() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_IMAGE_URL}/api/media`
    );
    if (!response.ok) throw new Error("Failed to load images");
    images.value = await response.json();
  } catch (error) {
    console.error("Error loading images:", error);
  }
}

onMounted(async () => {
  await loadImages();

  const intervals = ["hour", "day", "month"];
  intervals.forEach((interval) => {
    if (!form.value.prices.find((p) => p.interval === interval)) {
      form.value.prices.push({ price: 0, interval, currency: "EUR" });
    }
  });
});

function getImageUrl(imageId) {
  if (!imageId) return "";
  const img = images.value.find((i) => i.id === imageId);
  return img ? `${import.meta.env.VITE_INTERNAL_IMAGE_URL}${img.url}` : "";
}

// Marketing Images
function handleMarketingImagesSelection(selectedImages) {
  form.value.images = selectedImages.map((img) => {
    return { mediaId: img };
  });
  showMarketingImagesSelector.value = false;
}

function removeMarketingImage(id) {
  form.value.images = form.value.images.filter((i) => i);
}

// Save Resource
async function saveresource() {
  try {
    const resourceData = {
      title: form.value.title,
      description: form.value.description,
      type: form.value.type,
      capacity: form.value.capacity,
      isActive: form.value.isActive,
      areaId: form.value.areaId,
      logoId: form.value.logoId,
      images: form.value.images,
      prices: form.value.prices,
    };

    const url =
      form.value.id != null
        ? `${import.meta.env.VITE_INTERNAL_API_URL}/resources/${form.value.id}`
        : `${import.meta.env.VITE_INTERNAL_API_URL}/resources`;

    const response = await fetch(url, {
      method: form.value.id != null ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(resourceData),
    });

    if (!response.ok) throw new Error("Failed to save resource");

    const savedResource = await response.json();

    emit("resource-saved", savedResource);
    closeModal();
  } catch (error) {
    console.error(error);
    alert("Fehler beim Speichern des Mieters");
  }
}

function closeModal() {
  emit("closeModal", false);
}
</script>

<style scoped>
label {
  cursor: pointer;
}
</style>
