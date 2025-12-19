<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div
      class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <!-- Header -->
      <div class="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
        <h3 class="text-lg font-bold text-neutral-800">
          {{ form.id != null ? "Ressource bearbeiten" : "Neue Ressource erstellen" }}
        </h3>
        <button
          type="button"
          @click="closeModal"
          class="p-2 rounded-lg hover:bg-neutral-200 transition-colors"
        >
          <UIcon name="i-lucide-x" size="20" />
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="p-6 overflow-y-auto space-y-8 flex-1">
        
        <!-- Basic Info Section -->
        <section class="space-y-4">
            <h4 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">Basisdaten</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                    <input
                        v-model="form.name"
                        type="text"
                        required
                        class="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                        placeholder="z.B. Meetingraum Berlin"
                    />
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-neutral-700 mb-1">Beschreibung</label>
                    <textarea
                        v-model="form.description"
                        rows="3"
                        class="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                        placeholder="Kurze Beschreibung der Ressource..."
                    ></textarea>
                </div>
                
                <div>
                     <label class="block text-sm font-medium text-neutral-700 mb-1">Kategorie</label>
                      <select
                        v-model="form.categoryId"
                        class="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                      >
                        <option value="">Bitte wählen...</option>
                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                      </select>
                </div>
                 <div>
                     <label class="block text-sm font-medium text-neutral-700 mb-1">Kapazität</label>
                     <input
                        v-model="form.capacity"
                        type="number"
                        min="1"
                        class="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                    />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-1">Haus / Bereich</label>
                  <select
                     v-model="selectedHouseId"
                    @change="updateAreaPoiRelation(form.area?.id, selectedHouseId)"
                    class="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
                  >
                     <option value="" disabled>Bitte wählen...</option>
                    <option
                      v-for="house in allHouses"
                      :key="house.id"
                      :value="house.id"
                    >
                      {{ house.name }}
                    </option>
                  </select>
                </div>

                <div class="flex items-end pb-2">
                    <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-neutral-50 border border-transparent hover:border-neutral-200 transition-all w-full select-none">
                        <input
                            v-model="form.isActive"
                            type="checkbox"
                            class="w-4 h-4 text-yellow-500 rounded focus:ring-yellow-500"
                        />
                        <span class="text-sm font-medium text-neutral-700">Aktiv geschaltet</span>
                    </label>
                </div>
            </div>
        </section>

        <hr class="border-neutral-100" />

        <!-- Pricing Section -->
        <section class="space-y-4">
            <div class="flex justify-between items-center">
                <h4 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">Preispläne</h4>
                <button type="button" @click="addPrice" class="text-xs bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded border">
                    + Preisplan hinzufügen
                </button>
            </div>
            
            <div class="space-y-3">
                 <div
                  v-for="(p, index) in form.pricingPlans"
                  :key="index"
                  class="bg-neutral-50 p-3 rounded-lg border border-neutral-100 grid grid-cols-12 gap-2 items-end"
                >
                    <div class="col-span-3">
                        <label class="text-xs text-neutral-500 mb-0.5 block">Intervall</label>
                        <select v-model="p.interval" class="w-full p-1.5 text-sm border rounded">
                            <option value="HOUR">Stunde</option>
                            <option value="DAY">Tag</option>
                            <option value="MONTH">Monat</option>
                        </select>
                    </div>
                    <div class="col-span-3">
                        <label class="text-xs text-neutral-500 mb-0.5 block">Gewährt Mitgliedschaft</label>
                         <select v-model="p.grantsMembershipId" class="w-full p-1.5 text-sm border rounded">
                            <option :value="null">Keine</option>
                            <option v-for="m in memberships" :key="m.id" :value="m.id">{{ m.title }}</option>
                        </select>
                    </div>
                     <div class="col-span-3">
                        <label class="text-xs text-neutral-500 mb-0.5 block">Beschreibung</label>
                        <input type="text" v-model="p.description" class="w-full p-1.5 text-sm border rounded" placeholder="z.B. Studentenpreis" />
                    </div>
                     <div class="col-span-2">
                         <label class="text-xs text-neutral-500 mb-0.5 block">Preis (€)</label>
                        <input
                            type="number"
                            v-model="p.price"
                            min="0"
                            step="0.01"
                            class="w-full p-1.5 text-sm border rounded bg-white"
                            placeholder="0.00"
                        />
                     </div>
                     <div class="col-span-1 flex justify-center pb-2">
                         <button type="button" @click="removePrice(index)" class="text-red-500 hover:bg-red-50 p-1 rounded">
                             <UIcon name="i-lucide-trash-2" size="16" />
                         </button>
                     </div>
                </div>
                 <div v-if="!form.pricingPlans || form.pricingPlans.length === 0" class="text-center text-sm text-gray-500 py-4">
                    Keine Preispläne definiert.
                </div>
            </div>
        </section>

         <hr class="border-neutral-100" />

        <!-- Marketing Images -->
        <section class="space-y-4">
             <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Marketing Bilder</h4>
                 <button
                  type="button"
                  @click="showMarketingImagesSelector = true"
                  class="text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <UIcon name="i-lucide-plus" size="16"/>
                  Bilder hinzufügen
                </button>
             </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div
                  v-for="(imgObj, index) in form.images"
                  :key="index"
                  class="relative aspect-[4/3] bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200 group"
                >
                    <img
                        :src="getImageUrl(imgObj.mediaId)"
                        alt="Marketing Bild"
                        class="w-full h-full object-cover"
                        @error="(e) => e.target.src = '/placeholder-image.png'" 
                    />
                     <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button
                            type="button"
                            @click="removeMarketingImage(index)"
                            class="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors transform scale-90 group-hover:scale-100"
                        >
                            <UIcon name="i-lucide-trash-2" size="16" />
                        </button>
                    </div>
                </div>
                 <!-- Empty State -->
                <div v-if="!form.images || form.images.length === 0" class="col-span-full py-8 text-center text-neutral-400 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                    <UIcon name="i-lucide-image" class="mx-auto mb-2" size="24" />
                    <p class="text-sm">Keine Bilder ausgewählt</p>
                </div>
            </div>
        </section>

      </div>

      <!-- Footer Buttons -->
      <div class="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
        <button
          type="button"
          @click="closeModal"
          class="px-4 py-2 bg-white text-neutral-700 font-medium rounded-lg border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 transition-all shadow-sm"
        >
          Abbrechen
        </button>
        <button
          @click="saveresource"
          class="px-4 py-2 bg-yellow-400 text-white font-bold rounded-lg hover:bg-yellow-500 transition-all shadow-sm flex items-center gap-2"
        >
          <UIcon name="i-lucide-save" size="18" />
          {{ form.id != null ? "Speichern" : "Erstellen" }}
        </button>
      </div>
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
const showMarketingImagesSelector = ref(false);
const toast = useToast();

const images = ref([]);
const memberships = ref([]);
const categories = ref([]);

const initialForm = {
  id: null,
  name: "",
  description: "",
  categoryId: null,
  capacity: 1,
  pricingPlans: [],
  areaId: null,
  images: [], 
};

const form = ref(props.form ? JSON.parse(JSON.stringify(props.form)) : initialForm);

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
     toast.add({
        title: "Fehler",
        description: "Bilder konnten nicht geladen werden",
        color: "red",
        icon: "i-lucide-image-off"
    });
  }
}

async function loadMemberships() {
    try {
        const response = await fetch(
            `${import.meta.env.VITE_INTERNAL_API_URL}/admin/memberships`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`
                }
            }
        );
        if (response.ok) {
            memberships.value = await response.json();
        }
    } catch (e) {
        console.error("Failed to load memberships", e);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(
            `${import.meta.env.VITE_INTERNAL_API_URL}/admin/categories`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`
                }
            }
        );
        if (response.ok) {
            categories.value = await response.json();
        }
    } catch (e) {
        console.error("Failed to load categories", e);
    }
}

onMounted(async () => {
  await loadImages();
  await loadMemberships();
  await loadCategories();

  // Ensure pricingPlans array exists
  if (!form.value.pricingPlans) form.value.pricingPlans = [];
  
  // Ensure images array exists
  if (!form.value.images) form.value.images = [];
});

function addPrice() {
    form.value.pricingPlans.push({
        interval: 'HOUR',
        price: '0.00',
        description: '',
        grantsMembershipId: null
    });
}

function removePrice(index) {
    form.value.pricingPlans.splice(index, 1);
}

function getImageUrl(imageId) {
  if (!imageId) return "";
  const img = images.value.find((i) => i.id === imageId);
  return img ? `${import.meta.env.VITE_INTERNAL_IMAGE_URL}${img.url}` : "";
}

// Marketing Images
function handleMarketingImagesSelection(selectedImages) {
  // selectedImages is array of IDs from MediaLibrary
  // We need to append them to form.images as objects { mediaId: id }
  const newImages = selectedImages.map((imgId) => {
    return { mediaId: imgId, isPrimary: false };
  });
  
  // Clean up: avoid duplicates if needed, or just push
  form.value.images = [...form.value.images, ...newImages];
  
  showMarketingImagesSelector.value = false;
}

function removeMarketingImage(index) {
  form.value.images.splice(index, 1);
}

// Save Resource
async function saveresource() {
  try {
    // Step 1: Create/Update the Resource WITHOUT pricing plans
    const resourceData = {
      name: form.value.name,
      description: form.value.description,
      categoryId: form.value.categoryId,
      capacity: form.value.capacity,
      locationMetadata: null, // Can be extended later
      isActive: true
    };

    const url =
      form.value.id != null
        ? `${import.meta.env.VITE_INTERNAL_API_URL}/admin/resources/${form.value.id}`
        : `${import.meta.env.VITE_INTERNAL_API_URL}/admin/resources`;

    const response = await fetch(url, {
      method: form.value.id != null ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
      body: JSON.stringify(resourceData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save resource");
    }

    const savedResource = await response.json();

    // Step 2: Add pricing plans if any (only for newly created resources for now)
    // TODO: For editing, we'd need to handle plan updates/deletions separately
    if (!form.value.id && form.value.pricingPlans && form.value.pricingPlans.length > 0) {
      for (const plan of form.value.pricingPlans) {
        try {
          await fetch(
            `${import.meta.env.VITE_INTERNAL_API_URL}/admin/resources/${savedResource.id}/pricing`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
              },
              body: JSON.stringify({
                name: plan.description || `${plan.interval} Plan`,
                amount: parseFloat(plan.price),
                interval: plan.interval,
                currency: "EUR",
                grantsMembershipId: plan.grantsMembershipId || null,
                isActive: true
              }),
            }
          );
        } catch (planError) {
          console.error("Error adding pricing plan:", planError);
          // Continue with other plans even if one fails
        }
      }
    }

    emit("resource-saved", savedResource);
    closeModal();
    
    toast.add({
        title: "Gespeichert",
        description: `Ressource ${form.value.name} erfolgreich gespeichert.`,
        color: "green",
        icon: "i-lucide-check"
    });

  } catch (error) {
    console.error(error);
    toast.add({
        title: "Fehler",
        description: error.message || "Fehler beim Speichern der Ressource.",
        color: "red",
        icon: "i-lucide-x-circle"
    });
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
