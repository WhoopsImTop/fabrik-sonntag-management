<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">
      Unternehmenseinstellungen
    </h1>

    <div
      class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6"
    >
      <div class="flex items-start gap-6 border-b border-slate-100 pb-6">
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-2">Firmenlogo</label>
          <div class="flex items-center gap-4">
            <div 
              class="h-24 w-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative group"
            >
              <img 
                v-if="form.logo_url" 
                :src="getImageUrl(form.logo_url)" 
                class="w-full h-full object-contain" 
                alt="Logo"
              />
              <span v-else class="text-xs text-slate-400">Kein Logo</span>
            </div>
            <div class="flex flex-col gap-2">
               <button 
                  type="button"
                  @click="showMediaModal = true"
                  class="text-sm font-medium text-blue-600 hover:text-blue-700 text-left"
                >
                  Logo auswählen
                </button>
                <button 
                  v-if="form.logo_url"
                  type="button"
                  @click="form.logo_url = null"
                  class="text-sm font-medium text-red-600 hover:text-red-700 text-left"
                >
                  Löschen
                </button>
            </div>
          </div>
          <p class="text-xs text-slate-500 mt-2">Dieses Logo wird auf Rechnungen und Dokumenten verwendet.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Firmenname</label
          >
          <input
            v-model="form.company_name"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >E-Mail (Absender)</label
          >
          <input
            v-model="form.email"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Straße & Hausnr.</label
          >
          <input
            v-model="form.street"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-sm font-medium text-slate-700">PLZ</label>
            <input
              v-model="form.zip_code"
              class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700"
              >Stadt</label
            >
            <input
              v-model="form.city"
              class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Footer Text</label
          >
          <input
            v-model="form.footer_text"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Telefon</label
          >
          <input
            v-model="form.phone"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Webseite</label
          >
          <input
            v-model="form.website"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Benachrichtigungs-Emails (Buchungen)</label
          >
          <input
            v-model="form.notification_emails"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
            placeholder="email@example.com"
          />
        </div>
      </div>

      <hr class="border-slate-100" />

      <h3 class="text-lg font-medium text-slate-900">
        Bankverbindung & Steuern
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Bankname</label
          >
          <input
            v-model="form.bank_name"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">IBAN</label>
          <input
            v-model="form.iban"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">BIC</label>
          <input
            v-model="form.bic"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >USt-IdNr.</label
          >
          <input
            v-model="form.vat_id"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Steuernummer</label
          >
          <input
            v-model="form.tax_number"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
          />
        </div>
      </div>

      <div class="flex justify-end pt-4">
        <button
          @click="save"
          :disabled="loading"
          class="bg-slate-900 text-white px-6 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors"
        >
          {{ loading ? "Speichert..." : "Einstellungen speichern" }}
        </button>
      </div>
    </div>

    <div v-if="showMediaModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <h3 class="font-semibold text-lg text-slate-900">Logo auswählen</h3>
          <button @click="showMediaModal = false" class="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 bg-slate-50">
           <MediaLibrary 
             :is-multi-select="false" 
             @images-selected="handleLogoSelection"
           />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import MediaLibrary from "@/components/app/MediaLibrary.vue";

const api = useBookingApi();
const loading = ref(false);
const form = ref<any>({});
const showMediaModal = ref(false);

const getImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${import.meta.env.VITE_INTERNAL_IMAGE_URL || ''}${url}`;
}

onMounted(async () => {
  try {
    const res = await api.company.get();
    form.value = res;
  } catch (e) {}
});

const save = async () => {
  loading.value = true;
  try {
    await api.company.update(form.value);
    alert("Gespeichert");
  } catch (e) {
    alert("Fehler beim Speichern");
  } finally {
    loading.value = false;
  }
};

const handleLogoSelection = async (ids: number[]) => {
  if (ids.length === 0) return;
  
  // Wir holen uns die Details zum Bild um die URL zu bekommen
  try {
      const token = localStorage.getItem('jwt');
      const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/media/${ids[0]}`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
          const media = await res.json();
          // Setze die URL im Formular
          form.value.logo_url = media.url;
          showMediaModal.value = false;
      } else {
        throw new Error('Fehler beim Laden der Bild-Details');
      }
  } catch(e) {
      console.error(e);
      alert("Fehler beim Auswählen des Logos");
  }
};
</script>