<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[90] flex flex-col bg-neutral-950 text-white"
      role="dialog"
      aria-modal="true"
      aria-label="360°-Szene bearbeiten"
    >
      <header
        class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 shrink-0"
      >
        <div class="min-w-0">
          <p class="text-xs text-white/60 uppercase tracking-wide">Szene bearbeiten</p>
          <h2 class="text-lg font-medium truncate">{{ localTitle }}</h2>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="border border-white/20 px-3 py-1.5 text-sm hover:bg-white/10"
            :class="{ 'bg-white/15': placeMode }"
            @click="togglePlaceMode"
          >
            {{ placeMode ? "Platzieren aktiv" : "Hotspot setzen" }}
          </button>
          <button
            type="button"
            class="border border-white/20 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            @click="saveMeta"
          >
            Speichern
          </button>
          <button
            type="button"
            class="bg-white text-neutral-900 px-3 py-1.5 text-sm font-medium"
            @click="$emit('close')"
          >
            Schließen
          </button>
        </div>
      </header>

      <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div class="relative min-h-[50vh] flex-1 lg:min-h-0">
          <div ref="viewerEl" class="absolute inset-0" />
          <p
            v-if="placeMode"
            class="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 bg-black/70 px-3 py-1.5 text-xs"
          >
            Klicke in die Szene, um einen Hotspot zu platzieren
          </p>
        </div>

        <aside
          class="w-full shrink-0 border-t border-white/10 bg-neutral-900 lg:w-96 lg:border-l lg:border-t-0 overflow-y-auto"
        >
          <div class="p-4 space-y-4">
            <div class="flex flex-col gap-1">
              <label class="text-xs text-white/60">Raumtitel</label>
              <input
                v-model.trim="localTitle"
                type="text"
                class="border border-white/20 bg-neutral-950 px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <h3 class="text-sm font-medium mb-2">Hotspots</h3>
              <ul v-if="hotspots.length" class="space-y-2">
                <li
                  v-for="hs in hotspots"
                  :key="hs.id"
                  class="border border-white/10 p-3"
                  :class="{ 'ring-1 ring-[#f5af06]': editingHotspot?.id === hs.id }"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-xs text-white/50">
                        {{ hs.type === "NAVIGATION" ? "Navigation" : "Info" }}
                      </p>
                      <p class="text-sm font-medium truncate">
                        {{ hotspotLabel(hs) }}
                      </p>
                    </div>
                    <div class="flex gap-1 shrink-0">
                      <button
                        type="button"
                        class="border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
                        @click="startEditHotspot(hs)"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        class="border border-red-500/40 text-red-300 px-2 py-1 text-xs hover:bg-red-500/10"
                        @click="removeHotspot(hs)"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
              <p v-else class="text-sm text-white/40 italic">
                Noch keine Hotspots
              </p>
            </div>

            <div
              v-if="draft"
              class="border border-[#f5af06]/40 bg-[#f5af06]/5 p-3 space-y-3"
            >
              <h3 class="text-sm font-medium">
                {{ draft.id ? "Hotspot bearbeiten" : "Neuer Hotspot" }}
              </h3>
              <div class="flex flex-col gap-1">
                <label class="text-xs text-white/60">Typ</label>
                <select
                  v-model="draft.type"
                  class="border border-white/20 bg-neutral-950 px-3 py-2 text-sm text-white"
                >
                  <option value="NAVIGATION">Navigation</option>
                  <option value="INFO">Info</option>
                </select>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs text-white/60">Titel</label>
                <input
                  v-model.trim="draft.title"
                  type="text"
                  class="border border-white/20 bg-neutral-950 px-3 py-2 text-sm text-white"
                  :placeholder="
                    draft.type === 'NAVIGATION'
                      ? 'Optionaler Anzeigename'
                      : 'Infotitel'
                  "
                />
              </div>
              <div v-if="draft.type === 'NAVIGATION'" class="flex flex-col gap-1">
                <label class="text-xs text-white/60">Zielszene</label>
                <select
                  v-model.number="draft.targetSceneId"
                  class="border border-white/20 bg-neutral-950 px-3 py-2 text-sm text-white"
                >
                  <option :value="null">Bitte wählen…</option>
                  <option
                    v-for="s in otherScenes"
                    :key="s.id"
                    :value="s.id"
                  >
                    {{ s.title }}
                  </option>
                </select>
              </div>
              <div v-else class="flex flex-col gap-1">
                <label class="text-xs text-white/60">Text</label>
                <textarea
                  v-model="draft.content"
                  rows="4"
                  class="border border-white/20 bg-neutral-950 px-3 py-2 text-sm text-white"
                  placeholder="Beschreibung / Hinweis"
                />
              </div>
              <p class="text-[11px] text-white/40">
                Position: yaw {{ formatAngle(draft.yaw) }}, pitch
                {{ formatAngle(draft.pitch) }}
              </p>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="border border-white/30 bg-transparent px-3 py-1.5 text-sm text-white hover:bg-white/10"
                  @click="cancelDraft"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  class="bg-[#f5af06] text-neutral-900 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
                  :disabled="!canSaveDraft || savingDraft"
                  @click="saveDraft"
                >
                  {{ savingDraft ? "Speichern…" : "Speichern" }}
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";

const CORPORATE_YELLOW = "#f5af06";
const CORPORATE_BLACK = "#171717";

const props = defineProps({
  scene: {
    type: Object,
    required: true,
  },
  poiId: {
    type: [Number, String],
    default: null,
  },
  allScenes: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "updated"]);

const apiBase = import.meta.env.VITE_INTERNAL_API_URL;
const imageBase = import.meta.env.VITE_INTERNAL_IMAGE_URL;

const viewerEl = ref(null);
const localTitle = ref(props.scene.title || "");
const hotspots = ref([]);
const placeMode = ref(false);
const draft = ref(null);
const editingHotspot = ref(null);
const savingDraft = ref(false);

let viewer = null;
let markersPlugin = null;
let clickHandler = null;
let readyHandler = null;

const otherScenes = computed(() =>
  (props.allScenes || []).filter((s) => s.id !== props.scene.id)
);

const canSaveDraft = computed(() => {
  if (!draft.value) return false;
  if (draft.value.type === "NAVIGATION") {
    return Boolean(draft.value.targetSceneId);
  }
  return Boolean(
    String(draft.value.title || "").trim() ||
      String(draft.value.content || "").trim()
  );
});

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

function formatAngle(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return "–";
  return `${(v * (180 / Math.PI)).toFixed(1)}°`;
}

function hotspotLabel(hs) {
  if (hs.type === "NAVIGATION") {
    const target =
      hs.targetScene?.title ||
      otherScenes.value.find((s) => s.id === hs.targetSceneId)?.title ||
      hs.title;
    return target ? `→ ${target}` : "Navigation";
  }
  return hs.title || "Info";
}

function markerHtml(hs) {
  const isNav = hs.type === "NAVIGATION";
  const bg = isNav ? CORPORATE_YELLOW : CORPORATE_BLACK;
  const color = isNav ? CORPORATE_BLACK : "#ffffff";
  const glyph = isNav ? "↗" : "i";
  return `<div style="width:32px;height:32px;border-radius:9999px;background:${bg};color:${color};display:flex;align-items:center;justify-content:center;font:700 14px/1 system-ui;box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid rgba(255,255,255,.85);cursor:pointer;">${glyph}</div>`;
}

function normalizeHotspot(hs) {
  return {
    ...hs,
    yaw: Number(hs.yaw),
    pitch: Number(hs.pitch),
  };
}

function syncMarkers() {
  if (!markersPlugin) return;
  markersPlugin.clearMarkers();
  for (const hs of hotspots.value) {
    const yaw = Number(hs.yaw);
    const pitch = Number(hs.pitch);
    if (!Number.isFinite(yaw) || !Number.isFinite(pitch)) continue;
    markersPlugin.addMarker({
      id: `hs-${hs.id}`,
      position: { yaw, pitch },
      html: markerHtml(hs),
      size: { width: 32, height: 32 },
      anchor: "center center",
      tooltip: hotspotLabel(hs),
      data: { hotspotId: hs.id },
    });
  }
}

async function loadHotspots() {
  const poiId = props.poiId || props.scene.poiId;
  try {
    if (!poiId) throw new Error("Keine POI-ID");
    const res = await fetch(`${apiBase}/pois/${poiId}/panorama-scenes`);
    if (!res.ok) throw new Error("Hotspots laden fehlgeschlagen");
    const scenes = await res.json();
    const current = scenes.find((s) => s.id === props.scene.id);
    hotspots.value = (current?.hotspots || []).map(normalizeHotspot);
  } catch (e) {
    console.error(e);
    hotspots.value = (props.scene.hotspots || []).map(normalizeHotspot);
  }
  syncMarkers();
}

function initViewer() {
  if (!viewerEl.value || !props.scene.media?.url) return;

  viewer = new Viewer({
    container: viewerEl.value,
    panorama: mediaUrl(props.scene.media.url),
    navbar: ["zoom", "move", "fullscreen"],
    defaultYaw: props.scene.initialYaw ?? 0,
    defaultPitch: props.scene.initialPitch ?? 0,
    plugins: [MarkersPlugin.withConfig({ markers: [] })],
  });

  markersPlugin = viewer.getPlugin(MarkersPlugin);

  readyHandler = () => {
    syncMarkers();
  };
  viewer.addEventListener("ready", readyHandler);

  clickHandler = ({ data }) => {
    if (!placeMode.value) return;
    if (data.marker) return;
    draft.value = {
      id: null,
      type: "NAVIGATION",
      yaw: data.yaw,
      pitch: data.pitch,
      title: "",
      content: "",
      targetSceneId: otherScenes.value[0]?.id ?? null,
    };
    placeMode.value = false;
  };
  viewer.addEventListener("click", clickHandler);

  markersPlugin.addEventListener("select-marker", ({ marker }) => {
    const id = marker?.data?.hotspotId;
    const hs = hotspots.value.find((h) => h.id === id);
    if (hs) startEditHotspot(hs);
  });
}

function destroyViewer() {
  if (viewer && clickHandler) {
    viewer.removeEventListener("click", clickHandler);
  }
  if (viewer && readyHandler) {
    viewer.removeEventListener("ready", readyHandler);
  }
  if (viewer) {
    viewer.destroy();
    viewer = null;
    markersPlugin = null;
  }
}

function togglePlaceMode() {
  placeMode.value = !placeMode.value;
  if (placeMode.value) {
    draft.value = null;
    editingHotspot.value = null;
  }
}

function startEditHotspot(hs) {
  editingHotspot.value = hs;
  placeMode.value = false;
  draft.value = {
    id: hs.id,
    type: hs.type,
    yaw: Number(hs.yaw),
    pitch: Number(hs.pitch),
    title: hs.title || "",
    content: hs.content || "",
    targetSceneId: hs.targetSceneId || null,
  };
}

function cancelDraft() {
  draft.value = null;
  editingHotspot.value = null;
}

async function saveDraft() {
  if (!canSaveDraft.value) return;
  savingDraft.value = true;
  try {
    const payload = {
      type: draft.value.type,
      yaw: Number(draft.value.yaw),
      pitch: Number(draft.value.pitch),
      title: draft.value.title || null,
      content: draft.value.type === "INFO" ? draft.value.content || null : null,
      targetSceneId:
        draft.value.type === "NAVIGATION" ? draft.value.targetSceneId : null,
    };

    let res;
    if (draft.value.id) {
      res = await fetch(`${apiBase}/panorama-hotspots/${draft.value.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(
        `${apiBase}/panorama-scenes/${props.scene.id}/hotspots`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(payload),
        }
      );
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Speichern fehlgeschlagen");
    }

    const saved = normalizeHotspot(await res.json());
    const idx = hotspots.value.findIndex((h) => h.id === saved.id);
    if (idx >= 0) hotspots.value[idx] = saved;
    else hotspots.value.push(saved);

    syncMarkers();
    cancelDraft();
    emit("updated");
  } catch (e) {
    alert(e.message || "Fehler beim Speichern");
  } finally {
    savingDraft.value = false;
  }
}

async function removeHotspot(hs) {
  if (!confirm("Hotspot wirklich löschen?")) return;
  try {
    const res = await fetch(`${apiBase}/panorama-hotspots/${hs.id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Löschen fehlgeschlagen");
    hotspots.value = hotspots.value.filter((h) => h.id !== hs.id);
    if (editingHotspot.value?.id === hs.id) cancelDraft();
    syncMarkers();
    emit("updated");
  } catch (e) {
    alert(e.message || "Fehler beim Löschen");
  }
}

async function saveMeta() {
  try {
    const res = await fetch(`${apiBase}/panorama-scenes/${props.scene.id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ title: localTitle.value }),
    });
    if (!res.ok) throw new Error("Speichern fehlgeschlagen");
    emit("updated");
  } catch (e) {
    alert(e.message || "Fehler");
  }
}

watch(
  () => [props.scene?.id, props.scene?.media?.url],
  async () => {
    localTitle.value = props.scene.title || "";
    destroyViewer();
    await nextTick();
    initViewer();
    await loadHotspots();
  }
);

onMounted(async () => {
  await nextTick();
  initViewer();
  await loadHotspots();
});

onBeforeUnmount(() => {
  destroyViewer();
});
</script>
