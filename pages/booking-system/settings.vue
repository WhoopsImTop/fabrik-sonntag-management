<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <h1 class="text-2xl font-bold text-slate-900 mb-6">
      Unternehmenseinstellungen
    </h1>

    <div
      class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8"
    >
      <div class="flex items-start gap-6 border-b border-slate-100 pb-6">
        <div class="flex-1">
          <label class="block text-sm font-medium text-slate-700 mb-2"
            >Firmenlogo</label
          >
          <div class="flex items-center gap-4">
            <div
              class="h-24 w-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative"
            >
              <img
                v-if="form.logo_url"
                :src="getImageUrl(form.logo_url)"
                class="w-full h-full object-contain"
              />
              <span v-else class="text-xs text-slate-400">Kein Logo</span>
            </div>
            <div class="flex flex-col gap-2">
              <button
                type="button"
                @click="openMediaModal('logo_url')"
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
        </div>
      </div>

      <div>
        <h3 class="text-lg font-medium text-slate-900 mb-4">
          Rechnungsdesign & Einstellungen
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >Briefpapier (Vorderseite / Seite 1)</label
            >
            <div class="flex items-center gap-4">
              <div
                class="h-32 w-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative"
              >
                <img
                  v-if="form.invoice_background_first"
                  :src="getImageUrl(form.invoice_background_first)"
                  class="w-full h-full object-cover opacity-75"
                />
                <span v-else class="text-xs text-slate-400 text-center px-2"
                  >Kein Bild</span
                >
              </div>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  @click="openMediaModal('invoice_background_first')"
                  class="text-sm font-medium text-blue-600 hover:text-blue-700 text-left"
                >
                  Bild auswählen
                </button>
                <button
                  v-if="form.invoice_background_first"
                  type="button"
                  @click="form.invoice_background_first = null"
                  class="text-sm font-medium text-red-600 hover:text-red-700 text-left"
                >
                  Entfernen
                </button>
              </div>
            </div>
            <p class="text-xs text-slate-500 mt-2">
              Hintergrundbild für die erste Seite der PDF-Rechnung (A4).
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2"
              >Briefpapier (Folgeseiten)</label
            >
            <div class="flex items-center gap-4">
              <div
                class="h-32 w-24 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative"
              >
                <img
                  v-if="form.invoice_background_other"
                  :src="getImageUrl(form.invoice_background_other)"
                  class="w-full h-full object-cover opacity-75"
                />
                <span v-else class="text-xs text-slate-400 text-center px-2"
                  >Kein Bild</span
                >
              </div>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  @click="openMediaModal('invoice_background_other')"
                  class="text-sm font-medium text-blue-600 hover:text-blue-700 text-left"
                >
                  Bild auswählen
                </button>
                <button
                  v-if="form.invoice_background_other"
                  type="button"
                  @click="form.invoice_background_other = null"
                  class="text-sm font-medium text-red-600 hover:text-red-700 text-left"
                >
                  Entfernen
                </button>
              </div>
            </div>
            <p class="text-xs text-slate-500 mt-2">
              Hintergrundbild für alle weiteren Seiten.
            </p>
          </div>
        </div>

        <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label class="block text-sm font-medium text-slate-700 mb-1"
            >Nächste Rechnungsnummer (Zähler)</label
          >
          <div class="flex items-center gap-3">
            <input
              v-model="form.invoice_number_counter"
              type="number"
              min="1"
              step="1"
              class="w-32 border-slate-300 rounded-md shadow-sm p-2 border"
            />
            <span class="text-sm text-slate-500">
              Vorschau: RE-IL-FS-{{
                new Date().getFullYear().toString().slice(-2)
              }}-{{ form.invoice_number_counter }}
            </span>
          </div>
          <p class="text-xs text-red-500 mt-1">
            Achtung: Ändere dies nur, wenn du Lücken in der Nummerierung
            korrigieren musst.
          </p>
        </div>
      </div>

      <hr class="border-slate-100" />

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
            >Benachrichtigungs-Emails</label
          >
          <input
            v-model="form.notification_emails"
            class="w-full mt-1 border-slate-300 rounded-md shadow-sm p-2 border"
            placeholder="email@example.com"
          />
        </div>
      </div>

      <div class="flex justify-between pt-4 items-center">
        <button
          @click="triggerCron"
          class="text-sm text-slate-500 hover:text-slate-800 underline"
        >
          Rechnungslauf jetzt testen (Cron)
        </button>

        <button
          @click="save"
          :disabled="loading"
          class="bg-slate-900 text-white px-6 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors"
        >
          {{ loading ? "Speichert..." : "Einstellungen speichern" }}
        </button>
      </div>
    </div>

    <div
      v-if="showMediaModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div
          class="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10"
        >
          <h3 class="font-semibold text-lg text-slate-900">Bild auswählen</h3>
          <button
            @click="showMediaModal = false"
            class="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 bg-slate-50">
          <MediaLibrary
            :is-multi-select="false"
            @images-selected="handleImageSelection"
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
const currentMediaField = ref<string | null>(null);

const getImageUrl = (url: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_INTERNAL_IMAGE_URL || ""}${url}`;
};

onMounted(async () => {
  try {
    const res = await api.company.get();
    form.value = res;
    // Default Counter falls null
    if (!form.value.invoice_number_counter)
      form.value.invoice_number_counter = 1;
  } catch (e) {}
});

const save = async () => {
  loading.value = true;
  try {
    const counter = Number(form.value.invoice_number_counter);
    if (!Number.isInteger(counter) || counter < 1) {
      alert("Die Rechnungsnummer muss eine ganze Zahl ab 1 sein.");
      loading.value = false;
      return;
    }
    await api.company.update(form.value);
    alert("Gespeichert");
  } catch (e) {
    alert("Fehler beim Speichern");
  } finally {
    loading.value = false;
  }
};

const openMediaModal = (field: string) => {
  currentMediaField.value = field;
  showMediaModal.value = true;
};

const handleImageSelection = async (ids: number[]) => {
  if (ids.length === 0 || !currentMediaField.value) return;

  try {
    const token = localStorage.getItem("jwt");
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/media/${ids[0]}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (res.ok) {
      const media = await res.json();
      form.value[currentMediaField.value] = media.url;
      showMediaModal.value = false;
      currentMediaField.value = null;
    }
  } catch (e) {
    console.error(e);
    alert("Fehler beim Auswählen");
  }
};

const triggerCron = async () => {
  if (
    !confirm(
      "Möchtest du den Rechnungslauf für fällige Abos jetzt manuell starten?",
    )
  )
    return;
  try {
    const token = localStorage.getItem("jwt");
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/billing/run`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const data = await res.json();
    alert(data.message || "Lauf beendet");
  } catch (e) {
    alert("Fehler beim Starten des Laufs");
  }
};
</script>
