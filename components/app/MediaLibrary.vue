<template>
  <div class="flex min-h-0 flex-col gap-4">
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="relative min-w-0 flex-1 sm:max-w-sm">
        <UiIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
        />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Bilder suchen…"
          class="w-full rounded-none border border-neutral-200 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <button
          type="button"
          class="btn-dialog-cancel gap-2"
          :class="{ 'border-brand-accent bg-brand-accent/10': showUploadZone }"
          @click="showUploadZone = !showUploadZone"
        >
          <UiIcon name="i-lucide-upload" class="size-4" />
          {{ showUploadZone ? "Upload schließen" : "Hochladen" }}
        </button>
        <button
          type="button"
          class="btn-dialog-cancel gap-2 disabled:opacity-50"
          :disabled="selectedImages.length === 0 || isConverting"
          @click="convertSelectedToAvif"
        >
          <UiIcon
            :name="isConverting ? 'i-lucide-loader-2' : 'i-lucide-image'"
            class="size-4"
            :class="{ 'animate-spin': isConverting }"
          />
          {{ isConverting ? "Konvertiere…" : "Nach AVIF" }}
        </button>
        <button
          v-if="!manageOnly"
          type="button"
          class="btn-dialog-primary gap-2 disabled:opacity-50"
          :disabled="selectedImages.length === 0"
          @click="confirmSelection"
        >
          <UiIcon name="i-lucide-check" class="size-4" />
          {{ confirmLabel }}
        </button>
      </div>
    </div>

    <p class="text-xs text-neutral-500">
      <template v-if="manageOnly">
        Klicke zum Auswählen für AVIF oder Löschen.
        <span v-if="selectedImages.length">
          {{ selectedImages.length }} ausgewählt.
        </span>
      </template>
      <template v-else-if="isMultiSelect">
        Klicke zum Auswählen / Abwählen.
        <span v-if="selectedImages.length">
          {{ selectedImages.length }} ausgewählt.
        </span>
      </template>
      <template v-else>
        Klicke zum Auswählen, Doppelklick übernimmt sofort.
      </template>
    </p>

    <!-- Inline Upload -->
    <div
      v-if="showUploadZone"
      class="border border-dashed border-neutral-300 bg-neutral-50 p-6 transition-colors"
      :class="{
        'border-brand-accent bg-brand-accent/5': isDragging,
        'opacity-60': isUploading,
      }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleFileDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />
      <div class="flex flex-col items-center gap-2 text-center">
        <UiIcon
          :name="isUploading ? 'i-lucide-loader-2' : 'i-lucide-image-up'"
          class="size-10 text-neutral-400"
          :class="{ 'animate-spin': isUploading }"
        />
        <p class="text-sm text-neutral-700">
          <template v-if="isUploading">Wird hochgeladen…</template>
          <template v-else>
            Dateien hierher ziehen oder
            <button
              type="button"
              class="font-medium text-brand-accent hover:underline"
              @click="fileInput?.click()"
            >
              durchsuchen
            </button>
          </template>
        </p>
        <p class="text-xs text-neutral-400">
          PNG, JPG, WebP, AVIF — mehrere Dateien möglich
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex items-center justify-center gap-2 py-16 text-sm text-neutral-500"
    >
      <UiIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
      Bilder werden geladen…
    </div>

    <!-- Empty -->
    <div
      v-else-if="filteredImages.length === 0"
      class="flex flex-col items-center justify-center gap-3 border border-neutral-200 bg-neutral-50 py-16 text-center"
    >
      <UiIcon name="i-lucide-images" class="size-10 text-neutral-300" />
      <div>
        <p class="text-sm font-medium text-neutral-700">
          {{ searchQuery ? "Keine Treffer" : "Noch keine Bilder" }}
        </p>
        <p class="mt-1 text-xs text-neutral-500">
          {{
            searchQuery
              ? "Andere Suchbegriffe versuchen."
              : "Lade das erste Bild hoch, um zu starten."
          }}
        </p>
      </div>
      <button
        v-if="!searchQuery"
        type="button"
        class="btn-dialog-primary gap-2"
        @click="showUploadZone = true"
      >
        <UiIcon name="i-lucide-upload" class="size-4" />
        Bild hochladen
      </button>
    </div>

    <!-- Grid -->
    <div
      v-else
      class="grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      :class="manageOnly ? '' : 'max-h-[min(55vh,28rem)]'"
    >
      <button
        v-for="image in filteredImages"
        :key="image.id"
        type="button"
        class="group relative aspect-square overflow-hidden border bg-neutral-100 text-left transition-shadow focus:outline-none focus:ring-2 focus:ring-neutral-400"
        :class="
          selectedImages.includes(image.id)
            ? 'border-brand-accent ring-2 ring-brand-accent'
            : 'border-neutral-200 hover:border-neutral-400'
        "
        :title="imageMetaTitle(image)"
        @click="toggleImageSelection(image.id)"
        @dblclick="handleDoubleClick(image.id)"
      >
        <img
          :src="getImageUrl(image.previewUrl || image.url)"
          :alt="image.name || 'Bild'"
          class="h-full w-full object-contain"
          loading="lazy"
          draggable="false"
        />

        <span
          class="absolute left-2 top-2 flex size-5 items-center justify-center border text-xs"
          :class="
            selectedImages.includes(image.id)
              ? 'border-brand-accent bg-brand-accent text-white'
              : 'border-neutral-300 bg-white/90 text-transparent group-hover:text-neutral-300'
          "
        >
          <UiIcon name="i-lucide-check" class="size-3.5" />
        </span>

        <span
          role="button"
          tabindex="0"
          class="absolute right-2 top-2 flex size-7 items-center justify-center border border-neutral-200 bg-white/95 text-neutral-500 opacity-0 transition-opacity hover:border-red-200 hover:text-red-600 group-hover:opacity-100 group-focus-within:opacity-100"
          title="Löschen"
          @click.stop="deleteImage(image.id)"
          @keydown.enter.stop="deleteImage(image.id)"
        >
          <UiIcon name="i-lucide-trash" class="size-3.5" />
        </span>

        <span
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-6 text-white"
        >
          <span class="block truncate text-[11px] leading-tight">
            {{ image.name || `Bild #${image.id}` }}
          </span>
          <span class="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/80">
            <span class="uppercase tracking-wide">{{ fileExtension(image) }}</span>
            <span v-if="formatFileSize(image.size)" class="text-white/50">·</span>
            <span v-if="formatFileSize(image.size)">{{ formatFileSize(image.size) }}</span>
          </span>
        </span>
      </button>
    </div>

    <ConversionStatusModal
      :open="conversionOpen"
      :items="conversionItems"
      :current="conversionCurrent"
      :total="conversionTotal"
      :current-name="conversionCurrentName"
      :done="conversionDone"
      @close="conversionOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import ConversionStatusModal from "@/components/app/ConversionStatusModal.vue";

const props = defineProps({
  isMultiSelect: {
    type: Boolean,
    default: false,
  },
  initialSelection: {
    type: Array,
    default: () => [],
  },
  manageOnly: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:selectedImages", "images-selected"]);

const toast = useToast();
const { confirm } = useConfirm();

const images = ref([]);
const selectedImages = ref([...props.initialSelection]);
const showUploadZone = ref(false);
const fileInput = ref(null);
const searchQuery = ref("");
const loading = ref(true);
const isUploading = ref(false);
const isConverting = ref(false);
const isDragging = ref(false);
const conversionOpen = ref(false);
const conversionDone = ref(false);
const conversionItems = ref([]);
const conversionCurrent = ref(0);
const conversionTotal = ref(0);
const conversionCurrentName = ref("");

const allowMultiSelect = computed(
  () => props.manageOnly || props.isMultiSelect,
);

const filteredImages = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const list = [...images.value].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  if (!q) return list;
  return list.filter((img) => {
    const name = (img.name || "").toLowerCase();
    const id = String(img.id ?? "");
    return name.includes(q) || id.includes(q);
  });
});

const confirmLabel = computed(() => {
  const count = selectedImages.value.length;
  if (!count) return props.isMultiSelect ? "Auswählen" : "Übernehmen";
  if (props.isMultiSelect) {
    return count === 1 ? "1 Bild übernehmen" : `${count} Bilder übernehmen`;
  }
  return "Übernehmen";
});

onMounted(async () => {
  await loadImages();
});

async function loadImages({ silent = false } = {}) {
  if (!silent) loading.value = true;
  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/media`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      },
    );
    if (!response.ok) throw new Error("Failed to load images");
    images.value = await response.json();
  } catch (error) {
    console.error("Error loading images:", error);
    toast.add({ title: "Fehler beim Laden der Bilder", color: "error" });
  } finally {
    if (!silent) loading.value = false;
  }
}

async function handleFileSelect(event) {
  const files = event.target.files;
  await uploadFiles(files);
  if (fileInput.value) fileInput.value.value = "";
}

async function handleFileDrop(event) {
  isDragging.value = false;
  const files = event.dataTransfer.files;
  await uploadFiles(files);
}

async function uploadFiles(files) {
  if (!files?.length) return;

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  isUploading.value = true;
  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/media/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: formData,
      },
    );

    if (!response.ok) throw new Error("Failed to upload images");

    const data = await response.json();
    if (data.files && Array.isArray(data.files)) {
      await loadImages();
      if (!props.isMultiSelect && data.files.length === 1 && data.files[0].id) {
        selectedImages.value = [data.files[0].id];
      } else if (props.isMultiSelect && Array.isArray(data.files)) {
        const newIds = data.files.map((f) => f.id).filter(Boolean);
        selectedImages.value = [
          ...new Set([...selectedImages.value, ...newIds]),
        ];
      }
    }
    showUploadZone.value = false;
    toast.add({
      title:
        files.length === 1
          ? "Bild hochgeladen"
          : `${files.length} Bilder hochgeladen`,
      color: "green",
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    toast.add({ title: "Fehler beim Hochladen", color: "error" });
  } finally {
    isUploading.value = false;
  }
}

async function convertSelectedToAvif() {
  const ids = [...selectedImages.value];
  if (!ids.length || isConverting.value) return;

  const ok = await confirm({
    title: "Nach AVIF konvertieren?",
    message:
      ids.length === 1
        ? "Das ausgewählte Bild wird in AVIF umgewandelt. Verknüpfungen bleiben erhalten."
        : `${ids.length} ausgewählte Bilder werden in AVIF umgewandelt. Verknüpfungen bleiben erhalten.`,
    confirmLabel: "Konvertieren",
    variant: "warning",
  });
  if (!ok) return;

  conversionItems.value = ids.map((id) => {
    const img = images.value.find((item) => item.id === id);
    return {
      id,
      name: img?.name || `Bild #${id}`,
      status: "pending",
    };
  });
  conversionTotal.value = ids.length;
  conversionCurrent.value = 0;
  conversionCurrentName.value = conversionItems.value[0]?.name || "";
  conversionDone.value = false;
  conversionOpen.value = true;
  isConverting.value = true;

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
  };

  for (let i = 0; i < ids.length; i++) {
    const item = conversionItems.value[i];
    conversionCurrent.value = i + 1;
    conversionCurrentName.value = item.name;
    item.status = "running";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_INTERNAL_API_URL}/media/convert-avif`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ ids: [ids[i]] }),
        },
      );
      if (!response.ok) throw new Error("Konvertierung fehlgeschlagen");
      const data = await response.json();
      if (data.converted?.length) {
        item.status = "converted";
      } else if (data.skipped?.length) {
        item.status = "skipped";
      } else {
        item.status = "failed";
        item.error = data.failed?.[0]?.error || "Unbekannter Fehler";
      }
    } catch (error) {
      item.status = "failed";
      item.error = error.message || "Netzwerkfehler";
    }
  }

  conversionDone.value = true;
  isConverting.value = false;
  await loadImages({ silent: true });
}

async function deleteImage(imageId) {
  const ok = await confirm({
    title: "Bild löschen?",
    message: "Das Bild wird dauerhaft aus der Mediathek entfernt.",
    variant: "danger",
    confirmLabel: "Ja, löschen",
  });
  if (!ok) return;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/media/${imageId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      },
    );

    if (!response.ok) throw new Error("Failed to delete image");

    images.value = images.value.filter((img) => img.id !== imageId);
    selectedImages.value = selectedImages.value.filter((id) => id !== imageId);
    toast.add({ title: "Bild gelöscht", color: "green" });
  } catch (error) {
    console.error("Error deleting images:", error);
    toast.add({ title: "Fehler beim Löschen", color: "error" });
  }
}

function toggleImageSelection(imageId) {
  if (allowMultiSelect.value) {
    const index = selectedImages.value.indexOf(imageId);
    if (index === -1) {
      selectedImages.value.push(imageId);
    } else {
      selectedImages.value.splice(index, 1);
    }
  } else {
    // Single-select: always select (no toggle-off) so Doppelklick zuverlässig übernimmt
    selectedImages.value = [imageId];
  }
}

function handleDoubleClick(imageId) {
  if (allowMultiSelect.value || props.manageOnly) return;
  selectedImages.value = [imageId];
  confirmSelection();
}

function confirmSelection() {
  if (selectedImages.value.length === 0) return;
  emit("images-selected", [...selectedImages.value]);
}

watch(
  () => props.initialSelection,
  (newSelection) => {
    selectedImages.value = [...newSelection];
  },
  { immediate: true },
);

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_INTERNAL_IMAGE_URL}${url}`;
}

function fileExtension(image) {
  const source = image?.url || image?.name || "";
  const match = String(source).match(/\.([a-z0-9]+)(?:\?|$)/i);
  return match ? match[1] : "—";
}

function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

function imageMetaTitle(image) {
  const name = image?.name || `Bild #${image?.id}`;
  const ext = fileExtension(image);
  const size = formatFileSize(image?.size);
  return [name, ext.toUpperCase(), size].filter(Boolean).join(" · ");
}
</script>
