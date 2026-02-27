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

  <div v-else-if="!invoice" class="text-center py-12">
    <h2 class="text-xl font-semibold text-slate-900">Rechnung nicht gefunden</h2>
    <button @click="router.back()" class="mt-4 text-blue-600 hover:underline">Zurück</button>
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
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-semibold tracking-tight">{{ invoice.invoice_number }}</h2>
            <span :class="[
              'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
              getStatusClass(invoice.status),
            ]">
              {{ getStatusLabel(invoice.status) }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <template v-if="isEditing">
          <button @click="toggleEditMode"
            class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50">
            Abbrechen
          </button>
          <button @click="saveInvoice" :disabled="saving"
            class="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-slate-50 shadow transition-colors hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 gap-2">
            <svg v-if="saving" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            Speichern
          </button>
        </template>
        <template v-else>
          <button @click="handleDownload"
            class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 gap-2">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PDF Laden
          </button>
          <button @click="sendInvoiceEmail"
            class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950">
            Email senden
          </button>
          <button @click="toggleEditMode"
            class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950">
            Bearbeiten
          </button>
          <button @click="handleDelete"
            class="inline-flex h-9 items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500">
            Löschen
          </button>
        </template>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div class="lg:col-span-1 border border-slate-200 bg-white text-slate-950 shadow-sm rounded-lg">
        <div class="flex flex-col space-y-1.5 p-6 pb-4">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold leading-none tracking-tight">Kunde</h3>
            <span v-if="form.user_id || invoice.User"
              class="inline-flex items-center rounded-md border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 transition-colors">Ausgewählt</span>
            <span v-else
              class="inline-flex items-center rounded-md border border-slate-200 px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 transition-colors">Gast
              / Manuell</span>
          </div>
          <p class="text-sm text-slate-500">
            {{ isEditing ? 'Kundenkonto auswählen oder entfernen.' : 'Zugewiesener Kunde dieser Rechnung.' }}
          </p>
        </div>

        <div class="p-6 pt-0 space-y-4">
          <template v-if="isEditing">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">
                Kunden suchen
              </label>
              <div v-if="form.user_id"
                class="flex items-center justify-between p-2 rounded-md border border-slate-200 bg-slate-50">
                <div class="flex flex-col overflow-hidden">
                  <span class="text-sm font-medium truncate">{{ form.user_preview?.username || "User ID: " +
                    form.user_id }}</span>
                  <span class="text-xs text-slate-500 truncate">{{ form.user_preview?.email || "..." }}</span>
                </div>
                <button @click="removeUser"
                  class="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div v-else class="relative group">
                <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" fill="none" stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" v-model="userSearchQuery" @input="handleUserSearch"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Name oder E-Mail..." />

                <div v-if="userSearchResults.length > 0"
                  class="absolute z-50 mt-1 w-[calc(100%-0rem)] rounded-md border border-slate-200 bg-white text-slate-950 shadow-md outline-none">
                  <div class="max-h-60 overflow-y-auto p-1">
                    <div v-for="user in userSearchResults" :key="user.id" @click="selectUser(user)"
                      class="relative flex cursor-pointer select-none flex-col rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-slate-100 hover:text-slate-900">
                      <span class="font-medium">{{ user.username }}</span>
                      <span class="text-xs text-slate-500">{{ user.email }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="isSearchingUsers" class="absolute right-3 top-2.5">
                  <svg class="animate-spin w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-if="invoice.User" class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-900">
                {{ invoice.User.username?.substring(0, 2).toUpperCase() }}
              </div>
              <div class="overflow-hidden">
                <p class="text-sm font-medium text-slate-900 truncate">{{ invoice.User.username }}</p>
                <p class="text-xs text-slate-500 truncate">{{ invoice.User.email }}</p>
              </div>
            </div>
            <div v-else class="text-sm text-slate-500 italic">
              Gast / Manuell
            </div>
          </template>
        </div>
      </div>

      <div class="lg:col-span-2 space-y-6">
        <div class="border border-slate-200 bg-white text-slate-950 shadow-sm rounded-lg">
          <div class="flex flex-col space-y-1.5 p-6 pb-4 border-b border-slate-100">
            <h3 class="font-semibold leading-none tracking-tight">Einstellungen</h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Status</label>
                <select v-if="isEditing" v-model="form.status"
                  class="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="DELETED">Storniert</option>
                  <option value="DRAFT">Entwurf</option>
                  <option value="SENT">Versendet</option>
                  <option value="PAID">Bezahlt</option>
                  <option value="OVERDUE">Überfällig</option>
                </select>
                <div v-else
                  class="flex h-9 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 shadow-sm">
                  {{ getStatusLabel(invoice.status) }}
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Rechnungsdatum</label>
                <input v-if="isEditing" type="date" v-model="form.invoice_date"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" />
                <div v-else
                  class="flex h-9 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-500 shadow-sm">
                  {{ formatDate(invoice.invoice_date || invoice.createdAt) }}
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-medium leading-none text-slate-700">Fälligkeitsdatum</label>
                <input v-if="isEditing" type="date" v-model="form.due_date"
                  class="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950" />
                <div v-else
                  class="flex h-9 w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-500 shadow-sm">
                  {{ formatDate(invoice.due_date) }}
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="border border-slate-200 bg-white text-slate-950 shadow-sm rounded-lg">
          <div class="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
            <h3 class="font-semibold leading-none tracking-tight">Positionen</h3>
            <button v-if="isEditing" @click="addItem"
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
                  <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 w-[35%]">Beschreibung</th>
                  <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[10%]">Menge</th>
                  <th class="h-10 px-4 text-left align-middle font-medium text-slate-500 w-[15%]">Einheit</th>
                  <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[12%]">Preis (€)</th>
                  <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[14%]">MwSt.</th>
                  <th class="h-10 px-4 text-right align-middle font-medium text-slate-500 w-[14%]">Gesamt</th>
                  <th v-if="isEditing" class="h-10 px-2 align-middle w-[5%]"></th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                <tr v-for="(item, index) in form.items" :key="index"
                  class="border-b border-slate-100 transition-colors hover:bg-slate-50/50 group">
                  <td class="p-4 align-middle relative">
                    <div v-if="isEditing" class="relative">
                      <input v-model="item.description" @focus="focusRow(index)" @blur="blurRow(index)"
                        class="flex h-9 w-full rounded-md border-transparent bg-transparent px-3 py-1 text-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus:border-slate-300 focus:bg-white"
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
                    <span v-else class="font-medium text-slate-900 block px-3 py-1">{{ item.description }}</span>
                  </td>

                  <td class="p-4 align-middle text-right">
                    <input v-if="isEditing" type="number" v-model="item.quantity" min="1"
                      class="flex h-9 w-full text-right rounded-md border-transparent bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus:border-slate-300 focus:bg-white" />
                    <span v-else class="text-slate-600 block px-3 py-1">{{ item.quantity }}</span>
                  </td>

                  <td class="p-4 align-middle text-left">
                    <input v-if="isEditing" type="text" v-model="item.unit"
                      class="flex h-9 w-full rounded-md border-transparent bg-transparent px-3 py-1 text-sm text-slate-500 focus-visible:outline-none focus:border-slate-300 focus:bg-white"
                      placeholder="Einheit" name="suggestions" list="suggestions" />
                    <span v-else class="text-slate-500 block px-3 py-1">{{ item.unit || '-' }}</span>
                    <datalist id="suggestions">
                      <option value="Stunde"></option>
                      <option value="Tag"></option>
                      <option value="Monat"></option>
                      <option value="psch."></option>
                    </datalist>
                  </td>

                  <td class="p-4 align-middle text-right">
                    <input v-if="isEditing" type="number" v-model="item.amount" step="0.01"
                      class="flex h-9 w-full text-right rounded-md border-transparent bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus:border-slate-300 focus:bg-white"
                      placeholder="0.00" />
                    <span v-else class="text-slate-900 block px-3 py-1">{{ formatMoney(item.amount) }} €</span>
                  </td>

                  <td class="p-4 align-middle text-right">
                    <select v-if="isEditing" v-model="item.vat_rate"
                      class="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950">
                      <option :value="0">0%</option>
                      <option :value="0.07">7%</option>
                      <option :value="0.19">19%</option>
                    </select>
                    <span v-else class="text-slate-600 block px-3 py-1">{{ Math.round((item.vat_rate || 0.19) * 100)
                    }}%</span>
                  </td>

                  <td class="p-4 align-middle text-right font-medium">
                    {{ formatMoney((Number(item.quantity) || 0) * (Number(item.amount) || 0)) }} €
                  </td>

                  <td v-if="isEditing" class="p-4 align-middle text-center relative">
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

                <tr v-if="isEditing && form.items.length === 0">
                  <td colspan="7" class="p-8 text-center text-sm text-slate-500">
                    Keine Positionen vorhanden. <button @click="addItem"
                      class="text-slate-900 font-medium hover:underline">Erste Zeile hinzufügen</button>
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
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

// Fix Nuxt auto-import issues by asserting useBookingApi exists.
// In Nuxt this is auto-imported, so we'll just use it directly.
const api = useBookingApi();

const loading = ref(true);
const saving = ref(false);
const isEditing = ref(false);
const invoice = ref<any>(null);

const form = ref({
  status: "DRAFT",
  notes: "",
  invoice_date: "",
  due_date: "",
  user_id: null as number | null,
  user_preview: null as any,
  items: [] as Array<{
    description: string;
    quantity: number;
    unit: string;
    amount: number;
    vat_rate?: number;
  }>
});

const invoiceId = route.params.id as string;

// Data for autocomplete
const resources = ref<any[]>([]);
const services = ref<any[]>([]);
const allPricing = ref<any[]>([]);

// Autocomplete state
const focusedRowIndex = ref<number | null>(null);

// Search State
const userSearchQuery = ref("");
const userSearchResults = ref<any[]>([]);
const isSearchingUsers = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const formatMoney = (val: any) => Number(val || 0).toFixed(2);

const getStatusLabel = (s: string) =>
  ({
    DELETED: "Storniert",
    DRAFT: "Entwurf",
    SENT: "Versendet",
    PAID: "Bezahlt",
    PARTIALLY_PAID: "Teilweise bezahlt",
    OVERDUE: "Überfällig",
  })[s] || s;

const getStatusClass = (s: string) =>
  ({
    PAID: "border-emerald-200 bg-emerald-100 text-emerald-800",
    PARTIALLY_PAID: "border-purple-200 bg-purple-100 text-purple-800",
    SENT: "border-blue-200 bg-blue-100 text-blue-800",
    OVERDUE: "border-red-200 bg-red-100 text-red-800",
    DELETED: "border-slate-200 bg-slate-100 text-slate-800",
    DRAFT: "border-slate-200 bg-slate-100 text-slate-800",
  })[s] || "border-slate-200 bg-slate-100 text-slate-800";

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("de-DE");
};

// --- Computed Products for Autocomplete ---
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
  if (focusedRowIndex.value === null || !isEditing.value) return [];
  const itemDesc = form.value.items[focusedRowIndex.value]?.description;
  const currentInput = itemDesc ? String(itemDesc).toLowerCase() : "";
  if (!currentInput) return allProducts.value;
  return allProducts.value
    .filter((p) => String(p.label).toLowerCase().includes(currentInput))
    .slice(0, 8);
});

// --- Computed Totals (Live Berechnung) ---
const totals = computed(() => {
  const net = form.value.items.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.amount) || 0);
  }, 0);
  const tax = form.value.items.reduce((sum, item) => {
    const rate = typeof item.vat_rate === "number" ? Number(item.vat_rate) : 0.19;
    return sum + (Number(item.quantity) || 0) * (Number(item.amount) || 0) * rate;
  }, 0);
  return {
    net,
    tax,
    gross: net + tax,
  };
});

// --- Data Loading ---
const loadInvoice = async () => {
  loading.value = true;
  try {
    // Load resources, services, and pricing for autocomplete
    const [r, s, p] = await Promise.all([
      api.resources.getAll(),
      api.services.getAll(),
      api.pricing.getAll(),
    ]);
    resources.value = (r as any[]) || [];
    services.value = (s as any[]) || [];
    allPricing.value = (p as any[]) || [];

    const data = await api.sales.getOne(invoiceId);
    if (data) {
      invoice.value = data;

      // Init Form Data
      form.value.status = data.status;
      form.value.notes = data.notes || "";
      form.value.invoice_date = data.invoice_date
        ? new Date(data.invoice_date).toISOString().split("T")[0]
        : data.createdAt
          ? new Date(data.createdAt).toISOString().split("T")[0]
          : "";
      form.value.due_date = data.due_date
        ? new Date(data.due_date).toISOString().split("T")[0]
        : "";

      form.value.user_id = data.user_id;
      form.value.user_preview = data.User;

      // Map Items for Editing
      if (data.InvoiceLineItems && Array.isArray(data.InvoiceLineItems)) {
        form.value.items = data.InvoiceLineItems.map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity),
          amount: Number(i.amount),
          unit: i.unit || "pauschal",
          vat_rate: typeof i.vat_rate === "number" ? Number(i.vat_rate) : 0.19,
        }));
      } else {
        form.value.items = [];
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// --- Actions ---

const toggleEditMode = () => {
  if (isEditing.value) {
    // Cancel pressed -> Reload original data to reset form
    loadInvoice();
  }
  isEditing.value = !isEditing.value;
};

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
      const users: any[] = await api.users.getAll();
      const q = userSearchQuery.value.toLowerCase();
      userSearchResults.value = users
        .filter(
          (u: any) =>
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q),
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

// Autocomplete functions
const focusRow = (index: number) => {
  focusedRowIndex.value = index;
};
const blurRow = (index: number) => {
  setTimeout(() => {
    if (focusedRowIndex.value === index) focusedRowIndex.value = null;
  }, 200);
};

const applySuggestion = (index: number, suggestion: any) => {
  const item = form.value.items[index];
  if (item) {
    item.description = suggestion.label;
    item.amount = suggestion.price;
    if (suggestion.unit) item.unit = translateUnit(suggestion.unit);
  }
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

const addItem = () => {
  form.value.items.push({
    description: "",
    quantity: 1,
    unit: "Stück",
    amount: 0,
    vat_rate: 0.19,
  });
};

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

const saveInvoice = async () => {
  saving.value = true;
  try {
    if (!form.value.items.length) {
      alert("Bitte mindestens eine Position anlegen.");
      saving.value = false;
      return;
    }
    const res: any = await api.sales.update(Number(invoiceId), {
      status: form.value.status,
      notes: form.value.notes,
      invoice_date: form.value.invoice_date,
      due_date: form.value.due_date,
      user_id: form.value.user_id,
      items: form.value.items,
    });

    if (res) {
      invoice.value = res; // Update view with server response
      // Wichtig: Auch Form Items updaten, falls Server Daten formatiert hat
      if (res.InvoiceLineItems) {
        form.value.items = res.InvoiceLineItems.map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity),
          amount: Number(i.amount),
          unit: i.unit || "pauschal",
          vat_rate: typeof i.vat_rate === "number" ? Number(i.vat_rate) : 0.19,
        }));
      }
      isEditing.value = false;
    }
  } catch (e: any) {
    console.error(e);
    alert("Fehler beim Speichern: " + e.message);
  } finally {
    saving.value = false;
  }
};

const handleDownload = async () => {
  try {
    const blob = await api.sales.downloadInvoice(invoice.value.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rechnung_${invoice.value.invoice_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Fehler beim Herunterladen der Rechnung.");
  }
};

const handleDelete = async () => {
  if (!confirm("Sind Sie sicher, dass Sie diese Rechnung löschen möchten?"))
    return;
  try {
    await api.sales.delete(Number(invoiceId));
    router.push("/booking-system/invoices");
  } catch (e) {
    console.error(e);
    alert("Fehler beim Löschen.");
  }
};

const sendInvoiceEmail = async () => {
  if (
    !confirm(
      `Rechnung jetzt per E-Mail an ${invoice.value.User?.email || "den Kunden"} senden?`,
    )
  ) {
    return;
  }
  try {
    await api.sales.sendEmail(Number(invoiceId));
    alert("E-Mail wurde erfolgreich versendet.");
    // Reload to refresh status
    loadInvoice();
  } catch (e: any) {
    console.error(e);
    alert("Fehler beim Senden der E-Mail: " + (e.message || ""));
  }
};

onMounted(() => {
  loadInvoice();
});
</script>
