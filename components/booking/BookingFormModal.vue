<template>
  <div>
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        @click="$emit('close')"
      ></div>

      <div
        class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0"
      >
        <div
          class="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-lg w-full border border-slate-100"
        >
          <div
            class="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex justify-between items-center"
          >
            <div>
              <h3 class="text-lg font-semibold text-slate-900">
                {{ isEdit ? "Buchung bearbeiten" : "Neue Buchung" }}
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                {{
                  isEdit
                    ? "Zeitraum oder Details ändern."
                    : "Ressource reservieren."
                }}
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <svg
                class="w-5 h-5"
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

          <div class="px-6 py-6 space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wide"
                  >Ressource</label
                >
                <select
                  v-model="form.resourceId"
                  :disabled="isEdit"
                  class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5 disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Wählen...</option>
                  <option
                    v-for="res in resources"
                    :key="res.id"
                    :value="res.id"
                  >
                    {{ res.name }}
                  </option>
                </select>
              </div>
              <div>
                <label
                  class="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wide"
                  >Nutzer</label
                >
                <div
                  v-if="form.user_id"
                  class="flex items-center justify-between p-2 border border-neutral-200 rounded-md bg-neutral-50"
                >
                  <div class="flex items-center gap-2 overflow-hidden">
                    <div class="truncate text-sm">
                      <span class="font-medium text-neutral-900">{{
                        form.user_preview?.username ||
                        "User ID: " + form.user_id
                      }}</span>
                      <span class="text-xs text-neutral-500 ml-1"
                        >({{ form.user_preview?.email || "..." }})</span
                      >
                    </div>
                  </div>
                  <button
                    @click="removeUser"
                    class="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg
                      class="w-4 h-4"
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
                <div v-else class="relative">
                  <input
                    type="text"
                    v-model="userSearchQuery"
                    @input="handleUserSearch"
                    placeholder="Name oder E-Mail suchen..."
                    class="block w-full text-sm border border-gray-300 rounded-md focus:ring-neutral-900 focus:border-neutral-900 py-2 px-3"
                  />
                  <div
                    v-if="userSearchResults.length > 0"
                    class="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
                  >
                    <div
                      v-for="user in userSearchResults"
                      :key="user.id"
                      @click="selectUser(user)"
                      class="px-3 py-2 hover:bg-neutral-50 cursor-pointer flex flex-col border-b border-neutral-50 last:border-0"
                    >
                      <span class="text-sm font-medium text-neutral-900">{{
                        user?.details?.company ||
                        `${user?.details?.first_name ?? ""} ${user?.details?.last_name ?? ""}`.trim() ||
                        "Unbekannt"
                      }}</span>
                      <span class="text-xs text-neutral-500">{{
                        user.email
                      }}</span>
                    </div>
                  </div>
                  <div v-if="isSearchingUsers" class="absolute right-3 top-2.5">
                    <svg
                      class="animate-spin w-4 h-4 text-neutral-400"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>

                  <span
                    @click="showAddModal = true"
                    class="text-xs underline text-neutral-900 cursor-pointer"
                    >+ Benutzer hinzufügen</span
                  >
                </div>
              </div>
            </div>

            <div
              class="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1"
                    >Startzeit</label
                  >
                  <input
                    :value="form.start_at"
                    @input="handleStartChange"
                    type="datetime-local"
                    class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-700 mb-1"
                    >Endzeit</label
                  >
                  <input
                    v-model="form.end_at"
                    @change="recalcDuration"
                    type="datetime-local"
                    class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2 font-mono"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <div class="flex flex-wrap gap-2">
                  <button
                    @click="shiftTime(1, 'day')"
                    type="button"
                    class="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1"
                  >
                    <span>+1 Tag</span>
                  </button>
                  <button
                    @click="shiftTime(1, 'week')"
                    type="button"
                    class="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1"
                  >
                    <span>+1 Woche</span>
                  </button>
                  <button
                    @click="shiftTime(1, 'hour')"
                    type="button"
                    class="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-1"
                  >
                    <span>+1 Std</span>
                  </button>
                </div>
                <div
                  class="text-xs font-medium text-slate-500 bg-slate-200/50 px-2 py-1 rounded"
                >
                  Dauer: {{ durationString }}
                </div>
              </div>

              <div
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2"
              >
                <div class="flex items-center gap-2 text-xs">
                  <span
                    :class="[
                      'px-2 py-1 rounded-full border text-[11px] font-medium',
                      availabilityStatus === 'available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : availabilityStatus === 'unavailable'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200',
                    ]"
                  >
                    <span v-if="checkingAvailability">Pruefung...</span>
                    <span v-else-if="availabilityStatus === 'available'"
                      >Verfuegbar</span
                    >
                    <span v-else-if="availabilityStatus === 'unavailable'"
                      >Belegt</span
                    >
                    <span v-else>Verfuegbarkeit</span>
                  </span>
                  <span class="text-slate-500" v-if="availabilityMessage">{{
                    availabilityMessage
                  }}</span>
                </div>
              </div>
            </div>

            <div v-if="!isEdit" class="space-y-3">
              <div>
                <label
                  class="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wide"
                  >Tarif</label
                >
                <select
                  v-model="form.pricingPlanId"
                  class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5"
                >
                  <option value="">Standard (Manuell)</option>
                  <option v-for="p in availablePlans" :key="p.id" :value="p.id">
                    {{ p.name }} ({{ p.price }}€)
                  </option>
                </select>
              </div>
            </div>

            <div
              v-if="isEdit"
              class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100"
            >
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1"
                  >Status</label
                >
                <select
                  v-model="form.status"
                  class="w-full border border-slate-200 rounded-lg text-sm p-2 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="CONFIRMED">Bestätigt</option>
                  <option value="PENDING">Ausstehend</option>
                  <option value="CANCELLED">Storniert</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1"
                  >Preis (Override)</label
                >
                <input
                  v-model.number="form.manual_price"
                  type="number"
                  step="0.01"
                  class="w-full border border-slate-200 rounded-lg text-sm p-2"
                />
              </div>
            </div>
          </div>

          <div
            class="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100"
          >
            <button
              @click="$emit('close')"
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              Abbrechen
            </button>
            <button
              @click="submit"
              :disabled="!canSubmit"
              class="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <span
                v-if="loading"
                class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
              ></span>
              {{ isEdit ? "Speichern" : "Buchen" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showAddModal"
      class="fixed inset-0 z-90 flex items-center justify-center p-4 sm:p-0"
    >
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        @click="showAddModal = false"
      ></div>

      <div
        class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-200"
      >
        <button
          @click="showAddModal = false"
          class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4"
          >
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          <span class="sr-only">Schließen</span>
        </button>

        <div class="p-6">
          <h2
            class="text-lg font-semibold text-slate-900 leading-none tracking-tight mb-1"
          >
            Neuen Benutzer anlegen
          </h2>
          <p class="text-sm text-slate-500 mb-6">
            Erstellen Sie einen neuen Benutzer.
          </p>

          <form @submit.prevent="createUser" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700"
                  >Vorname</label
                >
                <input
                  v-model="newUser.details.first_name"
                  type="text"
                  placeholder="Vorname"
                  required
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700"
                  >Nachname</label
                >
                <input
                  v-model="newUser.details.last_name"
                  type="text"
                  placeholder="Nachname"
                  required
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700"
                  >E-Mail</label
                >
                <input
                  v-model="newUser.email"
                  type="email"
                  placeholder="Email"
                  required
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700"
                  >Handynummer</label
                >
                <input
                  v-model="newUser.details.mobile_number"
                  type="text"
                  placeholder="+49152"
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700"
                  >Straße</label
                >
                <input
                  v-model="newUser.details.street"
                  type="text"
                  placeholder="Kiefernweg"
                  required
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700"
                  >Hausnummer</label
                >
                <input
                  v-model="newUser.details.house_number"
                  type="text"
                  required
                  placeholder="12"
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700"
                  >Plz</label
                >
                <input
                  v-model="newUser.details.zip_code"
                  type="text"
                  required
                  placeholder="79183"
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700"
                  >Stadt</label
                >
                <input
                  v-model="newUser.details.city"
                  type="text"
                  placeholder="Waldkirch"
                  required
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700"
                >Unternehmen</label
              >
              <input
                v-model="newUser.details.company"
                type="text"
                placeholder="Firma"
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              />
            </div>

            <div
              class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t border-slate-100"
            >
              <button
                type="button"
                @click="showAddModal = false"
                class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 sm:mt-0"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                :disabled="createLoading"
                class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 mb-2 sm:mb-0"
              >
                <svg
                  v-if="createLoading"
                  class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {{ createLoading ? "Wird erstellt..." : "Benutzer erstellen" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";

const props = defineProps<{
  isOpen: boolean;
  editData?: any;
  initialDate?: Date | string;
}>();
const emit = defineEmits(["close", "saved"]);
const api = useBookingApi();

const loading = ref(false);
const checkingAvailability = ref(false);
const availabilityStatus = ref<"idle" | "available" | "unavailable">("idle");
const availabilityMessage = ref("");
const resources = ref<any[]>([]);
const users = ref<any[]>([]);
const pricingPlans = ref<any[]>([]);
const originalRange = ref({ resourceId: "", start_at: "", end_at: "" });

const showAddModal = ref(false);
const createLoading = ref(false);
const newUser = ref({
  username: "",
  email: "",
  password: "",
  role: "user",
  details: {
    first_name: "",
    last_name: "",
    street: "",
    house_number: "",
    zip_code: "",
    city: "",
    company: "",
    mobile_number: "",
  },
});

const lettersAndNumbers = "1234567890abcdefghijklmnopqrstuvwxyz!&%$?)(][";

function generatePassword(length = 10) {
  let password = "";

  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * lettersAndNumbers.length);
    password += lettersAndNumbers[index];
  }

  return password;
}

function generateUserName(firstName, lastName) {
  const randomNum = Math.floor(Math.random() * 1000);
  return firstName.slice(0, 2) + lastName.slice(0, 2) + randomNum;
}

const createUser = async () => {
  createLoading.value = true;
  try {
    // Nutzung des neuen Composable-Aufrufs
    newUser.value.username = await generateUserName(
      newUser.value.details.first_name,
      newUser.value.details.last_name,
    );
    newUser.value.password = await generatePassword(10);
    const success = await api.users.create(newUser.value);

    if (success) {
      showAddModal.value = false;
      newUser.value = {
        username: "",
        email: "",
        password: "",
        role: "user",
        details: {
          first_name: "",
          last_name: "",
          street: "",
          house_number: "",
          zip_code: "",
          city: "",
          company: "",
          mobile_number: "",
        },
      };

      let fetchedUsers = await api.users.getAll();
      users.value = fetchedUsers;
    }
  } catch (e: any) {
    // Fehlerbehandlung macht useBookingApi bereits via Toast
    console.error(e);
  } finally {
    createLoading.value = false;
  }
};

// Form Data
const form = ref({
  resourceId: "",
  user_id: "",
  start_at: "",
  end_at: "",
  pricingPlanId: "",
  status: "CONFIRMED",
  user_preview: null,
  manual_price: null as number | null,
});

// Interne State für Dauer (in Millisekunden)
const currentDurationMs = ref(60 * 60 * 1000); // Default 1h

const isEdit = computed(() => !!props.editData);
const canCheckAvailability = computed(() => {
  if (!form.value.resourceId || !form.value.start_at || !form.value.end_at)
    return false;
  const s = new Date(form.value.start_at).getTime();
  const e = new Date(form.value.end_at).getTime();
  return e > s;
});
const canSubmit = computed(() => {
  if (loading.value) return false;
  if (checkingAvailability.value) return false;
  if (!form.value.resourceId || !form.value.user_id) return false;
  if (!canCheckAvailability.value) return false;
  if (availabilityStatus.value === "unavailable") return false;
  return true;
});

// --- SMART DATE LOGIC ---

// 1. Wenn Startdatum geändert wird -> Enddatum automatisch anpassen (Dauer behalten)
const handleStartChange = (e: Event) => {
  const newStartVal = (e.target as HTMLInputElement).value;
  if (!newStartVal) return;

  form.value.start_at = newStartVal;

  // Neues Ende berechnen basierend auf alter Dauer
  const startDate = new Date(newStartVal);
  const newEndDate = new Date(startDate.getTime() + currentDurationMs.value);
  form.value.end_at = formatDatetime(newEndDate);
};

// 2. Wenn Enddatum manuell geändert wird -> Dauer neu berechnen
const recalcDuration = () => {
  if (form.value.start_at && form.value.end_at) {
    const s = new Date(form.value.start_at).getTime();
    const e = new Date(form.value.end_at).getTime();
    if (e > s) {
      currentDurationMs.value = e - s;
    }
  }
};

// 3. Helper: Verschieben
const shiftTime = (amount: number, unit: "hour" | "day" | "week") => {
  if (!form.value.start_at || !form.value.end_at) return;

  const s = new Date(form.value.start_at);
  const e = new Date(form.value.end_at);

  if (unit === "hour") {
    s.setHours(s.getHours() + amount);
    e.setHours(e.getHours() + amount);
  } else if (unit === "day") {
    s.setDate(s.getDate() + amount);
    e.setDate(e.getDate() + amount);
  } else if (unit === "week") {
    s.setDate(s.getDate() + amount * 7);
    e.setDate(e.getDate() + amount * 7);
  }

  form.value.start_at = formatDatetime(s);
  form.value.end_at = formatDatetime(e);
};

// 4. Anzeige Dauer String
const durationString = computed(() => {
  const ms = currentDurationMs.value;
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  let str = "";
  if (days > 0) str += `${days}d `;
  if (hours > 0) str += `${hours}h `;
  if (minutes > 0) str += `${minutes}m`;
  return str || "0m";
});

const formatDatetime = (d: Date) => {
  const pad = (n: number) => (n < 10 ? "0" + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const applyInitialDate = (dateInput?: Date | string | null) => {
  if (!dateInput || isEdit.value) return;
  const base = new Date(dateInput);
  if (isNaN(base.getTime())) return;
  base.setHours(9, 0, 0, 0);
  const end = new Date(base.getTime() + currentDurationMs.value);
  form.value.start_at = formatDatetime(base);
  form.value.end_at = formatDatetime(end);
};

// --- DATA LOADING & SUBMIT ---

// Plans for Resource
const availablePlans = computed(() => {
  if (!form.value.resourceId) return [];
  return pricingPlans.value.filter(
    (p) => p.resource_id == form.value.resourceId,
  );
});

// User Search Logic
const handleUserSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (!userSearchQuery.value || userSearchQuery.value.length < 2) {
    userSearchResults.value = [];
    return;
  }

  isSearchingUsers.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      const q = userSearchQuery.value.toLowerCase();
      userSearchResults.value = users.value
        .filter(
          (u: any) =>
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.details?.first_name?.toLowerCase().includes(q) ||
            u.details?.last_name?.toLowerCase().includes(q) ||
            u.details?.company?.toLowerCase().includes(q),
        )
        .slice(0, 5);
    } catch (e) {
      console.error(e);
    } finally {
      isSearchingUsers.value = false;
    }
  }, 300);
};

const selectUser = (user: any) => {
  form.value.user_id = user.id;
  form.value.user_preview = user;
  userSearchQuery.value = "";
  userSearchResults.value = [];
};

const removeUser = () => {
  form.value.user_id = null;
  form.value.user_preview = null;
};

const userSearchQuery = ref("");
const userSearchResults = ref<any[]>([]);
const isSearchingUsers = ref(false);
let searchTimeout: any = null;

onMounted(async () => {
  const [resData, usrData, plansData] = await Promise.all([
    api.resources.getAll(),
    api.users.getAll(),
    api.pricing.getAll(),
  ]);
  resources.value = resData || [];
  users.value = usrData || [];
  pricingPlans.value = plansData || [];

  // Default Times for Create Mode
  if (!props.editData && !form.value.start_at) {
    currentDurationMs.value = 60 * 60 * 1000;
    if (props.initialDate) {
      applyInitialDate(props.initialDate);
    } else {
      const now = new Date();
      now.setMinutes(0, 0, 0);
      now.setHours(now.getHours() + 1);
      form.value.start_at = formatDatetime(now);
      const end = new Date(now);
      end.setHours(end.getHours() + 1);
      form.value.end_at = formatDatetime(end);
    }
  }
});

// Edit Watcher
watch(
  () => props.editData,
  (newVal) => {
    console.log(newVal);
    if (newVal) {
      form.value = {
        resourceId: newVal.resource_id,
        user_id: newVal.user_id,
        start_at: newVal.start_at.slice(0, 16),
        end_at: newVal.end_at.slice(0, 16),
        pricingPlanId: newVal.pricing_plan_id,
        status: newVal.status,
        manual_price: newVal.Invoice?.total_amount || 0,
      };
      originalRange.value = {
        resourceId: String(newVal.resourceId ?? ""),
        start_at: form.value.start_at,
        end_at: form.value.end_at,
      };
      console.log(form.value);
      // Duration setzen
      recalcDuration();
    } else {
      // Reset defaults (optional)
      form.value.resourceId = "";
      form.value.user_id = "";
      if (props.initialDate) applyInitialDate(props.initialDate);
    }
  },
  { immediate: true },
);

watch(
  () => props.initialDate,
  (newDate) => {
    if (!isEdit.value) applyInitialDate(newDate);
  },
);

let availabilityTimer: any = null;
watch(
  [
    () => form.value.resourceId,
    () => form.value.start_at,
    () => form.value.end_at,
  ],
  () => {
    if (availabilityTimer) clearTimeout(availabilityTimer);
    availabilityStatus.value = "idle";
    availabilityMessage.value = "";
    if (
      isEdit.value &&
      String(form.value.resourceId) === originalRange.value.resourceId &&
      form.value.start_at === originalRange.value.start_at &&
      form.value.end_at === originalRange.value.end_at
    ) {
      availabilityStatus.value = "available";
      availabilityMessage.value = "Aktuelle Buchung.";
      return;
    }
    if (!canCheckAvailability.value) return;
    availabilityTimer = setTimeout(async () => {
      checkingAvailability.value = true;
      try {
        const res = await api.bookings.checkAvailability(
          Number(form.value.resourceId),
          form.value.start_at,
          form.value.end_at,
        );
        const isAvailable =
          typeof res === "boolean"
            ? res
            : (res?.available ?? res?.isAvailable ?? res?.is_available);
        if (isAvailable === false) {
          availabilityStatus.value = "unavailable";
          availabilityMessage.value = "Zeitraum ist belegt.";
        } else {
          availabilityStatus.value = "available";
          availabilityMessage.value = "Zeitraum ist verfügbar.";
        }
      } catch (e) {
        availabilityStatus.value = "unavailable";
        availabilityMessage.value =
          "Verfügbarkeit konnte nicht geprüft werden.";
      } finally {
        checkingAvailability.value = false;
      }
    }, 300);
  },
);

const submit = async () => {
  if (!canCheckAvailability.value) {
    alert("Bitte einen gültigen Zeitraum wählen.");
    return;
  }
  if (availabilityStatus.value === "idle") {
    checkingAvailability.value = true;
    try {
      const res = await api.bookings.checkAvailability(
        Number(form.value.resourceId),
        form.value.start_at,
        form.value.end_at,
      );
      const isAvailable =
        typeof res === "boolean"
          ? res
          : (res?.available ?? res?.isAvailable ?? res?.is_available);
      if (isAvailable === false) {
        availabilityStatus.value = "unavailable";
        availabilityMessage.value = "Zeitraum ist belegt.";
        alert("Der gewählte Zeitraum ist nicht verfügbar.");
        checkingAvailability.value = false;
        return;
      }
      availabilityStatus.value = "available";
    } catch (e) {
      availabilityStatus.value = "unavailable";
      availabilityMessage.value = "Verfügbarkeit konnte nicht geprüft werden.";
      alert("Verfügbarkeit konnte nicht geprüft werden.");
      checkingAvailability.value = false;
      return;
    } finally {
      checkingAvailability.value = false;
    }
  }
  if (availabilityStatus.value === "unavailable") {
    alert("Der gewählte Zeitraum ist nicht verfügbar.");
    return;
  }
  loading.value = true;
  try {
    if (isEdit.value) {
      await api.bookings.update(props.editData.id, form.value);
    } else {
      await api.bookings.create(form.value);
    }
    emit("saved");
    emit("close");
  } catch (e) {
    console.error(e);
    alert("Fehler beim Speichern. Ist der Zeitraum frei?");
  } finally {
    loading.value = false;
  }
};
</script>
