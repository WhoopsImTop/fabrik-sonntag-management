<template>
  <div v-if="loading" class="flex justify-center flex-col gap-4 items-center min-h-[50vh]">
    <svg class="animate-spin w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
      </path>
    </svg>
    <p class="text-sm font-medium text-slate-500 animate-pulse">Lade Daten...</p>
  </div>

  <div v-else class="max-w-7xl mx-auto space-y-6 pb-24 font-sans text-slate-900">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <button @click="router.back()"
            class="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 transition-colors">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 class="text-2xl font-semibold tracking-tight">Neue Rechnung erstellen</h2>
        </div>
        <p class="text-sm text-slate-500 pl-10">
          Erstelle eine neue Rechnung mit Services, Resourcen oder Freitext.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button @click="router.back()"
          class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50">
          Abbrechen
        </button>

        <button @click="save" :disabled="saving"
          class="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 shadow transition-colors hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 gap-2">
          <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          Erstellen
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Kunde Auswahl -->
      <div class="lg:col-span-1 border border-slate-200 bg-white text-slate-950 shadow-sm rounded-lg">
        <div class="flex flex-col space-y-1.5 p-6 pb-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold leading-none tracking-tight">Kunde</h3>
            <span v-if="form.user_id"
              class="inline-flex items-center rounded-md border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 transition-colors">Ausgewählt</span>
            <span v-else
              class="inline-flex items-center rounded-md border border-slate-200 px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 transition-colors">Optional</span>
          </div>
          <p class="text-sm text-slate-500">Kundenkonto auswählen oder neu anlegen.</p>
        </div>

        <div class="p-6 pt-0 space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Kunden suchen
            </label>
            <div class="relative group">
              <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" v-model="userSearchQuery" @focus="showUserDropdown = true" @blur="closeUserDropdown"
                class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Name oder E-Mail..." />
              <button v-if="userSearchQuery" @click="clearUserSelection"
                class="absolute right-2.5 top-2.5 h-4 w-4 text-slate-500 hover:text-slate-900">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div v-if="showUserDropdown && filteredUsers.length > 0"
              class="absolute z-50 mt-1 w-[calc(100%-3rem)] md:w-[330px] rounded-md border border-slate-200 bg-white text-slate-950 shadow-md outline-none">
              <div class="max-h-60 overflow-y-auto p-1">
                <div v-for="user in filteredUsers" :key="user.id" @click="selectUser(user)"
                  class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900">
                  <div class="flex items-center gap-2">
                    <div
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-900">
                      {{ user.username.charAt(0).toUpperCase() }}
                    </div>
                    <div>
                      <div class="font-medium">{{ user.details?.company || user.username }}</div>
                      <div class="text-xs text-slate-500">{{ user.email }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="relative py-2">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-slate-200"></span>
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-white px-2 text-slate-500">Oder manuell</span>
            </div>
          </div>

          <div :class="{ 'opacity-50 pointer-events-none grayscale': form.user_id }"
            class="space-y-4 transition-all duration-300">
            <div>
              <label class="text-sm font-medium leading-none text-slate-700 mb-2 block">Kundentyp</label>
              <div class="flex rounded-lg border border-slate-200 overflow-hidden">
                <button type="button" @click="customerForm.user_type = 'PERSON'"
                  :class="['flex-1 px-3 py-1.5 text-xs font-medium transition-colors', customerForm.user_type === 'PERSON' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50']">Person</button>
                <button type="button" @click="customerForm.user_type = 'COMPANY'"
                  :class="['flex-1 px-3 py-1.5 text-xs font-medium transition-colors', customerForm.user_type === 'COMPANY' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50']">Firma</button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Vorname</label>
                <input v-model="customerForm.first_name"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  placeholder="Max" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Nachname</label>
                <input v-model="customerForm.last_name"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  placeholder="Mustermann" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700">{{ customerForm.user_type === 'COMPANY' ?
                'Firmenname (Pflicht)' : 'Firma (optional)' }}</label>
              <input v-model="customerForm.company" :required="customerForm.user_type === 'COMPANY'"
                class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                placeholder="Muster GmbH" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700">E-Mail</label>
              <input v-model="customerForm.email" type="email"
                class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                placeholder="max@beispiel.de" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700">Telefon (Mobil)</label>
              <input v-model="customerForm.phone" type="tel"
                class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                placeholder="+49 152 33 59 20 58" />
            </div>

            <div class="grid grid-cols-4 gap-4">
              <div class="col-span-3 space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Straße</label>
                <input v-model="customerForm.street"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  placeholder="Hauptstr." />
              </div>
              <div class="col-span-1 space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Nr.</label>
                <input v-model="customerForm.houseNumber"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  placeholder="1" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="col-span-1 space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">PLZ</label>
                <input v-model="customerForm.zip_code"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  placeholder="12345" />
              </div>
              <div class="col-span-2 space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Stadt</label>
                <input v-model="customerForm.city"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
                  placeholder="Berlin" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Einstellungen und Positionen -->
      <div class="lg:col-span-2 space-y-6">

        <!-- Einstellungen -->
        <div class="border border-slate-200 bg-white text-slate-950 shadow-sm rounded-lg">
          <div class="flex flex-col space-y-1.5 p-6 pb-4">
            <h3 class="font-semibold leading-none tracking-tight">Einstellungen</h3>
          </div>
          <div class="p-6 pt-0 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Status</label>
                <select v-model="form.status"
                  class="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="DRAFT">Entwurf</option>
                  <option value="SENT">Versendet</option>
                  <option value="PAID">Bezahlt</option>
                  <option value="OVERDUE">Überfällig</option>
                </select>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Rechnungsdatum</label>
                <input type="date" v-model="form.invoice_date"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Zahlungsziel</label>
                <input type="date" v-model="form.due_date"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Zahlungsziel (Tage)</label>
                <input type="number" v-model="form.days_to_pay"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" />
              </div>
            </div>
          </div>
        </div>

        <!-- Positionen Tabelle -->
        <div class="border border-slate-200 bg-white text-slate-950 shadow-sm rounded-lg">
          <div class="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
            <h3 class="font-semibold leading-none tracking-tight">Positionen</h3>
            <button @click="addItem"
              class="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Zeile hinzufügen
            </button>
          </div>

          <div class="w-full">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b border-slate-200">
                <tr class="border-b transition-colors hover:bg-slate-100/50 data-[state=selected]:bg-slate-100">
                  <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 w-[200px]">Beschreibung</th>
                  <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[50px]">Menge</th>
                  <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 w-[100px]">Einheit</th>
                  <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[75px]">Preis (€)</th>
                  <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[100px]">MwSt.</th>
                  <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[100px]">Gesamt</th>
                  <th class="h-10 px-2 align-middle w-[5%]"></th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                <tr v-for="(item, index) in form.items" :key="index"
                  class="border-b border-slate-100 transition-colors hover:bg-slate-50/50 group">
                  <td class="p-4 align-middle relative">
                    <div class="relative">
                      <input v-model="item.description" @input="handleInput(index)" @focus="focusRow(index)"
                        @blur="blurRow(index)"
                        class="border border-slate-200 flex h-9 w-full rounded-md border-transparent bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus:border-slate-300 focus:bg-white"
                        placeholder="Leistung eingeben..." />

                      <div v-if="focusedRowIndex === index && suggestions.length > 0"
                        class="absolute z-50 left-0 top-full mt-1 w-[300px] rounded-md border border-slate-200 bg-white shadow-md outline-none"
                        @mousedown.prevent>
                        <div class="p-1 max-h-60 overflow-y-auto">
                          <div v-for="sugg in suggestions" :key="sugg.id" @click="applySuggestion(index, sugg)"
                            class="relative flex cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900">
                            <div class="flex flex-col">
                              <span class="font-medium">{{ sugg.label }}</span>
                              <span class="text-[10px] text-slate-500 uppercase">{{ sugg.type }}</span>
                            </div>
                            <span class="font-medium text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{{
                              formatMoney(sugg.price) }} €</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="p-4 align-middle text-right">
                    <input type="number" v-model="item.quantity" min="1"
                      class="border border-slate-200 flex h-9 w-full text-right rounded-md border-transparent bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus:border-slate-300 focus:bg-white" />
                  </td>

                  <td class="p-4 align-middle text-left">
                    <input type="text" v-model="item.unit"
                      class="border border-slate-200 flex h-9 w-full rounded-md border-transparent bg-transparent px-3 py-1 text-sm text-slate-500 focus-visible:outline-none focus:border-slate-300 focus:bg-white"
                      placeholder="Einheit" name="suggestions" list="suggestions" />
                    <datalist id="suggestions">
                      <option value="Stunde"></option>
                      <option value="Tag"></option>
                      <option value="Monat"></option>
                      <option value="psch."></option>
                    </datalist>
                  </td>

                  <td class="p-4 align-middle text-right">
                    <input type="number" v-model="item.amount" step="0.01"
                      class="border border-slate-200 flex h-9 w-full text-right rounded-md border-transparent bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus:border-slate-300 focus:bg-white"
                      placeholder="0.00" />
                  </td>

                  <td class="p-4 align-middle text-right">
                    <select v-model="item.vat_rate"
                      class="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950">
                      <option :value="0">0%</option>
                      <option :value="0.07">7%</option>
                      <option :value="0.19">19%</option>
                    </select>
                  </td>

                  <td class="p-4 align-middle text-right font-medium">
                    {{ formatMoney(item.quantity * item.amount) }} €
                  </td>

                  <td class="p-4 align-middle text-center relative">
                    <button @click="removeItem(index)"
                      class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Löschen">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="bg-slate-50 border-t border-slate-200 p-4 pb-6 rounded-b-lg">
            <div class="flex justify-end pr-10">
              <div class="w-64 space-y-2">
                <div class="flex justify-between text-sm text-slate-500">
                  <span>Netto</span>
                  <span class="font-medium text-slate-900">{{ formatMoney(totals.net) }} €</span>
                </div>
                <div class="flex justify-between text-sm text-slate-500">
                  <span>USt (dynamisch)</span>
                  <span class="font-medium text-slate-900">{{ formatMoney(totals.tax) }} €</span>
                </div>
                <div class="flex justify-between pt-2 border-t border-slate-200 mt-2 font-semibold text-base">
                  <span>Gesamtbetrag</span>
                  <span>{{ formatMoney(totals.gross) }} €</span>
                </div>
              </div>
            </div>
          </div>
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
const loading = ref(true);
const saving = ref(false);

// DATA
const users = ref<any[]>([]);
const resources = ref<any[]>([]);
const services = ref<any[]>([]);
const allPricing = ref<any[]>([]);
const bookings = ref<any[]>([]); // New list for bookings to autofill

// USER & FORM STATE
const userSearchQuery = ref("");
const showUserDropdown = ref(false);

// Formular für die Rechnung
const form = ref({
  user_id: "" as string | number,
  status: "DRAFT",
  invoice_date: new Date().toISOString().split("T")[0],
  due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0], // 14 Tage
  days_to_pay: 7,
  notes: "",
  items: [
    {
      description: "",
      quantity: 1,
      unit: "Psch.",
      amount: 0,
      vat_rate: 0.19,
    },
  ],
});

// Formular für neuen Kunden
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
  user_type: "PERSON" as "PERSON" | "COMPANY",
});

watch(
  () => [form.value.invoice_date, form.value.days_to_pay],
  ([newInvoiceDate, newDays]) => {
    if (!newInvoiceDate) return;
    const dueDate = new Date(newInvoiceDate as string);
    dueDate.setDate(dueDate.getDate() + Number(newDays || 0));
    form.value.due_date = dueDate.toISOString().split("T")[0];
  }
);

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
  const list: any[] = [];
  services.value.forEach((s) =>
    list.push({
      id: `svc-${s.id}`,
      label: s.name,
      price: s.price_per_unit,
      unit: s.pricing_unit,
      type: "Service",
    }),
  );
  resources.value.forEach((r) => {
    const plans = allPricing.value.filter((p) => p.resource_id === r.id);
    if (plans.length > 0) {
      plans.forEach((plan) =>
        list.push({
          id: `res-${r.id}-p-${plan.id}`,
          label: `${r.name} - ${plan.name}`,
          price: plan.price,
          type: "Raum",
          unit: plan.billing_interval,
        }),
      );
    } else {
      list.push({ id: `res-${r.id}`, label: r.name, price: 0, type: "Raum", unit: "Stunde" });
    }
  });
  return list;
});

const suggestions = computed(() => {
  if (focusedRowIndex.value === null) return [];
  const currentInput =
    form.value.items[focusedRowIndex.value].description.toLowerCase();
  if (!currentInput) return allProducts.value;
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

// User Handling
const selectUser = (user: any) => {
  form.value.user_id = user.id;
  userSearchQuery.value = user.details?.company || user.username;
  showUserDropdown.value = false;
};

const clearUserSelection = () => {
  form.value.user_id = "";
  userSearchQuery.value = "";
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
  item.unit = translateUnit(suggestion.unit);
  focusedRowIndex.value = null;
};

const translateUnit = (unit: string) => {
  switch (unit) {
    case "PER_HOUR":
      return "Stunde";
    case "HOUR":
      return "Stunde";
    case "DAY":
      return "Tag";
    case "WEEK":
      return "Woche";
    case "MONTH":
      return "Monat";
    case "YEAR":
      return "Jahr";
    case "ONE_OFF":
      return "Einmalig";
    case "LIFETIME":
      return "Lebenslang";
    case "PER_BOOKING":
      return "Pro Buchung";
    case "PER_DAY":
      return "Pro Tag";
    case "PER_WEEK":
      return "Pro Woche";
    case "PER_MONTH":
      return "Pro Monat";
    case "PER_YEAR":
      return "Pro Jahr";
    default:
      return unit;
  }
};

const addItem = () =>
  form.value.items.push({
    description: "",
    quantity: 1,
    unit: "Psch.",
    amount: 0,
    vat_rate: 0.19,
  });
const removeItem = (index: number) => {
  if (form.value.items.length > 1) form.value.items.splice(index, 1);
  else
    form.value.items[0] = {
      description: "",
      quantity: 1,
      unit: "Psch.",
      amount: 0,
      vat_rate: 0.19,
    };
};

const populateFromBooking = () => {
  const bookingId = Number(route.query.bookingId);
  if (!bookingId || isNaN(bookingId)) return;

  const b = bookings.value.find(bk => bk.id === bookingId);
  if (b) {
    if (b.user_id) {
      const user = users.value.find(u => u.id === b.user_id);
      if (user) {
        selectUser(user);
      }
    }

    // Attempt to prepopulate description and price based on resource/pricing
    if (b.Resource && b.PricingPlan) {
      form.value.items[0].description = `Buchung: ${b.Resource.name} - ${b.PricingPlan.name}`;
      form.value.items[0].amount = b.PricingPlan.price;
    } else if (b.Resource) {
      form.value.items[0].description = `Buchung: ${b.Resource.name}`;
    }
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [u, r, s, p, bks] = await Promise.all([
      api.users.getAll(),
      api.resources.getAll(),
      api.services.getAll(),
      api.pricing.getAll(),
      api.bookings.getAll()
    ]);
    users.value = (u as any) || [];
    resources.value = (r as any) || [];
    services.value = (s as any) || [];
    allPricing.value = (p as any) || [];
    bookings.value = (bks as any) || [];

    // Check if we have a booking to auto-fill
    populateFromBooking();

  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  // Validate Required Fields
  if (!form.value.user_id) {
    if (customerForm.value.user_type === 'COMPANY' && !customerForm.value.company.trim()) {
      alert("Bitte geben Sie einen Firmennamen an.");
      return;
    }
    if (customerForm.value.user_type === 'PERSON' && (!customerForm.value.first_name.trim() || !customerForm.value.last_name.trim())) {
      alert("Bitte geben Sie Vor- und Nachnamen an.");
      return;
    }
    if (!customerForm.value.street.trim() || !customerForm.value.zip_code.trim() || !customerForm.value.city.trim()) {
      alert("Bitte geben Sie die vollständige Adresse (Straße, PLZ, Ort) an.");
      return;
    }
  }

  if (!form.value.invoice_date) {
    alert("Bitte geben Sie ein Rechnungsdatum an.");
    return;
  }

  if (form.value.days_to_pay === null || form.value.days_to_pay === undefined || form.value.days_to_pay === "" as any) {
    alert("Bitte geben Sie das Zahlungsziel in Tagen an.");
    return;
  }

  const cleanItems = form.value.items.filter(
    (i) => i.description.trim() !== "" || Number(i.amount) > 0,
  );
  if (cleanItems.length === 0) {
    alert("Bitte mindestens eine Position hinzufügen.");
    return;
  }

  saving.value = true;
  try {
    let finalUserId = form.value.user_id;

    // Create new customer if no user selected
    if (!finalUserId) {
      const userPayload = {
        username: customerForm.value.user_type === 'COMPANY'
          ? customerForm.value.company
          : `${customerForm.value.first_name} ${customerForm.value.last_name}`.trim(),
        email: customerForm.value.email,
        password: Math.random().toString(36).slice(-10),
        role: "USER",
        details: { ...customerForm.value },
      };

      const newUser: any = await api.users.create(userPayload as any);
      if (newUser && newUser.id) {
        finalUserId = newUser.id;
      }
    }

    const payload = {
      user_id: finalUserId || null,
      status: form.value.status,
      invoice_date: form.value.invoice_date,
      due_date: form.value.due_date,
      days_to_pay: Number(form.value.days_to_pay),
      notes: form.value.notes,
      items: cleanItems,
    };

    if (route.query.bookingId) {
      (payload as any).booking_id = Number(route.query.bookingId);
    }

    const result: any = await api.sales.create(payload as any);

    if (result && result.invoice?.id) {
      router.push(`/booking-system/invoices/${result.invoice.id}`);
    } else {
      router.push("/booking-system/invoices");
    }
  } catch (e: any) {
    console.error(e);
    const msg = e?.data?.message || e?.message || "Unbekannter Fehler";
    alert("Fehler beim Erstellen der Rechnung: " + msg);
  } finally {
    saving.value = false;
  }
};

const closeUserDropdown = () => {
  setTimeout(() => {
    showUserDropdown.value = false;
  }, 200);
};

onMounted(() => {
  loadData();
});
</script>
