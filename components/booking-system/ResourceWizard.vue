<template>
  <div
    class="bg-white rounded-xl border border-slate-200 shadow-sm max-w-4xl w-full mx-auto flex flex-col max-h-[90vh] overflow-hidden font-sans"
  >
    <div class="px-8 py-6 border-b border-slate-100 bg-white">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-slate-900 tracking-tight">
            Ressource erstellen
          </h2>
          <p class="text-sm text-slate-500 mt-1">
            Konfigurieren Sie Details, Preise und Zusatzleistungen.
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <div v-for="i in 3" :key="i" class="flex items-center">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 border"
              :class="
                step === i
                  ? 'bg-slate-900 text-white border-slate-900'
                  : step > i
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-slate-400 border-slate-200'
              "
            >
              <span v-if="step > i">✓</span>
              <span v-else>{{ i }}</span>
            </div>
            <div
              v-if="i < 3"
              class="w-8 h-[1px] mx-2"
              :class="step > i ? 'bg-green-500' : 'bg-slate-200'"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-8 overflow-y-auto flex-1 bg-slate-50/50">
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
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium leading-none text-slate-900"
              >Kategorie</label
            >
            <select
              v-model="form.resource.category_id"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
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
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium leading-none text-slate-900"
              >Standort</label
            >
            <input
              v-model="form.resource.location_data"
              placeholder="Raum-Nummer oder Etage"
              class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            />
          </div>

          <div class="col-span-full space-y-2">
            <label class="text-sm font-medium leading-none text-slate-900"
              >Beschreibung</label
            >
            <textarea
              v-model="form.resource.description"
              rows="4"
              class="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            ></textarea>
          </div>
        </div>
      </div>

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
          class="group relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200"
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
                class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
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
                class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
              />
            </div>
            <div class="space-y-2">
              <label
                class="text-xs font-semibold uppercase tracking-wider text-slate-500"
                >Intervall</label
              >
              <select
                v-model="plan.billing_interval"
                class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
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
            <div class="p-2 bg-indigo-50 rounded-md text-indigo-600">
              <svg
                width="16"
                height="16"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.49995 1.04999C7.74848 1.04999 7.94995 1.25146 7.94995 1.49999V8H9.49995C9.74848 8 9.94995 8.20147 9.94995 8.45C9.94995 8.69853 9.74848 8.9 9.49995 8.9H7.94995V13.5C7.94995 13.7485 7.74848 13.95 7.49995 13.95C7.25142 13.95 7.04995 13.7485 7.04995 13.5V8.9H5.5C5.25147 8.9 5.05 8.69853 5.05 8.45C5.05 8.20147 5.25147 8 5.5 8H7.04995V1.49999C7.04995 1.25146 7.25142 1.04999 7.49995 1.04999Z"
                  fill="currentColor"
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                ></path>
              </svg>
            </div>
            <div class="flex-1">
              <label class="text-sm font-medium text-slate-900"
                >Mitgliedschaft gewähren</label
              >
              <p class="text-xs text-slate-500 mb-2">
                Verknüpfen Sie diesen Preis mit einem Status.
              </p>
              <select
                v-model="plan.grants_membership_type_id"
                class="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
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
              'relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none transition-all duration-200',
              form.selectedServiceIds.includes(svc.id)
                ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md',
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

    <div
      class="px-8 py-4 bg-white border-t border-slate-100 flex justify-between items-center"
    >
      <button
        @click="$emit('cancel')"
        class="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        Abbrechen
      </button>

      <div class="flex space-x-4">
        <button
          v-if="step > 1"
          @click="step--"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-10 px-4 py-2"
        >
          Zurück
        </button>

        <button
          v-if="step < 3"
          @click="nextStep"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2"
        >
          Weiter
        </button>

        <button
          v-if="step === 3"
          @click="submitWizard"
          :disabled="submitting"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 h-10 px-6 py-2 shadow-sm"
        >
          <span v-if="submitting" class="mr-2">...</span>
          {{ submitting ? "Speichern" : "Ressource erstellen" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["completed", "cancel"]);
const api = useBookingApi();

const step = ref(1);
const submitting = ref(false);
const categories = ref<any[]>([]);
const membershipTypes = ref<any[]>([]);
const allServices = ref<any[]>([]);

const form = ref({
  resource: {
    name: "",
    category_id: null,
    capacity: 1,
    description: "",
    location_data: "",
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
