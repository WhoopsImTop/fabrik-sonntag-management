<template>
  <div class="bg-white rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Mediathek</h3>
      <div class="flex gap-2">
        <button
          type="button"
          @click="openUploadDialog"
          class="px-3 py-1.5 text-sm bg-yellow-400 rounded-md hover:bg-yellow-500"
        >
          Bild hochladen
        </button>
        <button
          v-if="selectedImages.length > 0"
          type="button"
          @click="confirmSelection"
          class="px-3 py-1.5 text-sm bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          {{ isMultiSelect ? `${selectedImages.length} Bilder auswählen` : 'Bild auswählen' }}
        </button>
      </div>
    </div>

    <!-- Image Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div
        v-for="image in images"
        :key="image.id"
        class="relative group aspect-square border rounded-lg overflow-hidden cursor-pointer"
        :class="{ 'ring-2 ring-yellow-400': selectedImages.includes(image.id) }"
      >
        <img
          :src="getImageUrl(image.url)"
          :alt="image.name || 'Image'"
          class="w-full h-full object-cover"
          @click="toggleImageSelection(image.id)"
        />
        <div 
          class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
        >
          <button
            type="button"
            @click.stop="toggleImageSelection(image.id)"
            class="p-2 text-white hover:text-yellow-400"
            :title="selectedImages.includes(image.id) ? 'Auswahl aufheben' : 'Auswählen'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5" v-if="selectedImages.includes(image.id)" />
              <path d="M12 5v14M5 12h14" v-else />
            </svg>
          </button>
          <button
            type="button"
            @click.stop="deleteImage(image.id)"
            class="p-2 text-white hover:text-red-400"
            title="Bild löschen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Dialog -->
    <div
      v-if="showUploadDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-4 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">Bild hochladen</h3>
        
        <div
          class="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
        >
          <input
            type="file"
            ref="fileInput"
            accept="image/*"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
          <div class="space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p class="text-sm text-neutral-600">
              Dateien hierher ziehen oder
              <button
                type="button"
                @click="$refs.fileInput.click()"
                class="text-yellow-500 hover:text-yellow-600"
              >
                durchsuchen
              </button>
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-4">
          <button
            type="button"
            @click="showUploadDialog = false"
            class="px-3 py-1.5 text-sm bg-neutral-100 rounded-md hover:bg-neutral-200"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  isMultiSelect: {
    type: Boolean,
    default: false
  },
  initialSelection: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:selectedImages', 'images-selected']);

const images = ref([]);
const selectedImages = ref([...props.initialSelection]);
const showUploadDialog = ref(false);
const fileInput = ref(null);

onMounted(async () => {
  await loadImages();
});

async function loadImages() {
  try {
    const response = await fetch(`http://localhost:3001/api/media`);
    if (!response.ok) throw new Error('Failed to load images');
    images.value = await response.json();
  } catch (error) {
    console.error('Error loading images:', error);
    alert('Fehler beim Laden der Bilder');
  }
}

function openUploadDialog() {
  showUploadDialog.value = true;
}

async function handleFileSelect(event) {
  const files = event.target.files;
  await uploadFiles(files);
}

async function handleFileDrop(event) {
  const files = event.dataTransfer.files;
  await uploadFiles(files);
}

async function uploadFiles(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  try {
    const response = await fetch(`http://localhost:3001/api/media/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to upload images');
    
    const data = await response.json();
    if (data.files && Array.isArray(data.files)) {
      await loadImages();
    }
    showUploadDialog.value = false;
  } catch (error) {
    console.error('Error uploading images:', error);
    alert('Fehler beim Hochladen der Bilder');
  }
}

async function deleteImage(imageId) {
  if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) return;

  try {
    const response = await fetch(`http://localhost:3001/api/media/${imageId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete image');
    
    images.value = images.value.filter(img => img.id !== imageId);
    selectedImages.value = selectedImages.value.filter(id => id !== imageId);
  } catch (error) {
    console.error('Error deleting image:', error);
    alert('Fehler beim Löschen des Bildes');
  }
}

function toggleImageSelection(imageId) {
  console.log('Toggling selection for image:', imageId);
  if (props.isMultiSelect) {
    const index = selectedImages.value.indexOf(imageId);
    if (index === -1) {
      selectedImages.value.push(imageId);
    } else {
      selectedImages.value.splice(index, 1);
    }
  } else {
    selectedImages.value = [imageId];
  }
  console.log('Current selection:', selectedImages.value);
  emit('images-selected', selectedImages.value);
}

function confirmSelection() {
  emit('images-selected', selectedImages.value);
}

// Watch for initialSelection changes
watch(() => props.initialSelection, (newSelection) => {
  selectedImages.value = [...newSelection];
}, { immediate: true });

function getImageUrl(url) {
  if (!url) return '';
  // If the URL is already absolute, return it as is
  if (url.startsWith('http')) return url;
  // Otherwise, prepend the base URL
  return `http://localhost:3001${url}`;
}
</script> 