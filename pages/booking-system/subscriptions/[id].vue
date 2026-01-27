<template>
  <div v-if="loading" class="flex justify-center items-center min-h-[50vh]">
    <svg
      class="animate-spin w-8 h-8 text-neutral-400"
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

  <div v-else class="max-w-7xl mx-auto space-y-6 pb-24">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <button
          @click="router.back()"
          class="p-2 hover:bg-neutral-100 rounded-full text-neutral-500 transition-colors"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div>
          <h1
            class="text-2xl font-bold text-neutral-900 flex items-center gap-2"
          >
            {{ isNew ? "Neues Abonnement" : "Abonnement bearbeiten" }}
            <span
              v-if="!isNew"
              :class="[
                'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                getStatusClass(form.status),
              ]"
            >
              {{ getStatusLabel(form.status) }}
            </span>
          </h1>
          <p class="text-sm text-neutral-500 mt-1" v-if="!isNew">
            ID #{{ route.params.id }}
          </p>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          @click="router.back()"
          class="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
        >
          Abbrechen
        </button>

        <button
          @click="save"
          :disabled="saving"
          class="px-4 py-2 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <svg v-if="saving" class="animate-spin w-4 h-4" viewBox="0 0 24 24">
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
          {{ isNew ? "Erstellen" : "Speichern" }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div class="lg:col-span-1 space-y-6">
        <div
          class="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div
            class="p-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center"
          >
            <h3 class="font-semibold text-neutral-900 flex items-center gap-2">
              <svg
                class="w-4 h-4 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Kunde
            </h3>
            <span
              v-if="form.user_id"
              class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full"
              >Ausgewählt</span
            >
            <span
              v-else
              class="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase rounded-full"
              >Neu</span
            >
          </div>

          <div class="p-5 space-y-5">
            <div class="relative">
              <label
                class="block text-xs font-medium text-neutral-500 mb-1.5 uppercase"
                >Kunden suchen</label
              >
              <div class="relative group">
                <input
                  type="text"
                  v-model="userSearchQuery"
                  @focus="showUserDropdown = true"
                  @blur="closeUserDropdown"
                  class="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:bg-white focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
                  placeholder="Name oder Firma..."
                />
                <div
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <button
                  v-if="userSearchQuery"
                  @click="clearUserSelection"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-600 p-1 rounded-full hover:bg-neutral-200"
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

              <div
                v-if="showUserDropdown && filteredUsers.length > 0"
                class="absolute z-20 left-0 top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-neutral-100 max-h-60 overflow-y-auto"
              >
                <div
                  v-for="user in filteredUsers"
                  :key="user.id"
                  @click="selectUser(user)"
                  class="px-3 py-2.5 hover:bg-neutral-50 cursor-pointer border-b border-neutral-50 last:border-0 flex items-center gap-3"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600 shrink-0"
                  >
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                  <div class="truncate">
                    <div class="text-sm font-medium text-neutral-900 truncate">
                      {{ user.details?.company || user.username }}
                    </div>
                    <div class="text-xs text-neutral-500 truncate">
                      {{ user.email }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="h-px bg-neutral-100 w-full"></div>

            <div
              :class="{ 'opacity-75 pointer-events-none': form.user_id }"
              class="space-y-4 transition-opacity"
            >
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-xs font-medium text-neutral-500"
                    >Vorname</label
                  >
                  <input
                    v-model="customerForm.first_name"
                    class="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-300"
                    placeholder="Max"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-medium text-neutral-500"
                    >Nachname</label
                  >
                  <input
                    v-model="customerForm.last_name"
                    class="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-300"
                    placeholder="Mustermann"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-500"
                  >Firma</label
                >
                <input
                  v-model="customerForm.company"
                  class="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-300"
                  placeholder="Muster GmbH"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-500"
                  >E-Mail</label
                >
                <input
                  v-model="customerForm.email"
                  type="email"
                  class="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-300"
                  placeholder="max@beispiel.de"
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-500"
                  >Telefon (Mobil)</label
                >
                <input
                  v-model="customerForm.phone"
                  type="phone"
                  class="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-300"
                  placeholder="+49 152 33 59 20 58"
                />
              </div>

              <div class="space-y-1 grid grid-cols-4 gap-2">
                <div class="col-span-3">
                  <label class="text-xs font-medium text-neutral-500"
                    >Straße</label
                  >
                  <input
                    v-model="customerForm.street"
                    class="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-300"
                    placeholder="Hauptstr. 1"
                  />
                </div>
                <div class="col-span-1">
                  <label class="text-xs font-medium text-neutral-500"
                    >Nr.</label
                  >
                  <input
                    v-model="customerForm.houseNumber"
                    class="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-300"
                    placeholder="1"
                  />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <div class="space-y-1 col-span-1">
                  <label class="text-xs font-medium text-neutral-500"
                    >PLZ</label
                  >
                  <input
                    v-model="customerForm.zip_code"
                    class="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-300"
                    placeholder="12345"
                  />
                </div>
                <div class="space-y-1 col-span-2">
                  <label class="text-xs font-medium text-neutral-500"
                    >Stadt</label
                  >
                  <input
                    v-model="customerForm.city"
                    class="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 placeholder:text-neutral-300"
                    placeholder="Berlin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div
          class="bg-white border border-neutral-200 rounded-xl shadow-sm p-6"
        >
          <h3 class="font-semibold text-neutral-900 mb-4">Einstellungen</h3>

          <div class="space-y-4">
            <div>
              <label
                class="block text-xs font-medium text-neutral-500 uppercase mb-1"
                >Titel / Referenz</label
              >
              <input
                v-model="form.description"
                type="text"
                class="w-full text-base font-medium text-neutral-900 placeholder-neutral-300 border border-neutral-200 rounded-lg focus:border-neutral-900 focus:ring-neutral-900 px-3 py-2"
                placeholder="z.B. Miete Büro 101 - Jahr 2026"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  class="block text-xs font-medium text-neutral-500 uppercase mb-1"
                  >Intervall</label
                >
                <select
                  v-model="form.interval"
                  class="block w-full pl-3 pr-10 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-neutral-900 focus:border-neutral-900 bg-white"
                >
                  <option value="MONTHLY">Monatlich</option>
                  <option value="YEARLY">Jährlich</option>
                </select>
              </div>

              <div>
                <label
                  class="block text-xs font-medium text-neutral-500 uppercase mb-1"
                  >Nächste Fälligkeit</label
                >
                <input
                  type="date"
                  v-model="form.next_billing_date"
                  class="p-2 block w-full text-sm border border-neutral-200 rounded-lg focus:ring-neutral-900 focus:border-neutral-900"
                />
              </div>

              <div>
                <label
                  class="block text-xs font-medium text-neutral-500 uppercase mb-1"
                  >Status</label
                >
                <select
                  v-model="form.status"
                  class="block w-full pl-3 pr-10 py-2 text-sm border border-neutral-200 rounded-lg focus:ring-neutral-900 focus:border-neutral-900"
                >
                  <option value="ACTIVE">Aktiv</option>
                  <option value="PAUSED">Pausiert</option>
                  <option value="CANCELLED">Beendet</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div
          class="bg-white border border-neutral-200 rounded-xl shadow-sm flex flex-col"
        >
          <div
            class="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30"
          >
            <h3 class="font-semibold text-neutral-900">Positionen</h3>
            <button
              @click="addItem"
              class="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Zeile hinzufügen
            </button>
          </div>

          <table class="w-full text-sm text-left">
            <thead
              class="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-100"
            >
              <tr>
                <th class="px-6 py-3 w-[35%]">Beschreibung</th>
                <th class="px-4 py-3 text-right w-[12%]">Menge</th>
                <th class="px-4 py-3 text-right w-[15%]">Preis (€)</th>
                <th class="px-4 py-3 text-right w-[12%]">MwSt.</th>
                <th class="px-6 py-3 text-right w-[15%]">Gesamt</th>
                <th class="w-[5%]"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr
                v-for="(item, index) in form.items"
                :key="index"
                class="group hover:bg-neutral-50/50"
              >
                <td class="px-6 py-3 relative">
                  <div class="relative">
                    <input
                      v-model="item.description"
                      @input="handleInput(index)"
                      @focus="focusRow(index)"
                      @blur="blurRow(index)"
                      class="w-full bg-transparent border-0 border-b border-transparent focus:border-neutral-400 focus:ring-0 p-0 text-sm placeholder-neutral-300"
                      placeholder="Leistung eingeben..."
                    />

                    <div
                      v-if="focusedRowIndex === index && suggestions.length > 0"
                      class="absolute z-50 left-0 top-full mt-1 w-full min-w-[300px] bg-white rounded-lg shadow-xl border border-neutral-100 max-h-60 overflow-y-auto"
                      @mousedown.prevent
                    >
                      <div
                        v-for="sugg in suggestions"
                        :key="sugg.id"
                        @click="applySuggestion(index, sugg)"
                        class="px-3 py-2.5 hover:bg-neutral-50 cursor-pointer border-b border-neutral-50 last:border-0 flex justify-between items-center group/item"
                      >
                        <div>
                          <div class="text-sm font-medium text-neutral-900">
                            {{ sugg.label }}
                          </div>
                          <div
                            class="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold"
                          >
                            {{ sugg.type }}
                          </div>
                        </div>
                        <div
                          class="text-xs font-bold text-neutral-700 bg-neutral-100 px-2 py-1 rounded group-hover/item:bg-white"
                        >
                          {{ formatMoney(sugg.price) }} €
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                <td class="px-4 py-3 text-right">
                  <input
                    type="number"
                    v-model="item.quantity"
                    min="1"
                    class="w-full text-right bg-transparent border-0 border-b border-transparent focus:border-neutral-400 focus:ring-0 p-0 text-sm"
                    placeholder="1"
                  />
                </td>

                <td class="px-4 py-3 text-right">
                  <input
                    type="number"
                    v-model="item.amount"
                    step="0.01"
                    class="w-full text-right bg-transparent border-0 border-b border-transparent focus:border-neutral-400 focus:ring-0 p-0 text-sm"
                    placeholder="0.00"
                  />
                </td>

                <td class="px-4 py-3 text-right">
                  <select
                    v-model="item.vat_rate"
                    class="w-full text-right bg-transparent border border-neutral-200 rounded focus:border-neutral-400 focus:ring-0 px-2 py-1 text-sm"
                  >
                    <option :value="0">0%</option>
                    <option :value="0.07">7%</option>
                    <option :value="0.19">19%</option>
                  </select>
                </td>

                <td class="px-6 py-3 text-right font-medium text-neutral-900">
                  €{{ formatMoney(item.quantity * item.amount) }}
                </td>

                <td class="px-2 text-center">
                  <button
                    @click="removeItem(index)"
                    class="text-neutral-300 hover:text-red-500 transition-colors p-1"
                    title="Löschen"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>

            <tfoot class="bg-neutral-50 border-t border-neutral-200">
              <tr>
                <td colspan="4" class="px-6 py-3 text-right text-neutral-600">
                  Netto
                </td>
                <td class="px-6 py-3 text-right text-neutral-900">
                  €{{ formatMoney(totals.net) }}
                </td>
                <td></td>
              </tr>
              <tr>
                <td colspan="4" class="px-6 py-1 text-right text-neutral-600">
                  USt (19%)
                </td>
                <td class="px-6 py-1 text-right text-neutral-900">
                  €{{ formatMoney(totals.tax) }}
                </td>
                <td></td>
              </tr>
              <tr>
                <td
                  colspan="4"
                  class="px-6 py-4 text-right font-bold text-lg text-neutral-900"
                >
                  Gesamtbetrag
                </td>
                <td
                  class="px-6 py-4 text-right font-bold text-lg text-neutral-900"
                >
                  €{{ formatMoney(totals.gross) }}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";

const route = useRoute();
const router = useRouter();
const api = useBookingApi();

// --- STATE ---
const isNew = computed(() => route.params.id === "new");
const loading = ref(true);
const saving = ref(false);

// DATA
const users = ref<any[]>([]);
const resources = ref<any[]>([]);
const services = ref<any[]>([]);
const allPricing = ref<any[]>([]);

// USER & FORM STATE
const userSearchQuery = ref("");
const showUserDropdown = ref(false);

// Formular für das Abo
const form = ref({
  user_id: "" as string | number,
  description: "",
  interval: "MONTHLY",
  status: "ACTIVE",
  next_billing_date: new Date().toISOString().split("T")[0],
  items: [{ description: "", quantity: 1, amount: 0, vat_rate: 0.19 }],
});

// Formular für den Kunden
const customerForm = ref({
  first_name: "",
  last_name: "",
  company: "",
  email: "",
  street: "",
  houseNumber: "",
  phone: "",
  zip_code: "",
  city: "",
});

// AUTOCOMPLETE
const focusedRowIndex = ref<number | null>(null);

// --- COMPUTED ---

// Filter Users for Autocomplete
const filteredUsers = computed(() => {
  if (!userSearchQuery.value) return users.value.slice(0, 5);
  const q = userSearchQuery.value.toLowerCase();
  return users.value
    .filter(
      (u) =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.details?.company && u.details.company.toLowerCase().includes(q)),
    )
    .slice(0, 8);
});

// Product Suggestions
const allProducts = computed(() => {
  const list = [];
  services.value.forEach((s) =>
    list.push({
      id: `svc-${s.id}`,
      label: s.name,
      price: s.price_per_unit,
      type: "Service",
    }),
  );
  resources.value.forEach((r) => {
    const plans = allPricing.value.filter((p) => p.resource_id === r.id);
    if (plans.length > 0) {
      // Zeige ALLE Pläne für diese Resource
      plans.forEach((plan) =>
        list.push({
          id: `res-${r.id}-p-${plan.id}`,
          label: `${r.name} - ${plan.name}`,
          price: plan.price,
          type: "Raum",
        }),
      );
    } else {
      // Falls keine Pläne, zeige Resource mit Preis 0
      list.push({ id: `res-${r.id}`, label: r.name, price: 0, type: "Raum" });
    }
  });
  return list;
});

const suggestions = computed(() => {
  if (focusedRowIndex.value === null) return [];
  const currentInput =
    form.value.items[focusedRowIndex.value].description.toLowerCase();
  if (!currentInput) return allProducts.value.slice(0, 5);
  return allProducts.value
    .filter((p) => p.label.toLowerCase().includes(currentInput))
    .slice(0, 8);
});

const totals = computed(() => {
  const net = form.value.items.reduce(
    (sum, item) => sum + Number(item.amount || 0) * Number(item.quantity || 1),
    0,
  );
  const tax = form.value.items.reduce((sum, item) => {
    const rate =
      typeof item.vat_rate === "number" ? Number(item.vat_rate) : 0.19;
    return sum + Number(item.amount || 0) * Number(item.quantity || 1) * rate;
  }, 0);
  return { net, tax, gross: net + tax };
});

// --- METHODS ---

const formatMoney = (val: any) => Number(val || 0).toFixed(2);
const getStatusLabel = (s: string) =>
  ({ ACTIVE: "Aktiv", PAUSED: "Pausiert", CANCELLED: "Beendet" })[s] || s;
const getStatusClass = (s: string) =>
  ({
    ACTIVE: "bg-green-100 text-green-700 border-green-200",
    PAUSED: "bg-yellow-100 text-yellow-700 border-yellow-200",
    CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
  })[s] || "bg-gray-100 text-gray-700 border-gray-200";

// User Handling
const selectUser = (user: any) => {
  form.value.user_id = user.id;
  userSearchQuery.value = user.details?.company || user.username;
  showUserDropdown.value = false;

  customerForm.value = {
    first_name: user.details?.first_name || "",
    last_name: user.details?.last_name || "",
    company: user.details?.company || "",
    email: user.email || "",
    street: user.details?.street || "",
    zip_code: user.details?.zip_code || "",
    city: user.details?.city || "",
  };
};

const clearUserSelection = () => {
  form.value.user_id = "";
  userSearchQuery.value = "";
  customerForm.value = {
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    street: "",
    zip_code: "",
    city: "",
  };
};

// Table Handling
const focusRow = (index: number) => {
  focusedRowIndex.value = index;
};
const blurRow = (index: number) => {
  setTimeout(() => {
    if (focusedRowIndex.value === index) focusedRowIndex.value = null;
  }, 200);
};
const handleInput = (index: number) => {
  /* Reactivity trigger */
};

const applySuggestion = (index: number, suggestion: any) => {
  const item = form.value.items[index];
  item.description = suggestion.label;
  item.amount = suggestion.price;
  focusedRowIndex.value = null;
};

const addItem = () =>
  form.value.items.push({
    description: "",
    quantity: 1,
    amount: 0,
    vat_rate: 0.19,
  });
const removeItem = (index: number) => {
  if (form.value.items.length > 1) form.value.items.splice(index, 1);
  else
    form.value.items[0] = {
      description: "",
      quantity: 1,
      amount: 0,
      vat_rate: 0.19,
    };
};

const loadData = async () => {
  loading.value = true;
  try {
    const [u, r, s, p] = await Promise.all([
      api.users.getAll(),
      api.resources.getAll(),
      api.services.getAll(),
      api.pricing.getAll(),
    ]);
    users.value = u || [];
    resources.value = r || [];
    services.value = s || [];
    allPricing.value = p || [];

    if (!isNew.value) {
      const allSubs = await api.subscriptions.getAll();
      const sub = allSubs?.find((s: any) => s.id == route.params.id);
      if (sub) {
        form.value = {
          user_id: sub.user_id,
          description: sub.description,
          interval: sub.interval,
          status: sub.status,
          next_billing_date: sub.next_billing_date,
          items:
            sub.LineItems?.map((li: any) => ({
              description: li.description,
              quantity: li.quantity,
              amount: li.amount,
              vat_rate: li.vat_rate || 0.19,
            })) || [],
        };
        const linkedUser = users.value.find((u) => u.id === sub.user_id);
        if (linkedUser) selectUser(linkedUser);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  saving.value = true;
  try {
    let finalUserId = form.value.user_id;
    if (!form.value.next_billing_date) {
      alert("Bitte ein nächstes Abrechnungsdatum angeben.");
      saving.value = false;
      return;
    }

    if (!finalUserId) {
      if (!customerForm.value.first_name || !customerForm.value.email) {
        alert(
          "Bitte wähle einen Kunden aus oder fülle mindestens Name und E-Mail aus, um einen neuen anzulegen.",
        );
        saving.value = false;
        return;
      }

      const userPayload = {
        username: customerForm.value.email,
        email: customerForm.value.email,
        password: Math.random().toString(36).slice(-10),
        role: "user",
        isActive: true,
        first_name: customerForm.value.first_name,
        last_name: customerForm.value.last_name,
        details: { ...customerForm.value },
      };

      const newUser = await api.users.create(userPayload);
      if (newUser && newUser.id) {
        finalUserId = newUser.id;
      } else {
        throw new Error("Fehler beim Erstellen des Kunden.");
      }
    }

    const cleanItems = form.value.items.filter(
      (i) => i.description.trim() !== "" || i.amount > 0,
    );
    if (cleanItems.length === 0) {
      alert("Bitte mindestens eine Position hinzufügen.");
      saving.value = false;
      return;
    }

    const payload = { ...form.value, user_id: finalUserId, items: cleanItems };

    if (isNew.value) await api.subscriptions.create(payload);
    else await api.subscriptions.update(Number(route.params.id), payload);

    router.push("/booking-system/subscriptions");
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
};

const closeUserDropdown = () => {
  setTimeout(() => {
    showUserDropdown.value = false
  }, 200)
}

onMounted(() => {
  loadData();
});
</script>
