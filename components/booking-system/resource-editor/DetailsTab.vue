<template>
  <div class="space-y-6 py-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Name</label>
        <input 
          v-model="form.name" 
          type="text" 
          placeholder="z.B. Konferenzraum A"
          class="flex h-9 w-full  border border-slate-200 bg-white px-3 py-1 text-sm  transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" 
        />
      </div>
      
      <div class="space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Kategorie</label>
        <select 
          v-model="form.category_id" 
          class="flex h-9 w-full  border border-slate-200 bg-white px-3 py-1 text-sm  transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
        >
          <option :value="null">Bitte wählen...</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Kapazität</label>
        <input 
          v-model.number="form.capacity" 
          type="number" 
          min="0"
          class="flex h-9 w-full  border border-slate-200 bg-white px-3 py-1 text-sm  transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" 
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Standort</label>
        <input 
          v-model="form.location_data" 
          type="text" 
          placeholder="z.B. 1. OG, Raum 102"
          class="flex h-9 w-full  border border-slate-200 bg-white px-3 py-1 text-sm  transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" 
        />
      </div>

      <div class="col-span-full space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Beschreibung</label>
        <textarea 
          v-model="form.description" 
          rows="4" 
          placeholder="Beschreiben Sie die Ausstattung..."
          class="flex min-h-[80px] w-full  border border-slate-200 bg-white px-3 py-2 text-sm  focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
        ></textarea>
      </div>

      <div class="col-span-full space-y-2">
        <label class="text-sm font-medium leading-none text-slate-900">Bild</label>
        <div class="flex items-center gap-4">
          <div
            class="relative flex h-24 w-32 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50"
          >
            <img
              v-if="form.image_url"
              :src="resolveImageUrl(form.image_url)"
              class="h-full w-full object-cover"
              alt="Ressourcenbild"
            />
            <span v-else class="px-2 text-center text-xs text-slate-400">Kein Bild</span>
          </div>
          <div class="flex flex-col gap-2">
            <button
              type="button"
              class="text-left text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
              @click="showMediaModal = true"
            >
              Bild wählen
            </button>
            <button
              v-if="form.image_url"
              type="button"
              class="text-left text-sm font-medium text-red-600 hover:text-red-700"
              @click="form.image_url = null"
            >
              Entfernen
            </button>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showMediaModal"
        class="dialog-overlay"
        role="dialog"
        aria-modal="true"
      >
        <div class="absolute inset-0" @click="showMediaModal = false" />
        <div class="dialog-panel max-w-4xl">
          <div class="dialog-header">
            <h3 class="dialog-title">Bild auswählen</h3>
            <button
              type="button"
              class="dialog-close"
              aria-label="Schließen"
              @click="showMediaModal = false"
            >
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <div class="dialog-body bg-neutral-50">
            <MediaLibrary
              :is-multi-select="false"
              @images-selected="onImagesSelected"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <div class="flex items-center justify-between border-t border-slate-100 pt-6">
      <button 
        type="button"
        class="btn-dialog-danger"
        @click="$emit('delete')" 
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        Ressource löschen
      </button>
      
      <button 
        @click="save" 
        :disabled="saving"
        class="btn-dialog-primary h-9"
      >
        <span v-if="saving" class="mr-2 h-3 w-3 animate-spin border-2 border-current border-t-transparent"></span>
        {{ saving ? 'Speichert...' : 'Änderungen speichern' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import MediaLibrary from "@/components/app/MediaLibrary.vue";

const props = defineProps<{
  resource: any
  categories: any[]
}>()

const emit = defineEmits(['update', 'delete'])
const api = useBookingApi()
const toast = useToast()
const saving = ref(false)
const showMediaModal = ref(false)

// Lokale Kopie für das Formular, um Mutation der Props zu vermeiden
const form = ref({ ...props.resource })

const resolveImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_INTERNAL_IMAGE_URL || ""}${url}`;
};

const onImagesSelected = async (ids: number[]) => {
  if (!ids.length) return;
  try {
    const token = localStorage.getItem("jwt");
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/media/${ids[0]}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) throw new Error("Medienabruf fehlgeschlagen");
    const media = await res.json();
    form.value.image_url = media.previewUrl || media.url;
    showMediaModal.value = false;
  } catch (e) {
    console.error(e);
    toast.add({ title: "Fehler beim Auswählen", color: "error" });
  }
};

const save = async () => {
  saving.value = true
  try {
    await api.resources.update(props.resource.id, form.value)
    emit('update') // Parent benachrichtigen zum Neuladen
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}
</script>