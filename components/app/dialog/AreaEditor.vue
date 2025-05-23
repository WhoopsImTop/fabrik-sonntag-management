<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" v-if="modelValue">
    <div class="bg-white rounded-lg p-4 w-full max-w-4xl h-[80vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold">Fläche bearbeiten</h3>
          <p class="text-sm text-neutral-500">{{ poi?.name }}</p>
        </div>
        <button
          type="button"
          @click="closeModal"
          class="p-2 rounded-md hover:bg-neutral-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="flex gap-4 flex-1 min-h-0">
        <!-- Map Area -->
        <div class="flex-1 border rounded-lg overflow-hidden relative">
          <div ref="mapContainer" class="w-full h-full"></div>
          
          <!-- Drawing Controls -->
          <div class="absolute top-4 right-4 flex gap-2">
            <button
              @click="startDrawing"
              class="p-2 bg-white rounded-md shadow hover:bg-neutral-50"
              :class="{ 'bg-yellow-100': isDrawing }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <path d="M2 2l7.586 7.586"/>
                <path d="M11 11l4 4"/>
              </svg>
            </button>
            <button
              v-if="hasArea"
              @click="deleteArea"
              class="p-2 bg-white rounded-md shadow hover:bg-red-50 text-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Floor Management -->
        <div class="w-72 border rounded-lg p-4 flex flex-col">
          <h4 class="font-medium mb-4">Etagen</h4>
          
          <!-- Floor Selection -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Etage auswählen</label>
            <select
              v-model="selectedFloorId"
              class="w-full p-2 border rounded-md"
              @change="handleFloorSelection"
            >
              <option value="">Keine Etage ausgewählt</option>
              <option v-for="floor in floors" :key="floor.id" :value="floor.id">
                {{ floor.name }} (Level: {{ floor.level }})
              </option>
            </select>
          </div>
          
          <div class="space-y-4 flex-1 overflow-auto">
            <div v-for="floor in floors" :key="floor.id" class="p-3 border rounded-lg">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium">{{ floor.name }}</p>
                  <p class="text-sm text-neutral-500">Level: {{ floor.level }}</p>
                </div>
                <div class="flex gap-2">
                  <button @click="editFloor(floor)" class="p-1 hover:bg-neutral-100 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button @click="deleteFloor(floor.id)" class="p-1 hover:bg-red-50 text-red-500 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="showFloorForm = true"
            class="mt-4 w-full py-2 px-4 bg-yellow-400 rounded-md hover:bg-yellow-500 text-sm font-medium"
          >
            Etage hinzufügen
          </button>
        </div>
      </div>
    </div>

    <!-- Floor Form Modal -->
    <div v-if="showFloorForm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-4 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">{{ editingFloor ? 'Etage bearbeiten' : 'Neue Etage' }}</h3>
        
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
            <label class="block text-sm font-medium mb-1">Beschreibung</label>
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
              {{ editingFloor ? 'Speichern' : 'Hinzufügen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import MaplibreDraw from '@mapbox/mapbox-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  poi: {
    type: Object,
    required: true
  },
  area: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'area-saved']);

const mapContainer = ref(null);
const map = ref(null);
const draw = ref(null);
const isDrawing = ref(false);
const floors = ref([]);
const showFloorForm = ref(false);
const editingFloor = ref(null);
const hasArea = ref(!!props.area);
const selectedFloorId = ref('');

const floorForm = ref({
  name: '',
  level: 0,
  description: ''
});

// Map initialization
onMounted(async () => {
  if (!mapContainer.value) return;

  // Initialize map
  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {},
      layers: [{
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#ffffff' }
      }]
    },
    center: [0, 0],
    zoom: 2
  });

  // Initialize draw
  draw.value = new MaplibreDraw({
    displayControlsDefault: false,
    controls: {
      polygon: true,
      trash: true
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
          "circle-stroke-color": "#ffffff"
        }
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
          "circle-stroke-color": "#ffffff"
        }
      },
      // Aktive Polygon Fill
      {
        id: "gl-draw-polygon-fill-active",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
        paint: {
          "fill-color": "#cccccc",
          "fill-outline-color": "#ff9800",
          "fill-opacity": 0.4
        }
      },
      // Inaktive Polygon Fill
      {
        id: "gl-draw-polygon-fill",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "false"]],
        paint: {
          "fill-color": "#cccccc",
          "fill-outline-color": "#ff9800",
          "fill-opacity": 0.2
        }
      },
      // Polygon Stroke - für aktive Bearbeitung
      {
        id: "gl-draw-polygon-stroke-active",
        type: "line",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
        paint: {
          "line-color": "#ff9800",
          "line-width": 3,
          "line-dasharray": ["literal", [2, 2]]
        }
      },
      // Polygon Stroke - für inaktive Polygone
      {
        id: "gl-draw-polygon-stroke",
        type: "line",
        filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "false"]],
        paint: {
          "line-color": "#ff9800",
          "line-width": 2
        }
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
          "circle-stroke-width": 2
        }
      }
    ]
  });

  map.value.addControl(draw.value);

  // Add POI polygon
  map.value.on('load', () => {
    if (props.poi.areaGeoJson) {
      // Add POI polygon as source
      map.value.addSource('poi-polygon', {
        type: 'geojson',
        data: props.poi.areaGeoJson
      });

      // Add POI polygon layer
      map.value.addLayer({
        id: 'poi-polygon',
        type: 'fill',
        source: 'poi-polygon',
        paint: {
          'fill-color': '#cccccc',
          'fill-opacity': 0.4,
          'fill-outline-color': '#000000'
        }
      });

      // Fit map to POI polygon
      const bounds = new maplibregl.LngLatBounds();
      props.poi.areaGeoJson.geometry.coordinates[0].forEach(coord => {
        bounds.extend(coord);
      });
      map.value.fitBounds(bounds, { padding: 50 });

      // If area exists, add it to draw
      if (props.area?.areaGeoJson) {
        draw.value.add(props.area.areaGeoJson);
      }
    }
  });

  // Load floors
  loadFloors();
});

onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
});

// Floor management
async function loadFloors() {
  if (!props.area?.id) return;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/floors`);
    if (!response.ok) throw new Error('Failed to load floors');
    floors.value = await response.json();
  } catch (error) {
    console.error('Error loading floors:', error);
    alert('Fehler beim Laden der Etagen');
  }
}

function editFloor(floor) {
  editingFloor.value = floor;
  floorForm.value = { ...floor };
  showFloorForm.value = true;
}

async function deleteFloor(id) {
  if (!confirm('Möchten Sie diese Etage wirklich löschen?')) return;

  try {
    const response = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/floors/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete floor');
    floors.value = floors.value.filter(f => f.id !== id);
  } catch (error) {
    console.error('Error deleting floor:', error);
    alert('Fehler beim Löschen der Etage');
  }
}

async function saveFloor() {
  try {
    const url = editingFloor.value
      ? `${import.meta.env.VITE_INTERNAL_API_URL}/floors/${editingFloor.value.id}`
      : `${import.meta.env.VITE_INTERNAL_API_URL}/floors`;
    
    const response = await fetch(url, {
      method: editingFloor.value ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...floorForm.value,
        areaId: props.area.id
      })
    });

    if (!response.ok) throw new Error('Failed to save floor');
    
    const savedFloor = await response.json();
    
    if (editingFloor.value) {
      const index = floors.value.findIndex(f => f.id === savedFloor.id);
      if (index !== -1) floors.value[index] = savedFloor;
    } else {
      floors.value.push(savedFloor);
      // Automatisch den neu erstellten Floor auswählen
      selectedFloorId.value = savedFloor.id;
      await updateAreaWithFloor(savedFloor.id);
    }

    showFloorForm.value = false;
    editingFloor.value = null;
    floorForm.value = { name: '', level: 0, description: '' };
  } catch (error) {
    console.error('Error saving floor:', error);
    alert('Fehler beim Speichern der Etage');
  }
}

// Neue Hilfsfunktion zum Aktualisieren der Area mit einer floorId
async function updateAreaWithFloor(floorId) {
  if (!props.area?.id) return;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/areas/${props.area.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...props.area,
        floorId: floorId || null
      })
    });

    if (!response.ok) throw new Error('Failed to update area');
    
    const updatedArea = await response.json();
    emit('area-saved', updatedArea);
  } catch (error) {
    console.error('Error updating area with floor:', error);
    alert('Fehler beim Aktualisieren der Fläche');
  }
}

// Überarbeitete handleFloorSelection Funktion
async function handleFloorSelection() {
  await updateAreaWithFloor(selectedFloorId.value);
}

// Area management
function startDrawing() {
  isDrawing.value = !isDrawing.value;
  if (isDrawing.value) {
    draw.value.changeMode('draw_polygon');
  } else {
    draw.value.changeMode('simple_select');
  }
}

async function deleteArea() {
  if (!confirm('Möchten Sie diese Fläche wirklich löschen?')) return;

  try {
    const response = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/areas/${props.area.id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete area');
    emit('area-saved', null);
    closeModal();
  } catch (error) {
    console.error('Error deleting area:', error);
    alert('Fehler beim Löschen der Fläche');
  }
}

function closeModal() {
  emit('update:modelValue', false);
}

// Watch for draw changes
watch(() => draw.value?.getAll(), (newGeojson) => {
  if (!newGeojson || !props.poi?.id) return;

  // Only allow one polygon
  if (newGeojson.features.length > 1) {
    const [keep, ...remove] = newGeojson.features;
    remove.forEach(f => draw.value.delete(f.id));
  }

  // Update area if changed
  if (newGeojson.features.length === 1) {
    const feature = newGeojson.features[0];
    emit('area-saved', {
      ...props.area,
      areaGeoJson: feature,
      poiId: props.poi.id,
      floorId: selectedFloorId.value || null // Behalte die ausgewählte floorId bei
    });
  }
}, { deep: true });

// Watch für area prop um selectedFloorId zu aktualisieren
watch(() => props.area, (newArea) => {
  if (newArea?.floorId) {
    selectedFloorId.value = newArea.floorId;
  } else {
    selectedFloorId.value = '';
  }
}, { immediate: true });
</script>

<style scoped>
.maplibregl-canvas {
  border-radius: 0.5rem;
}
</style> 