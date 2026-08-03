<template>
  <div class="space-y-4">
    <div v-if="!hideHeader" class="flex items-center justify-between gap-3">
      <div>
        <h3 class="text-lg font-medium">360°-Tour</h3>
        <p class="text-xs text-neutral-500 mt-0.5">
          Mehrere Räume als Szenen verknüpfen
        </p>
      </div>
    </div>

    <p
      v-if="!poiId"
      class="text-sm text-amber-700 bg-amber-50 border border-amber-100 p-2"
    >
      Bitte zuerst den POI speichern, bevor Szenen angelegt werden.
    </p>

    <div v-else-if="loading" class="text-sm text-neutral-500">
      Szenen werden geladen…
    </div>

    <div
      v-else-if="scenes.length === 0"
      class="text-sm text-neutral-500 italic"
    >
      Noch keine 360°-Szenen vorhanden
    </div>

    <div v-else>
      <div
        v-for="(scene, index) in scenes"
        :key="scene.id"
        :draggable="scenes.length > 1"
        class="border-b border-neutral-200 py-2 transition-all"
        :class="{
          'cursor-move': scenes.length > 1,
          'bg-neutral-50': isDragging && draggedIndex === index,
        }"
        @dragstart="handleDragStart($event, index)"
        @dragend="handleDragEnd"
        @dragover.prevent
        @drop="handleDrop($event, index)"
      >
        <div class="flex items-center gap-3">
          <div v-if="scenes.length > 1" class="text-neutral-400 shrink-0">
            <UiIcon name="i-lucide-grip-vertical" class="h-5 w-5" />
          </div>
          <div
            class="h-10 w-16 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100"
          >
            <img
              v-if="scene.media?.url"
              :src="mediaUrl(scene.media.url)"
              :alt="scene.title"
              class="h-full w-full object-cover"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-medium truncate">{{ scene.title }}</h4>
              <span
                v-if="scene.isDefault"
                class="text-[10px] uppercase tracking-wide bg-neutral-900 text-white px-1.5 py-0.5"
              >
                Start
              </span>
            </div>
            <p class="text-xs text-neutral-500 mt-0.5">
              {{ scene.hotspots?.length || 0 }} Hotspots
            </p>
          </div>
          <div class="flex gap-1 shrink-0">
            <button
              v-if="!scene.isDefault"
              type="button"
              class="p-1 border border-neutral-200 hover:bg-neutral-50 text-xs px-2"
              title="Als Startszene setzen"
              @click="setDefault(scene)"
            >
              Start
            </button>
            <button
              type="button"
              class="p-1 rounded-none border border-neutral-200 hover:bg-neutral-50 flex items-center justify-center"
              title="Bearbeiten"
              @click="editingScene = scene"
            >
              <IconEdit class="h-3 w-3" />
            </button>
            <button
              type="button"
              class="p-1 rounded-none border border-neutral-200 hover:bg-neutral-50 text-red-500 flex items-center justify-center"
              title="Löschen"
              @click="deleteScene(scene)"
            >
              <IconTrash class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-end mt-4">
      <button
        type="button"
        class="btn-dialog-primary"
        :disabled="!poiId"
        @click="openAddScene"
      >
        Szene hinzufügen
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="showAddDialog"
        class="dialog-overlay z-[70]"
        role="dialog"
        aria-modal="true"
      >
        <div class="absolute inset-0" @click="closeAddDialog" />
        <div class="dialog-panel max-w-lg relative z-10">
          <div class="dialog-header">
            <h3 class="dialog-title">Neue 360°-Szene</h3>
            <button
              type="button"
              class="dialog-close"
              aria-label="Schließen"
              @click="closeAddDialog"
            >
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <div class="dialog-body space-y-4">
            <div class="flex flex-col gap-1">
              <label class="dialog-label">Raumtitel</label>
              <input
                v-model.trim="newSceneTitle"
                type="text"
                class="dialog-input"
                placeholder="z. B. Eingang, Flur, Büro"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label class="dialog-label">360°-Bild</label>
              <div
                v-if="newSceneMedia"
                class="flex items-center gap-3 border border-neutral-200 p-2"
              >
                <img
                  :src="mediaUrl(newSceneMedia.url)"
                  alt=""
                  class="h-16 w-24 object-cover"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm truncate">
                    {{ newSceneMedia.name || "Bild" }}
                  </p>
                  <button
                    type="button"
                    class="text-xs text-red-600 mt-1"
                    @click="newSceneMedia = null"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
              <button
                type="button"
                class="btn-dialog-cancel"
                @click="showMediaLibrary = true"
              >
                {{
                  newSceneMedia ? "Anderes Bild wählen" : "Aus Mediathek wählen"
                }}
              </button>
            </div>
          </div>
          <div class="dialog-footer">
            <button
              type="button"
              class="btn-dialog-cancel"
              @click="closeAddDialog"
            >
              Abbrechen
            </button>
            <button
              type="button"
              class="btn-dialog-primary"
              :disabled="!canCreate || creating"
              @click="createScene"
            >
              {{ creating ? "Wird angelegt…" : "Anlegen" }}
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="showMediaLibrary"
        class="dialog-overlay z-[80]"
        role="dialog"
        aria-modal="true"
      >
        <div class="absolute inset-0" @click="showMediaLibrary = false" />
        <div class="dialog-panel max-w-4xl relative z-10">
          <div class="dialog-header">
            <h3 class="dialog-title">360°-Bild auswählen</h3>
            <button
              type="button"
              class="dialog-close"
              aria-label="Schließen"
              @click="showMediaLibrary = false"
            >
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <div class="dialog-body">
            <MediaLibrary
              :is-multi-select="false"
              :initial-selection="newSceneMedia ? [newSceneMedia.id] : []"
              @images-selected="handleMediaSelected"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <SceneEditor
      v-if="editingScene"
      :scene="editingScene"
      :poi-id="poiId"
      :all-scenes="scenes"
      @close="closeEditor"
      @updated="onSceneUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import MediaLibrary from "@/components/app/MediaLibrary.vue";
import SceneEditor from "@/components/app/panorama/SceneEditor.vue";

const props = defineProps({
  poiId: {
    type: [Number, String],
    default: null,
  },
  hideHeader: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["changed"]);

const apiBase = import.meta.env.VITE_INTERNAL_API_URL;
const imageBase = import.meta.env.VITE_INTERNAL_IMAGE_URL;

const scenes = ref([]);
const loading = ref(false);
const showAddDialog = ref(false);
const showMediaLibrary = ref(false);
const newSceneTitle = ref("");
const newSceneMedia = ref(null);
const creating = ref(false);
const editingScene = ref(null);
const isDragging = ref(false);
const draggedIndex = ref(null);

const canCreate = computed(() =>
  Boolean(newSceneTitle.value && newSceneMedia.value?.id),
);

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
  };
}

function mediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${imageBase}${url}`;
}

async function loadScenes() {
  if (!props.poiId) {
    scenes.value = [];
    return;
  }
  loading.value = true;
  try {
    const res = await fetch(`${apiBase}/pois/${props.poiId}/panorama-scenes`);
    if (!res.ok) throw new Error("Laden fehlgeschlagen");
    scenes.value = await res.json();
  } catch (e) {
    console.error(e);
    scenes.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.poiId,
  () => {
    loadScenes();
  },
  { immediate: true },
);

function openAddScene() {
  newSceneTitle.value = "";
  newSceneMedia.value = null;
  showAddDialog.value = true;
}

function closeAddDialog() {
  showAddDialog.value = false;
  showMediaLibrary.value = false;
}

async function handleMediaSelected(ids) {
  const id = Array.isArray(ids) ? ids[0] : ids;
  showMediaLibrary.value = false;
  if (!id) return;
  try {
    const res = await fetch(`${apiBase}/media`);
    const all = await res.json();
    newSceneMedia.value = all.find((m) => m.id === id) || { id, url: "" };
  } catch {
    newSceneMedia.value = { id, url: "" };
  }
}

async function createScene() {
  if (!canCreate.value || !props.poiId) return;
  creating.value = true;
  try {
    const res = await fetch(`${apiBase}/pois/${props.poiId}/panorama-scenes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        title: newSceneTitle.value,
        mediaId: newSceneMedia.value.id,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Anlegen fehlgeschlagen");
    }
    closeAddDialog();
    await loadScenes();
    emit("changed");
  } catch (e) {
    alert(e.message || "Fehler beim Anlegen der Szene");
  } finally {
    creating.value = false;
  }
}

async function deleteScene(scene) {
  if (!confirm(`Szene „${scene.title}“ wirklich löschen?`)) return;
  try {
    const res = await fetch(`${apiBase}/panorama-scenes/${scene.id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Löschen fehlgeschlagen");
    await loadScenes();
    emit("changed");
  } catch (e) {
    alert(e.message || "Fehler beim Löschen");
  }
}

async function setDefault(scene) {
  try {
    const res = await fetch(`${apiBase}/panorama-scenes/${scene.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ isDefault: true }),
    });
    if (!res.ok) throw new Error("Aktualisieren fehlgeschlagen");
    await loadScenes();
    emit("changed");
  } catch (e) {
    alert(e.message || "Fehler");
  }
}

function handleDragStart(event, index) {
  isDragging.value = true;
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = "move";
}

function handleDragEnd() {
  isDragging.value = false;
  draggedIndex.value = null;
}

async function handleDrop(event, dropIndex) {
  event.preventDefault();
  const from = draggedIndex.value;
  if (from === null || from === dropIndex) {
    handleDragEnd();
    return;
  }
  const next = [...scenes.value];
  const [moved] = next.splice(from, 1);
  next.splice(dropIndex, 0, moved);
  scenes.value = next;
  handleDragEnd();

  try {
    const res = await fetch(
      `${apiBase}/pois/${props.poiId}/panorama-scenes/reorder`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          scenes: next.map((s, i) => ({
            id: s.id,
            sortOrder: i,
            isDefault: s.isDefault,
          })),
        }),
      },
    );
    if (!res.ok) throw new Error("Reihenfolge speichern fehlgeschlagen");
    scenes.value = await res.json();
    emit("changed");
  } catch (e) {
    alert(e.message || "Fehler beim Speichern der Reihenfolge");
    await loadScenes();
  }
}

function closeEditor() {
  editingScene.value = null;
}

async function onSceneUpdated() {
  await loadScenes();
  emit("changed");
}

defineExpose({ loadScenes });
</script>
