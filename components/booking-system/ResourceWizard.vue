<template>
  <div class="dialog-panel max-w-4xl w-full font-sans">
    <div class="dialog-header">
      <div class="min-w-0 flex-1">
        <h2 class="dialog-title">Ressource erstellen</h2>
        <p class="dialog-desc">
          Konfigurieren Sie Details, Preise und Zusatzleistungen.
        </p>
      </div>

      <div class="flex items-center space-x-2">
        <div v-for="i in 3" :key="i" class="flex items-center">
          <div
            class="flex size-8 items-center justify-center border text-xs font-medium transition-all duration-300"
            :class="
              step === i
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : step > i
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-neutral-200 bg-white text-neutral-400'
            "
          >
            <span v-if="step > i">✓</span>
            <span v-else>{{ i }}</span>
          </div>
          <div
            v-if="i < 3"
            class="mx-2 h-px w-8"
            :class="step > i ? 'bg-green-500' : 'bg-neutral-200'"
          ></div>
        </div>
      </div>
    </div>

    <div class="dialog-body bg-neutral-50/50">
      <div
        v-if="step === 1"
        class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label
              class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-900"
              >Name</label
            >
            <input
              v-model="form.resource.name"
              placeholder="z.B. Podcast Studio A"
              class="flex h-10 w-full  border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium leading-none text-slate-900"
              >Kategorie</label
            >
            <select
              v-model="form.resource.category_id"
              class="flex h-10 w-full  border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            >
              <option :value="null">Bitte wählen...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium leading-none text-slate-900"
              >Kapazität</label
            >
            <input
              v-model.number="form.resource.capacity"
              type="number"
              class="flex h-10 w-full  border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium leading-none text-slate-900"
              >Standort</label
            >
            <input
              v-model="form.resource.location_data"
              placeholder="Raum-Nummer oder Etage"
              class="flex h-10 w-full  border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            />
          </div>

          <div class="col-span-full space-y-2">
            <label class="text-sm font-medium leading-none text-slate-900"
              >Beschreibung</label
            >
            <textarea
              v-model="form.resource.description"
              rows="4"
              class="flex min-h-[80px] w-full  border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
          </div>

          <div class="col-span-full space-y-2">
            <label class="text-sm font-medium leading-none text-slate-900"
              >Bild</label
            >
            <div class="flex items-center gap-4">
              <div
                class="relative flex h-24 w-32 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50"
              >
                <img
                  v-if="form.resource.image_url"
                  :src="resolveImageUrl(form.resource.image_url)"
                  class="h-full w-full object-cover"
                  alt="Ressourcenbild"
                />
                <span v-else class="px-2 text-center text-xs text-slate-400"
                  >Kein Bild</span
                >
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
                  v-if="form.resource.image_url"
                  type="button"
                  class="text-left text-sm font-medium text-red-600 hover:text-red-700"
                  @click="form.resource.image_url = null"
                >
                  Entfernen
                </button>
              </div>
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

      <div
        v-if="step === 2"
        class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-slate-900">
            Preispläne definieren
          </h3>
          <button
            @click="addPlan"
            class="text-sm font-medium text-slate-900 hover:underline flex items-center gap-1"
          >
            + Preis hinzufügen
          </button>
        </div>

        <div
          v-for="(plan, index) in form.pricingPlans"
          :key="index"
          class="group relative  border border-slate-200 bg-white p-6 hover:transition-all duration-200"
        >
          <button
            v-if="form.pricingPlans.length > 1"
            @click="removePlan(index)"
            class="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.1929 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.1929 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
              ></path>
            </svg>
          </button>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="space-y-2">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-slate-500"
                >Bezeichnung</label
              >
              <input
                v-model="plan.name"
                placeholder="Standard Tarif"
                class="flex h-9 w-full  border border-slate-200 bg-transparent px-3 py-1 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div class="space-y-2">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-slate-500"
                >Preis (€)</label
              >
              <input
                v-model.number="plan.price"
                type="number"
                class="flex h-9 w-full  border border-slate-200 bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              />
            </div>
            <div class="space-y-2">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-slate-500"
                >Intervall</label
              >
              <select
                v-model="plan.billing_interval"
                class="flex h-9 w-full  border border-slate-200 bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              >
                <option value="HOUR">Stündlich</option>
                <option value="DAY">Täglich</option>
                <option value="MONTH">Monatlich (Abo)</option>
                <option value="ONE_OFF">Einmalig</option>
              </select>
            </div>
          </div>

          <div
            class="mt-6 pt-4 border-t border-slate-100 flex items-start gap-4"
          >
            <div class="flex-1">
              <label class="text-sm font-medium text-slate-900"
                >Mitgliedschaft gewähren</label
              >
              <p class="text-xs text-slate-500 mb-2">
                Verknüpfen Sie diesen Preis mit einem Status.
              </p>
              <select
                v-model="plan.grants_membership_type_id"
                class="flex h-9 w-full  border border-slate-200  px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              >
                <option :value="null">Keine Mitgliedschaft</option>
                <option
                  v-for="type in membershipTypes"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="step === 3"
        class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
      >
        <h3 class="text-lg font-medium text-slate-900 mb-4">
          Zusatzleistungen wählen
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label
            v-for="svc in allServices"
            :key="svc.id"
            :class="[
              'relative flex cursor-pointer  border p-4 focus:outline-none transition-all duration-200',
              form.selectedServiceIds.includes(svc.id)
                ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50'
                : 'border-slate-200 bg-white hover:border-slate-300',
            ]"
          >
            <input
              type="checkbox"
              :value="svc.id"
              v-model="form.selectedServiceIds"
              class="sr-only"
            />
            <div class="flex w-full items-center justify-between">
              <div class="flex items-center">
                <div class="text-sm">
                  <p class="font-medium text-slate-900">{{ svc.name }}</p>
                  <p class="text-slate-500 text-xs">
                    {{ svc.price_per_unit }}€
                    {{
                      svc.pricing_unit === "PER_HOUR" ? "/ Std" : "/ Buchung"
                    }}
                  </p>
                </div>
              </div>
              <div
                v-if="form.selectedServiceIds.includes(svc.id)"
                class="text-slate-900"
              >
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>

    <div class="dialog-footer !justify-between">
      <button
        type="button"
        class="btn-dialog-cancel"
        @click="$emit('cancel')"
      >
        Abbrechen
      </button>

      <div class="flex gap-3">
        <button
          v-if="step > 1"
          type="button"
          class="btn-dialog-cancel"
          @click="step--"
        >
          Zurück
        </button>

        <button
          v-if="step < 3"
          type="button"
          class="btn-dialog-primary"
          @click="nextStep"
        >
          Weiter
        </button>

        <button
          v-if="step === 3"
          type="button"
          class="btn-dialog-primary"
          :disabled="submitting"
          @click="submitWizard"
        >
          <span v-if="submitting" class="mr-2">...</span>
          {{ submitting ? "Speichern" : "Ressource erstellen" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MediaLibrary from "@/components/app/MediaLibrary.vue";

const emit = defineEmits(["completed", "cancel"]);
const api = useBookingApi();
const toast = useToast();

const step = ref(1);
const submitting = ref(false);
const showMediaModal = ref(false);
const categories = ref<any[]>([]);
const membershipTypes = ref<any[]>([]);
const allServices = ref<any[]>([]);

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
    form.value.resource.image_url = media.previewUrl || media.url;
    showMediaModal.value = false;
  } catch (e) {
    console.error(e);
    toast.add({ title: "Fehler beim Auswählen", color: "error" });
  }
};

const form = ref({
  resource: {
    name: "",
    category_id: null,
    capacity: 1,
    description: "",
    location_data: "",
    image_url: null as string | null,
  },
  pricingPlans: [
    {
      name: "Standard",
      price: 0,
      billing_interval: "HOUR",
      grants_membership_type_id: null,
    },
  ],
  selectedServiceIds: <number[]>[],
});

const addPlan = () =>
  form.value.pricingPlans.push({
    name: "",
    price: 0,
    billing_interval: "HOUR",
    grants_membership_type_id: null,
  });
const removePlan = (idx: number) => form.value.pricingPlans.splice(idx, 1);

const nextStep = () => {
  if (
    step.value === 1 &&
    (!form.value.resource.name || !form.value.resource.category_id)
  )
    return alert("Bitte Name und Kategorie füllen");
  step.value++;
};

onMounted(async () => {
  const [c, m, s] = await Promise.all([
    api.resources.getCategories(),
    api.memberships.getTypes(), // Stelle sicher, dass diese Methode im API-Client existiert
    api.services.getAll(),
  ]);
  categories.value = c || [];
  membershipTypes.value = m || [];
  allServices.value = s || [];
});

const submitWizard = async () => {
  submitting.value = true;
  try {
    // 1. Resource
    const res = await api.resources.create(form.value.resource);
    if (!res?.id) throw new Error("Fehler beim Erstellen der Ressource");

    // 2. Pricing
    for (const plan of form.value.pricingPlans) {
      if (plan.name && plan.price >= 0) {
        await api.pricing.create({ ...plan, resource_id: res.id });
      }
    }

    // 3. Services
    for (const sId of form.value.selectedServiceIds) {
      await api.services.attachToResource(res.id, sId);
    }

    emit("completed");
  } catch (e) {
    console.error(e);
    alert("Fehler: " + e.message);
  } finally {
    submitting.value = false;
  }
};
</script>
