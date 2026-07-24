<template>
  <div>
    <div
      v-if="isOpen"
      class="dialog-overlay overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="absolute inset-0"
        @click="$emit('close')"
      ></div>

      <div class="dialog-panel max-w-lg my-8">
          <div class="dialog-header">
            <div class="min-w-0 flex-1">
              <h3 class="dialog-title">
                {{ isEdit ? "Buchung bearbeiten" : "Neue Buchung" }}
              </h3>
              <p class="dialog-desc">
                {{
                  isEdit
                    ? "Zeitraum oder Details ändern."
                    : "Ressource reservieren."
                }}
              </p>
            </div>
            <button
              type="button"
              class="dialog-close"
              aria-label="Schließen"
              @click="$emit('close')"
            >
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>

          <div class="dialog-body space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="dialog-label">Ressource</label>
                <select
                  v-model="form.resourceId"
                  :disabled="isEdit"
                  class="dialog-input disabled:bg-neutral-50 disabled:text-neutral-500"
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
                <label class="dialog-label">Nutzer</label>
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
                    class="dialog-input"
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
              class="space-y-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="dialog-label">Startzeit</label>
                  <input
                    :value="form.start_at"
                    @input="handleStartChange"
                    type="datetime-local"
                    class="dialog-input font-mono"
                  />
                </div>
                <div>
                  <label class="dialog-label">Endzeit</label>
                  <input
                    :value="form.end_at"
                    @input="handleEndChange"
                    type="datetime-local"
                    class="dialog-input font-mono"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <div class="flex flex-wrap gap-2">
                  <button
                    @click="shiftTime(1, 'day')"
                    type="button"
                    class="flex items-center gap-1 border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
                  >
                    <span>+1 Tag</span>
                  </button>
                  <button
                    @click="shiftTime(1, 'week')"
                    type="button"
                    class="flex items-center gap-1 border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
                  >
                    <span>+1 Woche</span>
                  </button>
                  <button
                    @click="shiftTime(1, 'hour')"
                    type="button"
                    class="flex items-center gap-1 border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
                  >
                    <span>+1 Std</span>
                  </button>
                </div>
                <div
                  class="text-xs font-medium text-neutral-500 bg-neutral-200/50 px-2 py-1 rounded-md"
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
                      'px-2 py-1 rounded-md border text-[11px] font-medium',
                      availabilityStatus === 'available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : availabilityStatus === 'unavailable'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-neutral-50 text-neutral-500 border-neutral-200',
                    ]"
                  >
                    <span v-if="checkingAvailability">Pruefung...</span>
                    <span v-else-if="availabilityStatus === 'available'"
                      >Verfügbar</span
                    >
                    <span v-else-if="availabilityStatus === 'unavailable'"
                      >Belegt</span
                    >
                    <span v-else>Verfügbarkeit</span>
                  </span>
                  <span class="text-neutral-500" v-if="availabilityMessage">{{
                    availabilityMessage
                  }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <label class="dialog-label">Tarif</label>
                <select
                  v-model="form.pricingPlanId"
                  @change="tariffManuallySelected = true"
                  class="dialog-input"
                >
                  <option value="">Standard (Manuell)</option>
                  <option v-for="p in availablePlans" :key="p.id" :value="p.id">
                    {{ p.name }} ({{ p.price }}€ / {{ billingIntervalLabel(p.billing_interval) }})
                  </option>
                </select>
                <p
                  v-if="suggestedPlanLabel"
                  class="text-xs text-neutral-500 mt-1"
                >
                  Vorschlag nach Dauer: {{ suggestedPlanLabel }}
                </p>
              </div>
            </div>

            <div
              v-if="isEdit"
              class="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200"
            >
              <div>
                <label class="dialog-label">Status</label>
                <select
                  v-model="form.status"
                  class="dialog-input"
                >
                  <option value="CONFIRMED">Bestätigt</option>
                  <option value="PENDING">Ausstehend</option>
                  <option value="CANCELLED">Storniert</option>
                </select>
              </div>
              <div>
                <label class="dialog-label">Preis (Override)</label>
                <input
                  v-model.number="form.manual_price"
                  type="number"
                  step="0.01"
                  class="dialog-input"
                />
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button
              type="button"
              class="btn-dialog-cancel"
              @click="$emit('close')"
            >
              Abbrechen
            </button>
            <button
              type="button"
              class="btn-dialog-primary"
              :disabled="!canSubmit"
              @click="submit"
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

    <div
      v-if="showAddModal"
      class="dialog-overlay z-[90]"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="absolute inset-0"
        @click="showAddModal = false"
      ></div>

      <div class="dialog-panel max-w-lg">
        <div class="dialog-header">
          <div class="min-w-0 flex-1">
            <h2 class="dialog-title">Neuen Benutzer anlegen</h2>
            <p class="dialog-desc">Erstellen Sie einen neuen Benutzer.</p>
          </div>
          <button
            type="button"
            class="dialog-close"
            aria-label="Schließen"
            @click="showAddModal = false"
          >
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <form @submit.prevent="createUser">
          <div class="dialog-body space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="dialog-label">Vorname</label>
                <input
                  v-model="newUser.details.first_name"
                  type="text"
                  placeholder="Vorname"
                  required
                  class="dialog-input"
                />
              </div>
              <div>
                <label class="dialog-label">Nachname</label>
                <input
                  v-model="newUser.details.last_name"
                  type="text"
                  placeholder="Nachname"
                  required
                  class="dialog-input"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="dialog-label">E-Mail</label>
                <input
                  v-model="newUser.email"
                  type="email"
                  placeholder="Email"
                  required
                  class="dialog-input"
                />
              </div>
              <div>
                <label class="dialog-label">Handynummer</label>
                <input
                  v-model="newUser.details.mobile_number"
                  type="text"
                  placeholder="+49152"
                  class="dialog-input"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="dialog-label">Straße</label>
                <input
                  v-model="newUser.details.street"
                  type="text"
                  placeholder="Kiefernweg"
                  class="dialog-input"
                />
              </div>
              <div>
                <label class="dialog-label">Hausnummer</label>
                <input
                  v-model="newUser.details.house_number"
                  type="text"
                  placeholder="12"
                  class="dialog-input"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="dialog-label">Plz</label>
                <input
                  v-model="newUser.details.zip_code"
                  type="text"
                  placeholder="79183"
                  class="dialog-input"
                />
              </div>
              <div>
                <label class="dialog-label">Stadt</label>
                <input
                  v-model="newUser.details.city"
                  type="text"
                  placeholder="Waldkirch"
                  class="dialog-input"
                />
              </div>
              <div>
                <label class="dialog-label">Land</label>
                <input
                  v-model="newUser.details.country"
                  type="text"
                  placeholder="Deutschland"
                  class="dialog-input"
                />
              </div>
            </div>

            <div>
              <label class="dialog-label">Unternehmen</label>
              <input
                v-model="newUser.details.company"
                type="text"
                placeholder="Firma"
                class="dialog-input"
              />
            </div>
          </div>

          <div class="dialog-footer">
            <button
              type="button"
              class="btn-dialog-cancel"
              @click="showAddModal = false"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="btn-dialog-primary"
              :disabled="createLoading"
            >
              <svg
                v-if="createLoading"
                class="animate-spin -ml-1 mr-2 h-4 w-4"
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";

const props = defineProps<{
  isOpen: boolean;
  editData?: any;
  initialDate?: Date | string;
}>();
const emit = defineEmits(["close", "saved"]);
const api = useBookingApi();
const { confirm } = useConfirm();

const loading = ref(false);
const checkingAvailability = ref(false);
const availabilityStatus = ref<"idle" | "available" | "unavailable">("idle");
const availabilityMessage = ref("");
const resources = ref<any[]>([]);
const users = ref<any[]>([]);
const pricingPlans = ref<any[]>([]);
const originalRange = ref({ resourceId: "", start_at: "", end_at: "" });
const originalManualPrice = ref<number | null>(null);

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
    country: "",
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
          country: "",
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
const tariffManuallySelected = ref(false);
const skipTariffAutoSelect = ref(false);

const isEdit = computed(() => !!props.editData);
const excludeBookingId = computed(() =>
  isEdit.value ? Number(props.editData?.id) : undefined,
);
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
  if (!isEdit.value && !form.value.pricingPlanId) return false;
  return true;
});

// --- SMART DATE LOGIC ---

// 1. Wenn Startdatum geändert wird -> Enddatum automatisch anpassen (Dauer behalten)
const handleStartChange = (e: Event) => {
  const newStartVal = (e.target as HTMLInputElement).value;
  if (!newStartVal) return;

  tariffManuallySelected.value = false;
  form.value.start_at = newStartVal;

  // Neues Ende berechnen basierend auf alter Dauer
  const startDate = new Date(newStartVal);
  const newEndDate = new Date(startDate.getTime() + currentDurationMs.value);
  form.value.end_at = formatDatetime(newEndDate);
  applySuggestedTariff();
};

// 2. Wenn Enddatum manuell geändert wird -> Dauer neu berechnen
const handleEndChange = (e: Event) => {
  const newEndVal = (e.target as HTMLInputElement).value;
  if (!newEndVal) return;
  tariffManuallySelected.value = false;
  form.value.end_at = newEndVal;
  recalcDuration();
};

const recalcDuration = () => {
  if (form.value.start_at && form.value.end_at) {
    const s = new Date(form.value.start_at).getTime();
    const e = new Date(form.value.end_at).getTime();
    if (e > s) {
      currentDurationMs.value = e - s;
      applySuggestedTariff();
    }
  }
};

// 3. Helper: Verschieben
const shiftTime = (amount: number, unit: "hour" | "day" | "week") => {
  if (!form.value.start_at || !form.value.end_at) return;

  tariffManuallySelected.value = false;
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
  applySuggestedTariff();
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

const toDatetimeLocal = (value?: string | Date | null) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return formatDatetime(d);
};

const billingIntervalLabel = (interval?: string) => {
  return (
    (
      {
        HOUR: "Stunde",
        DAY: "Tag",
        MONTH: "Monat",
        ONE_OFF: "Einmalig",
      } as Record<string, string>
    )[interval || ""] || interval || "—"
  );
};

const suggestPricingPlanId = (
  plans: any[],
  startAt: string,
  endAt: string,
): string | number => {
  if (!plans.length || !startAt || !endAt) return "";

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (end <= start) return "";

  const durationHours = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60),
  );
  const sameDay = start.toDateString() === end.toDateString();

  const byInterval = (interval: string) =>
    plans.find((p) => p.billing_interval === interval);

  const hourPlan = byInterval("HOUR");
  const dayPlan = byInterval("DAY");
  const monthPlan = byInterval("MONTH");
  const oneOffPlan = byInterval("ONE_OFF");

  if (sameDay && durationHours < 24 && hourPlan) {
    if (dayPlan) {
      const hourTotal = Number(hourPlan.price) * durationHours;
      const dayTotal = Number(dayPlan.price);
      if (hourTotal >= dayTotal) return dayPlan.id;
    }
    return hourPlan.id;
  }

  if (dayPlan) {
    const days = Math.ceil(durationHours / 24);
    if (hourPlan) {
      const hourTotal = Number(hourPlan.price) * durationHours;
      const dayTotal = Number(dayPlan.price) * days;
      return dayTotal <= hourTotal ? dayPlan.id : hourPlan.id;
    }
    return dayPlan.id;
  }

  if (hourPlan) return hourPlan.id;
  if (monthPlan) return monthPlan.id;
  if (oneOffPlan) return oneOffPlan.id;
  return plans[0]?.id ?? "";
};

// Plans for Resource
const availablePlans = computed(() => {
  if (!form.value.resourceId) return [];
  return pricingPlans.value.filter(
    (p) => p.resource_id == form.value.resourceId,
  );
});

const applySuggestedTariff = () => {
  if (skipTariffAutoSelect.value) return;
  if (tariffManuallySelected.value) return;
  if (!form.value.resourceId || !form.value.start_at || !form.value.end_at)
    return;

  const suggested = suggestPricingPlanId(
    availablePlans.value,
    form.value.start_at,
    form.value.end_at,
  );
  if (suggested) form.value.pricingPlanId = String(suggested);
};

const suggestedPlanLabel = computed(() => {
  const suggestedId = suggestPricingPlanId(
    availablePlans.value,
    form.value.start_at,
    form.value.end_at,
  );
  if (!suggestedId || suggestedId == form.value.pricingPlanId) return "";
  const plan = availablePlans.value.find((p) => p.id == suggestedId);
  return plan ? `${plan.name} (${plan.price}€)` : "";
});

const applyInitialDate = (dateInput?: Date | string | null) => {
  if (!dateInput || isEdit.value) return;
  const base = new Date(dateInput);
  if (isNaN(base.getTime())) return;
  base.setHours(9, 0, 0, 0);
  const end = new Date(base.getTime() + currentDurationMs.value);
  form.value.start_at = formatDatetime(base);
  form.value.end_at = formatDatetime(end);
  applySuggestedTariff();
};

// --- DATA LOADING & SUBMIT ---

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

const hydrateEditForm = (booking: any) => {
  const user =
    users.value.find((u: any) => u.id == booking.user_id) ||
    booking.User ||
    null;

  skipTariffAutoSelect.value = true;
  tariffManuallySelected.value = false;

  form.value = {
    resourceId: booking.resource_id,
    user_id: booking.user_id,
    start_at: toDatetimeLocal(booking.start_at),
    end_at: toDatetimeLocal(booking.end_at),
    pricingPlanId: booking.pricing_plan_id || "",
    status: booking.status,
    user_preview: user,
    manual_price:
      booking.Invoice?.net_amount != null
        ? booking.Invoice.net_amount
        : booking.Invoice
          ? parseFloat(booking.Invoice.total_amount || 0) -
            parseFloat(booking.Invoice.tax_amount || 0)
          : null,
  };

  originalRange.value = {
    resourceId: String(booking.resource_id ?? ""),
    start_at: form.value.start_at,
    end_at: form.value.end_at,
  };
  originalManualPrice.value = form.value.manual_price;

  recalcDuration();
  nextTick(() => {
    skipTariffAutoSelect.value = false;
  });
};

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
      applySuggestedTariff();
    }
  }

  if (props.editData) {
    hydrateEditForm(props.editData);
  }
});

// Edit Watcher
watch(
  () => props.editData,
  (newVal) => {
    if (newVal) {
      hydrateEditForm(newVal);
    } else {
      tariffManuallySelected.value = false;
      skipTariffAutoSelect.value = false;
      form.value.resourceId = "";
      form.value.user_id = "";
      form.value.pricingPlanId = "";
      form.value.user_preview = null;
      if (props.initialDate) applyInitialDate(props.initialDate);
    }
  },
);

watch(
  () => form.value.resourceId,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      tariffManuallySelected.value = false;
      applySuggestedTariff();
    }
  },
);

watch(users, () => {
  if (props.editData?.user_id && !form.value.user_preview) {
    const user = users.value.find(
      (u: any) => u.id == props.editData.user_id,
    );
    if (user) form.value.user_preview = user;
  }
});

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
          excludeBookingId.value,
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
          availabilityMessage.value = isEdit.value
            ? "Zeitraum wird aktualisiert."
            : "Zeitraum ist verfügbar.";
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

const buildUpdatePayload = () => {
  const payload: Record<string, unknown> = {
    user_id: form.value.user_id,
    resource_id: form.value.resourceId,
    start_at: form.value.start_at,
    end_at: form.value.end_at,
    status: form.value.status,
  };

  if (
    form.value.manual_price !== null &&
    form.value.manual_price !== originalManualPrice.value
  ) {
    payload.manual_price = form.value.manual_price;
  }

  return payload;
};

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
        excludeBookingId.value,
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

  const resourceName =
    resources.value.find((r: any) => r.id == form.value.resourceId)?.name ||
    "Buchung";
  const startLabel = form.value.start_at
    ? new Date(form.value.start_at).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const endLabel = form.value.end_at
    ? new Date(form.value.end_at).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const rangeLabel =
    startLabel && endLabel ? `${startLabel} – ${endLabel}` : startLabel;

  const confirmed = await confirm(
    isEdit.value
      ? {
          title: "Änderungen speichern?",
          message: `Änderungen an „${resourceName}“ (${rangeLabel}) wirklich speichern?`,
          confirmLabel: "Speichern",
          variant: "warning",
        }
      : {
          title: "Buchung anlegen?",
          message: `Neue Buchung für „${resourceName}“ am ${rangeLabel} speichern?`,
          confirmLabel: "Anlegen",
          variant: "default",
        },
  );
  if (!confirmed) return;

  loading.value = true;
  try {
    if (isEdit.value) {
      await api.bookings.update(props.editData.id, buildUpdatePayload());
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
