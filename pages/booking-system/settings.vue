<template>
  <div class="mx-auto max-w-4xl space-y-6 pb-20">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
          Unternehmenseinstellungen
        </h1>
        <p class="mt-1 text-neutral-500">
          Firmendaten, Rechnungsdesign und Bankverbindung für das Buchungssystem.
        </p>
      </div>
      <button
        type="button"
        class="btn-dialog-primary"
        :disabled="loading"
        @click="save"
      >
        {{ loading ? "Speichert…" : "Einstellungen speichern" }}
      </button>
    </div>

    <!-- Firmenlogo -->
    <section class="border border-neutral-200 bg-white">
      <div class="border-b border-neutral-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-neutral-900">Firmenlogo</h2>
        <p class="mt-0.5 text-sm text-neutral-500">
          Wird auf Rechnungen und in der Kommunikation verwendet.
        </p>
      </div>
      <div class="px-6 py-5">
        <div class="flex items-center gap-4">
          <div
            class="relative flex h-24 w-24 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-50"
          >
            <img
              v-if="form.logo_url"
              :src="getImageUrl(form.logo_url)"
              class="h-full w-full object-contain"
              alt="Firmenlogo"
            />
            <span v-else class="text-xs text-neutral-400">Kein Logo</span>
          </div>
          <div class="flex flex-col gap-2">
            <button
              type="button"
              class="text-left text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
              @click="openMediaModal('logo_url')"
            >
              Logo auswählen
            </button>
            <button
              v-if="form.logo_url"
              type="button"
              class="text-left text-sm font-medium text-red-600 hover:text-red-700"
              @click="form.logo_url = null"
            >
              Löschen
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Rechnungsdesign -->
    <section class="border border-neutral-200 bg-white">
      <div class="border-b border-neutral-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-neutral-900">
          Rechnungsdesign & Nummerierung
        </h2>
        <p class="mt-0.5 text-sm text-neutral-500">
          Briefpapier und Zähler für PDF-Rechnungen.
        </p>
      </div>
      <div class="space-y-6 px-6 py-5">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label class="dialog-label">Briefpapier (Vorderseite / Seite 1)</label>
            <div class="mt-1.5 flex items-center gap-4">
              <div
                class="relative flex h-32 w-24 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-50"
              >
                <img
                  v-if="form.invoice_background_first"
                  :src="getImageUrl(form.invoice_background_first)"
                  class="h-full w-full object-cover opacity-75"
                  alt="Briefpapier Seite 1"
                />
                <span v-else class="px-2 text-center text-xs text-neutral-400"
                  >Kein Bild</span
                >
              </div>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  class="text-left text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
                  @click="openMediaModal('invoice_background_first')"
                >
                  Bild auswählen
                </button>
                <button
                  v-if="form.invoice_background_first"
                  type="button"
                  class="text-left text-sm font-medium text-red-600 hover:text-red-700"
                  @click="form.invoice_background_first = null"
                >
                  Entfernen
                </button>
              </div>
            </div>
            <p class="mt-2 text-xs text-neutral-500">
              Hintergrundbild für die erste Seite der PDF-Rechnung (A4).
            </p>
          </div>

          <div>
            <label class="dialog-label">Briefpapier (Folgeseiten)</label>
            <div class="mt-1.5 flex items-center gap-4">
              <div
                class="relative flex h-32 w-24 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-50"
              >
                <img
                  v-if="form.invoice_background_other"
                  :src="getImageUrl(form.invoice_background_other)"
                  class="h-full w-full object-cover opacity-75"
                  alt="Briefpapier Folgeseiten"
                />
                <span v-else class="px-2 text-center text-xs text-neutral-400"
                  >Kein Bild</span
                >
              </div>
              <div class="flex flex-col gap-2">
                <button
                  type="button"
                  class="text-left text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
                  @click="openMediaModal('invoice_background_other')"
                >
                  Bild auswählen
                </button>
                <button
                  v-if="form.invoice_background_other"
                  type="button"
                  class="text-left text-sm font-medium text-red-600 hover:text-red-700"
                  @click="form.invoice_background_other = null"
                >
                  Entfernen
                </button>
              </div>
            </div>
            <p class="mt-2 text-xs text-neutral-500">
              Hintergrundbild für alle weiteren Seiten.
            </p>
          </div>
        </div>

        <div class="border border-neutral-200 bg-neutral-50 p-4">
          <label class="dialog-label">Nächste Rechnungsnummer (Zähler)</label>
          <div class="mt-1.5 flex flex-wrap items-center gap-3">
            <input
              v-model="form.invoice_number_counter"
              type="number"
              min="1"
              step="1"
              class="dialog-input w-32"
            />
            <span class="text-sm text-neutral-500">
              Vorschau: RE-IL-FS-{{
                new Date().getFullYear().toString().slice(-2)
              }}-{{ form.invoice_number_counter }}
            </span>
          </div>
          <p class="mt-1.5 text-xs text-red-600">
            Achtung: Ändere dies nur, wenn du Lücken in der Nummerierung
            korrigieren musst.
          </p>
        </div>
      </div>
    </section>

    <!-- Steuer & Bank -->
    <section class="border border-neutral-200 bg-white">
      <div class="border-b border-neutral-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-neutral-900">
          Steuer & Bankverbindung
        </h2>
        <p class="mt-0.5 text-sm text-neutral-500">
          Für ZUGFeRD/E-Rechnungen und Zahlungsinformationen im XML.
        </p>
      </div>
      <div class="grid grid-cols-1 gap-5 px-6 py-5 md:grid-cols-2">
        <div>
          <label class="dialog-label">USt-IdNr.</label>
          <input
            v-model="form.vat_id"
            class="dialog-input"
            placeholder="DE123456789"
          />
        </div>
        <div>
          <label class="dialog-label">Steuernummer</label>
          <input v-model="form.tax_number" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">IBAN</label>
          <input
            v-model="form.iban"
            class="dialog-input font-mono"
            placeholder="DE89 3704 0044 0532 0130 00"
          />
        </div>
        <div>
          <label class="dialog-label">BIC</label>
          <input
            v-model="form.bic"
            class="dialog-input font-mono"
            placeholder="COBADEFFXXX"
          />
        </div>
        <div class="md:col-span-2">
          <label class="dialog-label">Bank / Kontoinhaber</label>
          <input
            v-model="form.bank_name"
            class="dialog-input"
            placeholder="Commerzbank / Fabrik Sonntag GmbH"
          />
        </div>
        <div>
          <label class="dialog-label">Land</label>
          <input
            v-model="form.country"
            class="dialog-input"
            placeholder="Deutschland"
          />
        </div>
      </div>
    </section>

    <!-- Firmendaten -->
    <section class="border border-neutral-200 bg-white">
      <div class="border-b border-neutral-200 px-6 py-4">
        <h2 class="text-lg font-semibold text-neutral-900">Firmendaten</h2>
        <p class="mt-0.5 text-sm text-neutral-500">
          Stammdaten für Rechnungen, E-Mails und Fußzeilen.
        </p>
      </div>
      <div class="grid grid-cols-1 gap-5 px-6 py-5 md:grid-cols-2">
        <div>
          <label class="dialog-label">Firmenname</label>
          <input v-model="form.company_name" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">E-Mail (Absender)</label>
          <input v-model="form.email" type="email" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">Straße & Hausnr.</label>
          <input v-model="form.street" class="dialog-input" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="dialog-label">PLZ</label>
            <input v-model="form.zip_code" class="dialog-input" />
          </div>
          <div>
            <label class="dialog-label">Stadt</label>
            <input v-model="form.city" class="dialog-input" />
          </div>
        </div>
        <div>
          <label class="dialog-label">Footer Text</label>
          <input v-model="form.footer_text" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">Telefon</label>
          <input v-model="form.phone" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">Webseite</label>
          <input v-model="form.website" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">Benachrichtigungs-Emails</label>
          <input
            v-model="form.notification_emails"
            class="dialog-input"
            placeholder="email@example.com"
          />
        </div>
      </div>
    </section>

    <div class="flex flex-col items-start justify-between gap-4 border-t border-neutral-200 pt-4 sm:flex-row sm:items-center">
      <button
        type="button"
        class="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
        @click="triggerCron"
      >
        Rechnungslauf jetzt testen (Cron)
      </button>
      <button
        type="button"
        class="btn-dialog-primary"
        :disabled="loading"
        @click="save"
      >
        {{ loading ? "Speichert…" : "Einstellungen speichern" }}
      </button>
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
              @images-selected="handleImageSelection"
            />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import MediaLibrary from "@/components/app/MediaLibrary.vue";

const api = useBookingApi();
const toast = useToast();
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
    if (!form.value.invoice_number_counter) {
      form.value.invoice_number_counter = 1;
    }
  } catch (e) {}
});

const save = async () => {
  loading.value = true;
  try {
    const counter = Number(form.value.invoice_number_counter);
    if (!Number.isInteger(counter) || counter < 1) {
      toast.add({
        title: "Ungültige Rechnungsnummer",
        description: "Die Rechnungsnummer muss eine ganze Zahl ab 1 sein.",
        color: "error",
      });
      return;
    }
    await api.company.update(form.value);
  } catch (e) {
    toast.add({
      title: "Fehler beim Speichern",
      color: "error",
    });
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
    toast.add({ title: "Fehler beim Auswählen", color: "error" });
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
    toast.add({
      title: data.message || "Lauf beendet",
      color: "green",
    });
  } catch (e) {
    toast.add({ title: "Fehler beim Starten des Laufs", color: "error" });
  }
};
</script>
