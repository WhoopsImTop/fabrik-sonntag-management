<template>
  <div
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    v-if="modelValue"
  >
    <div class="bg-white rounded-lg p-4 w-full max-w-lg">
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

      <form @submit.prevent="saveRenter" class="space-y-4">
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M12 19l7-7 3 3-7 7-3-3z" />
                    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    <path d="M2 2l7.586 7.586" />
                    <path d="M11 11l-4 4" />
                  </svg>
                </button>
                <button
                  v-if="isDrawing"
                  @click="confirmDrawing"
                  class="p-2 rounded-md border bg-green-100 border-green-500 hover:bg-green-200"
                  title="Zeichnung bestätigen"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
                <button
                  @click="deleteArea"
                  class="p-2 rounded-md border hover:bg-red-50 hover:border-red-500"
                  v-if="form.area.areaGeoJson"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M3 6h18" />
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    />
                  </svg>
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
                      <button
                        type="button"
                        @click.stop="editFloor(floor)"
                        class="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        @click.stop="deleteFloor(floor.id)"
                        class="p-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 text-red-500"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <path d="M3 6h18" />
                          <path
                            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                          />
                        </svg>
                      </button>
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

                <form @submit.prevent="saveFloor" class="space-y-4">
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
                </form>
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
            type="submit"
            class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
          >
            {{ editingRenter ? "Speichern" : "Hinzufügen" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import maplibregl from "maplibre-gl";
import MaplibreDraw from "@mapbox/mapbox-gl-draw";
import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

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
const selectedFloorId = ref("");

const initialForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  hasArea: false,
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
  watch(() => form.value.hasArea, (hasArea) => {
    if (hasArea && !map.value) {
      initializeMap();
    }
  });

  // Load floors immediately when component mounts
  await loadFloors();
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

function initializeMap() {
  if (!mapContainer.value) return;

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
    const response = await fetch(`http://localhost:3001/api/floors`);
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
    const response = await fetch(`http://localhost:3001/api/floors/${id}`, {
      method: "DELETE",
    });
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
      ? `http://localhost:3001/api/floors/${editingFloor.value.id}`
      : "http://localhost:3001/api/floors";

    const response = await fetch(url, {
      method: editingFloor.value ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
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

// Watch for hasArea changes
watch(
  () => form.value.hasArea,
  async (hasArea) => {
    console.log("hasArea changed:", hasArea);
    if (hasArea && !map.value) {
      console.log("Initializing map due to hasArea change");
      await initializeMap();
    }
  }
);

// Modify the watch for editingRenter
watch(() => props.editingRenter, async (renter) => {
  console.log("Editing renter changed:", renter);
  if (renter) {
    form.value = {
      ...renter,
      hasArea: !!renter.area,
      area: renter.area || { ...initialForm.area },
    };

    // Initialize map if area exists and not already initialized
    if (!map.value && form.value.hasArea) {
      console.log("Initializing map for existing area");
      await initializeMap();
    }

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
}, { immediate: true });

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

async function saveRenter() {
  try {
    // Strukturiertes Renter-Objekt erstellen
    const renterData = {
      name: form.value.name,
      operator: form.value.operator || "",
      address: form.value.address || "",
      phone: form.value.phone || "",
      email: form.value.email || "",
      website: form.value.website || "",
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

    console.log("Renter Objekt zum Speichern:", renterData);

    const url = props.editingRenter
      ? `http://localhost:3001/api/renters/${props.editingRenter.id}`
      : "http://localhost:3001/api/renters";

    const response = await fetch(url, {
      method: props.editingRenter ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(renterData),
    });

    if (!response.ok) throw new Error("Failed to save renter");

    const savedRenter = await response.json();
    console.log("Gespeicherter Renter:", savedRenter);

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
