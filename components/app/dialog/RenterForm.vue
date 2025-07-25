<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    v-if="modelValue"
  >
    <div
      class="bg-white rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">
          {{ editingRenter ? "Mieter bearbeiten" : "Neuer Mieter" }}
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
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Name</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Betreiber</label>
            <input
              v-model="form.operator"
              type="text"
              class="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Adresse</label>
            <textarea
              v-model="form.address"
              rows="2"
              class="w-full p-2 border rounded-md"
            ></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Telefon</label>
              <input
                v-model="form.phone"
                type="tel"
                class="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">E-Mail</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Website</label>
            <input
              v-model="form.website"
              type="url"
              class="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Beschreibung</label>
            <textarea
              rows="3"
              v-model="form.description"
              type="url"
              class="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Haus</label>
            <select
              @change="updateAreaPoiRelation(form.area.id, selectedHouseId)"
              v-model="selectedHouseId"
              class="w-full p-2 border rounded-md"
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
          <div>
            <label class="block text-sm font-medium mb-1">Öffnungszeiten</label>
            <app-custom-input-opening-hours
              :openingHoursProp="form.openingHours"
              class="w-full"
              @update:openingHours="handleOpeningHoursUpdate"
            />
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
                class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
              >
                {{ form.logoId ? "Logo ändern" : "Logo auswählen" }}
              </button>
            </div>
          </div>

          <!-- Marketing Images -->
          <div>
            <label class="block text-sm font-medium mb-1"
              >Marketing Bilder</label
            >
            <div class="space-y-4">
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div
                  v-for="imageId in form.marketingImageIds"
                  :key="imageId"
                  class="relative aspect-square bg-neutral-200"
                >
                  <img
                    :src="getImageUrl(imageId)"
                    alt="Marketing Image"
                    class="w-full h-full object-cover border rounded-lg"
                  />
                  <button
                    type="button"
                    @click="removeMarketingImage(imageId)"
                    class="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 flex items-center justify-center h-6 w-6"
                  >
                    <UIcon name="i-lucide-x" size="16"> </UIcon>
                  </button>
                </div>
              </div>
              <button
                type="button"
                @click="showMarketingImagesSelector = true"
                class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
              >
                Marketing Bilder hinzufügen
              </button>
            </div>
          </div>
        </div>

        <div class="pt-4 border-t">
          <div class="flex items-center gap-2 mb-4">
            <h4 class="text-sm font-medium">Flächen Informationen</h4>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="form.hasArea"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-neutral-200 peer-checked:bg-yellow-400 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
              ></div>
            </label>
          </div>

          <div v-if="form.hasArea" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1"
                  >Fläche (m²)</label
                >
                <input
                  v-model.number="form.area.squaremeters"
                  type="number"
                  step="0.01"
                  class="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Kosten (€)</label>
                <input
                  v-model.number="form.area.costs"
                  type="number"
                  step="0.01"
                  class="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <!-- Map for area drawing -->
            <div class="relative border rounded-lg" style="height: 300px">
              <div ref="mapContainer" class="w-full h-full rounded-lg"></div>
              <div
                class="absolute top-2 right-2 bg-white rounded-lg shadow-sm p-2 flex flex-col gap-2"
              >
                <button
                  @click="startDrawing"
                  class="p-2 rounded-md border"
                  :class="{ 'bg-yellow-100 border-yellow-500': isDrawing }"
                >
                  <UIcon name="i-lucide-pencil" size="24" />
                </button>
                <button
                  v-if="isDrawing"
                  @click="confirmDrawing"
                  class="p-2 rounded-md border bg-green-100 border-green-500 hover:bg-green-200"
                  title="Zeichnung bestätigen"
                >
                  <UIcon name="i-lucide-check" size="24" />
                </button>
                <button
                  @click="deleteArea"
                  class="p-2 rounded-md border hover:bg-red-50 hover:border-red-500"
                  v-if="form.area.areaGeoJson"
                >
                  <UIcon name="i-lucide-trash" size="24" />
                </button>
              </div>
            </div>

            <!-- Floor Management -->
            <div class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-medium">Etagen</h4>
                <button
                  type="button"
                  @click="showFloorForm = true"
                  class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
                >
                  Etage hinzufügen
                </button>
              </div>

              <div v-if="floors.length > 0" class="space-y-3">
                <div
                  v-for="floor in floors"
                  :key="floor.id"
                  class="p-3 border rounded-lg cursor-pointer"
                  :class="{
                    'bg-yellow-50 border-yellow-400':
                      selectedFloorId === floor.id,
                  }"
                  @click="handleFloorSelection(floor.id)"
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-medium">{{ floor.name }}</p>
                      <p class="text-sm text-neutral-500">
                        Level: {{ floor.level }}
                      </p>
                    </div>
                    <div class="flex gap-2">
                      <div
                        @click="editFloor(floor)"
                        class="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50"
                      >
                        <UIcon name="i-lucide-edit" size="16" />
                      </div>
                      <div
                        @click.stop="deleteFloor(floor.id)"
                        class="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-red-500"
                      >
                        <UIcon name="i-lucide-trash" size="16" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p v-else class="text-sm text-neutral-500 italic">
                Noch keine Etagen vorhanden
              </p>
            </div>

            <!-- Floor Form Modal -->
            <div
              v-if="showFloorForm"
              class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
            >
              <div class="bg-white rounded-lg p-4 w-full max-w-md">
                <h3 class="text-lg font-semibold mb-4">
                  {{ editingFloor ? "Etage bearbeiten" : "Neue Etage" }}
                </h3>

                <div @submit.prevent="saveFloor" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-1">Name</label>
                    <input
                      v-model="floorForm.name"
                      type="text"
                      required
                      class="w-full p-2 border rounded-md"
                      placeholder="z.B. Erdgeschoss"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-1">Level</label>
                    <input
                      v-model.number="floorForm.level"
                      type="number"
                      required
                      class="w-full p-2 border rounded-md"
                      placeholder="z.B. 0 für EG, 1 für 1.OG, -1 für UG"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium mb-1"
                      >Beschreibung</label
                    >
                    <textarea
                      v-model="floorForm.description"
                      rows="3"
                      class="w-full p-2 border rounded-md"
                      placeholder="Optionale Beschreibung der Etage"
                    ></textarea>
                  </div>
                  <div class="flex justify-end gap-3">
                    <button
                      type="button"
                      @click="showFloorForm = false"
                      class="px-3 py-1.5 text-sm bg-neutral-100 rounded-md hover:bg-neutral-200"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
                    >
                      {{ editingFloor ? "Speichern" : "Hinzufügen" }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2">
                <input
                  v-model="form.area.isAvailable"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm">Verfügbar</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="form.area.advertised"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm">Wird beworben</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  v-model="form.area.showByDefault"
                  type="checkbox"
                  class="rounded"
                />
                <span class="text-sm">Standardmäßig anzeigen</span>
              </label>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            @click="closeModal"
            class="px-3 py-1.5 text-sm bg-neutral-100 rounded-md hover:bg-neutral-200"
          >
            Abbrechen
          </button>
          <button
            @click="saveRenter"
            class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
          >
            {{ editingRenter ? "Speichern" : "Hinzufügen" }}
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
        :initial-selection="form.marketingImageIds"
        @images-selected="handleMarketingImagesSelection"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import maplibregl from "maplibre-gl";
import MaplibreDraw from "@mapbox/mapbox-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import MediaLibrary from "../MediaLibrary.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  editingRenter: {
    type: Object,
    default: null,
  },
  poiId: {
    type: String,
    required: true,
  },
  poi: {
    type: Object,
    required: true,
  },
  allPois: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "renter-saved"]);

const mapContainer = ref(null);
const map = ref(null);
const draw = ref(null);
const isDrawing = ref(false);
const floors = ref([]);
const showFloorForm = ref(false);
const editingFloor = ref(null);
const floorForm = ref({
  name: "",
  level: 0,
  description: "",
});
const selectedHouseId = ref("");
const selectedFloorId = ref("");
const showLogoSelector = ref(false);
const showMarketingImagesSelector = ref(false);

const initialForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  logoId: null,
  marketingImageIds: [],
  hasArea: false,
  openingHours: {},
  description: "",
  area: {
    squaremeters: null,
    costs: null,
    isAvailable: false,
    advertised: false,
    showByDefault: true,
    areaGeoJson: null,
    floorId: null,
  },
};

const form = ref({ ...initialForm });

// Map initialization
onMounted(async () => {
  // Load floors immediately when component mounts
  await loadFloors();
  // Initialize map
  await initializeMap();

  if (props.editingRenter?.openingHours) {
    try {
      form.value.openingHours = JSON.parse(props.editingRenter.openingHours);
    } catch (error) {
      console.error("Error parsing opening hours:", error);
      form.value.openingHours = {};
    }
  } else {
    form.value.openingHours = {};
  }

  console.log("Form: ", form.value);
  form.value.logoId = props.editingRenter?.logo.id || null;
  if (props.editingRenter?.marketingImages) {
    form.value.marketingImageIds = props.editingRenter.marketingImages.map(
      (img) => img.id
    );
  } else {
    form.value.marketingImageIds = [];
  }
  await loadImages();
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

function initializeMap() {
  if (!mapContainer.value) {
    console.log("MAPContainer Value empty");
    return;
  }

  console.log("Initializing map with POI:", props.poi);
  console.log("POI areaGeoJson:", props.poi.areaGeoJson);

  return new Promise((resolve) => {
    // Initialize map with basic style first
    map.value = new maplibregl.Map({
      container: mapContainer.value,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#ffffff" },
          },
        ],
      },
      center: props.poi.areaGeoJson?.geometry?.coordinates[0][0] || [0, 0],
      zoom: 16,
    });

    // Initialize draw
    draw.value = new MaplibreDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      styles: [
        // Aktive Punkte im Bearbeitungsmodus
        {
          id: "gl-draw-point-active",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "active", "true"]],
          paint: {
            "circle-radius": 7,
            "circle-color": "#ff9800",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        },
        // Inaktive Punkte
        {
          id: "gl-draw-point",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "active", "false"]],
          paint: {
            "circle-radius": 5,
            "circle-color": "#ff9800",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        },
        // Aktive Polygon Fill
        {
          id: "gl-draw-polygon-fill-active",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
          paint: {
            "fill-color": "#cccccc",
            "fill-outline-color": "#ff9800",
            "fill-opacity": 0.4,
          },
        },
        // Inaktive Polygon Fill
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: [
            "all",
            ["==", "$type", "Polygon"],
            ["==", "active", "false"],
          ],
          paint: {
            "fill-color": "#cccccc",
            "fill-outline-color": "#ff9800",
            "fill-opacity": 0.2,
          },
        },
        // Polygon Stroke - für aktive Bearbeitung
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
          paint: {
            "line-color": "#ff9800",
            "line-width": 3,
            "line-dasharray": ["literal", [2, 2]],
          },
        },
        // Polygon Stroke - für inaktive Polygone
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          filter: [
            "all",
            ["==", "$type", "Polygon"],
            ["==", "active", "false"],
          ],
          paint: {
            "line-color": "#ff9800",
            "line-width": 2,
          },
        },
        // Vertices - Eckpunkte für die Bearbeitung
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 6,
            "circle-color": "#fff",
            "circle-stroke-color": "#ff9800",
            "circle-stroke-width": 2,
          },
        },
      ],
    });

    map.value.addControl(draw.value);

    // Add POI polygon after map loads
    map.value.on("load", () => {
      console.log("Map loaded, adding POI polygon");
      if (props.poi?.areaGeoJson) {
        try {
          // Add POI polygon as source
          map.value.addSource("poi-source", {
            type: "geojson",
            data: props.poi.areaGeoJson,
          });

          // Add POI polygon layer
          map.value.addLayer({
            id: "poi-polygon",
            type: "fill",
            source: "poi-source",
            paint: {
              "fill-color": "#cccccc",
              "fill-opacity": 0.2,
            },
          });

          // Add outline layer
          map.value.addLayer({
            id: "poi-polygon-outline",
            type: "line",
            source: "poi-source",
            paint: {
              "line-color": "#000000",
              "line-width": 2,
            },
          });

          // Fit map to POI polygon
          const bounds = new maplibregl.LngLatBounds();
          props.poi.areaGeoJson.geometry.coordinates[0].forEach((coord) => {
            bounds.extend(coord);
          });
          map.value.fitBounds(bounds, { padding: 50 });

          console.log("Successfully added POI polygon to map");
        } catch (error) {
          console.error("Error adding POI polygon:", error);
        }
      } else {
        console.warn("No POI areaGeoJson available");
      }

      // If area exists, add it to draw
      if (form.value.area?.areaGeoJson) {
        try {
          draw.value.add(form.value.area.areaGeoJson);
          console.log("Added area to draw");
        } catch (error) {
          console.error("Error adding area to draw:", error);
        }
      }
      resolve();
    });

    // Watch for draw changes
    map.value.on("draw.create draw.update", (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        form.value.area.areaGeoJson = feature;
        console.log("Updated area GeoJSON:", feature);
      }
    });
  });
}

async function startDrawing() {
  if (!map.value || !draw.value) {
    console.log("Map or draw not initialized, initializing...");
    await initializeMap();
  }

  try {
    isDrawing.value = !isDrawing.value;
    if (isDrawing.value) {
      draw.value.changeMode("draw_polygon");
    } else {
      draw.value.changeMode("simple_select");
    }
  } catch (error) {
    console.error("Error changing draw mode:", error);
    isDrawing.value = false;
  }
}

async function confirmDrawing() {
  if (!map.value || !draw.value) return;

  const features = draw.value.getAll().features;
  if (features.length === 0) {
    alert("Bitte zuerst eine Fläche zeichnen.");
    return;
  }

  // Get the last drawn feature
  const feature = features[features.length - 1];

  // Update the form with the new geometry
  form.value.area.areaGeoJson = {
    type: "Feature",
    properties: {},
    geometry: feature.geometry,
  };

  // Exit drawing mode
  isDrawing.value = false;
  draw.value.changeMode("simple_select");
}

async function deleteArea() {
  if (!map.value || !draw.value) return;

  if (confirm("Möchten Sie diese Fläche wirklich löschen?")) {
    draw.value.deleteAll();
    form.value.area.areaGeoJson = null;
  }
}

// Floor management functions
async function loadFloors() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/floors`
    );
    if (!response.ok) throw new Error("Failed to load floors");
    floors.value = await response.json();
  } catch (error) {
    console.error("Error loading floors:", error);
    alert("Fehler beim Laden der Etagen");
  }
}

function editFloor(floor) {
  editingFloor.value = floor;
  floorForm.value = { ...floor };
  showFloorForm.value = true;
}

async function deleteFloor(id) {
  if (!confirm("Möchten Sie diese Etage wirklich löschen?")) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/floors/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      }
    );
    if (!response.ok) throw new Error("Failed to delete floor");
    floors.value = floors.value.filter((f) => f.id !== id);
  } catch (error) {
    console.error("Error deleting floor:", error);
    alert("Fehler beim Löschen der Etage");
  }
}

async function updateAreaWithFloor(floorId) {
  if (!form.value.area) return;

  form.value.area.floorId = floorId || null;
}

async function handleFloorSelection(floorId) {
  selectedFloorId.value = floorId;
  await updateAreaWithFloor(floorId);
}

async function saveFloor() {
  try {
    // Strukturiertes Floor-Objekt erstellen
    const floorData = {
      name: floorForm.value.name,
      level: floorForm.value.level,
      description: floorForm.value.description || "",
      areaId: props.editingRenter?.area?.id,
      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
    };

    console.log("Floor Objekt zum Speichern:", floorData);

    const url = editingFloor.value
      ? `${import.meta.env.VITE_INTERNAL_API_URL}/floors/${
          editingFloor.value.id
        }`
      : `${import.meta.env.VITE_INTERNAL_API_URL}/floors`;

    const response = await fetch(url, {
      method: editingFloor.value ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(floorData),
    });

    if (!response.ok) throw new Error("Failed to save floor");

    const savedFloor = await response.json();
    console.log("Gespeicherter Floor:", savedFloor);

    if (editingFloor.value) {
      const index = floors.value.findIndex((f) => f.id === savedFloor.id);
      if (index !== -1) floors.value[index] = savedFloor;
    } else {
      floors.value.push(savedFloor);
      selectedFloorId.value = savedFloor.id;
      await updateAreaWithFloor(savedFloor.id);
    }

    showFloorForm.value = false;
    editingFloor.value = null;
    floorForm.value = { name: "", level: 0, description: "" };
  } catch (error) {
    console.error("Error saving floor:", error);
    alert("Fehler beim Speichern der Etage");
  }
}

// Modify the watch for editingRenter
watch(
  () => props.editingRenter,
  async (renter) => {
    console.log("Editing renter changed:", renter);
    if (renter) {
      form.value = {
        ...renter,
        hasArea: !!renter.area,
        area: renter.area || { ...initialForm.area },
      };

      // Add area polygon to draw if it exists
      if (renter.area?.areaGeoJson && map.value && draw.value) {
        console.log("Adding area to draw:", renter.area.areaGeoJson);
        draw.value.deleteAll();
        draw.value.add(renter.area.areaGeoJson);
      }

      if (renter?.area?.floorId) {
        selectedFloorId.value = renter.area.floorId;
      } else {
        selectedFloorId.value = "";
      }
    } else {
      form.value = { ...initialForm };
    }
  },
  { immediate: true }
);

// Watch for POI changes
watch(
  () => props.poi,
  async (newPoi) => {
    console.log("POI changed:", newPoi);
    if (newPoi?.areaGeoJson && map.value) {
      try {
        // Update POI polygon source if it exists
        if (map.value.getSource("poi-source")) {
          map.value.getSource("poi-source").setData(newPoi.areaGeoJson);
        }
        // Fit to bounds
        const bounds = new maplibregl.LngLatBounds();
        newPoi.areaGeoJson.geometry.coordinates[0].forEach((coord) => {
          bounds.extend(coord);
        });
        map.value.fitBounds(bounds, { padding: 50 });
      } catch (error) {
        console.error("Error updating POI polygon:", error);
      }
    }
  },
  { immediate: true }
);

const allHouses = ref(
  props.allPois.map((poi) => ({
    id: poi.id,
    name: poi.name,
  })) || []
);

function handleLogoSelection(selectedImages) {
  console.log("Logo selection:", selectedImages);
  if (selectedImages && selectedImages.length > 0) {
    form.value.logoId = selectedImages[0];
  } else {
    form.value.logoId = null;
  }
  showLogoSelector.value = false;
}

async function updateAreaPoiRelation(areaId) {
  window.confirm("Mieter in ein Anderes Haus umziehen?");
  const area = form.value.area;
  area.poiId = selectedHouseId.value || null;
  await fetch(import.meta.env.VITE_INTERNAL_API_URL + "/areas/" + areaId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("jwt")}`,
    },
    body: JSON.stringify({
      ...area
    }),
  });
  console.log("Area updated with new POI relation");
  selectedHouseId.value = "";
}

function handleMarketingImagesSelection(selectedImages) {
  console.log("Marketing images selection:", selectedImages);
  form.value.marketingImageIds = selectedImages || [];
  showMarketingImagesSelector.value = false;
}

function removeMarketingImage(imageId) {
  form.value.marketingImageIds = form.value.marketingImageIds.filter(
    (id) => id !== imageId
  );
}

function getImageUrl(imageId) {
  console.log("Form: ", form.value);
  if (!imageId) return "";
  const image = images.value.find((img) => img.id === imageId);
  if (!image) return "";
  return `${import.meta.env.VITE_INTERNAL_IMAGE_URL}${image.url}`;
}

// Add images ref to store all available images
const images = ref([]);

// Add function to load images
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

function handleOpeningHoursUpdate(newOpeningHours) {
  console.log("Opening hours updated:", newOpeningHours);
  form.value.openingHours = newOpeningHours;
}

async function saveRenter() {
  try {
    console.log("Saving renter with form data:", form.value);
    const renterData = {
      name: form.value.name,
      operator: form.value.operator || "",
      address: form.value.address || "",
      phone: form.value.phone || "",
      email: form.value.email || "",
      website: form.value.website || "",
      logoId: form.value.logoId,
      marketingImageIds: form.value.marketingImageIds,
      openingHours: JSON.stringify(form.value.openingHours),
      description: form.value.description || "",
      poiId: props.poiId,

      // Area-Informationen, falls vorhanden
      area: form.value.hasArea
        ? {
            squaremeters: form.value.area.squaremeters || 0,
            costs: form.value.area.costs || 0,
            isAvailable: form.value.area.isAvailable || false,
            advertised: form.value.area.advertised || false,
            showByDefault: form.value.area.showByDefault || true,
            areaGeoJson: form.value.area.areaGeoJson || null,
            floorId: selectedFloorId.value || null,
            metadata: {
              createdAt: new Date().toISOString(),
              lastModified: new Date().toISOString(),
            },
          }
        : null,

      metadata: {
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        status: "active",
      },
    };

    console.log("Renter data to save:", renterData);

    const url = props.editingRenter
      ? `${import.meta.env.VITE_INTERNAL_API_URL}/renters/${
          props.editingRenter.id
        }`
      : `${import.meta.env.VITE_INTERNAL_API_URL}/renters`;

    const response = await fetch(url, {
      method: props.editingRenter ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(renterData),
    });

    if (!response.ok) throw new Error("Failed to save renter");

    const savedRenter = await response.json();
    console.log("Saved renter:", savedRenter);

    emit("renter-saved", savedRenter);
    closeModal();
  } catch (error) {
    console.error("Error saving renter:", error);
    alert("Fehler beim Speichern des Mieters");
  }
}

function closeModal() {
  emit("update:modelValue", false);
}
</script>

<style scoped>
label {
  cursor: pointer;
}
</style>
