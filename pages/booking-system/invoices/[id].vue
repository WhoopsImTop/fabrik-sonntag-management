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

  <div v-else-if="!invoice" class="text-center py-12">
    <h2 class="text-xl font-semibold text-neutral-900">
      Rechnung nicht gefunden
    </h2>
    <button @click="router.back()" class="mt-4 text-blue-600 hover:underline">
      Zurück
    </button>
  </div>

  <div v-else class="max-w-5xl mx-auto space-y-6 pb-24">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <button
          @click="router.back()"
          class="p-2 hover:bg-neutral-100 rounded-full text-neutral-500"
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
            {{ invoice.invoice_number }}
            <span
              :class="[
                'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                getStatusClass(form.status),
              ]"
            >
              {{ getStatusLabel(form.status) }}
            </span>
          </h1>
        </div>
      </div>

      <div class="flex gap-2">
        <button
          @click="toggleEditMode"
          class="px-4 py-2 text-sm font-medium border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50 text-neutral-700 transition-colors"
        >
          {{ isEditing ? "Abbrechen" : "Bearbeiten" }}
        </button>

        <button
          v-if="isEditing"
          @click="saveInvoice"
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
          Speichern
        </button>

        <div v-else class="flex gap-2">
          <button
            @click="handleDownload"
            class="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50"
            title="PDF Laden"
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </button>
          <button
            @click="sendInvoiceEmail"
            class="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50"
            title="Email senden"
          >
            Email senden
          </button>
          <button
            @click="handleDelete"
            class="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div
          class="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div
            class="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30"
          >
            <h3 class="font-semibold text-neutral-900">Positionen</h3>
            <button
              v-if="isEditing"
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
                <th class="px-6 py-3 w-[45%]">Beschreibung</th>
                <th class="px-4 py-3 text-right w-[15%]">Menge</th>
                <th class="px-4 py-3 text-right w-[20%]">Preis (€)</th>
                <th class="px-6 py-3 text-right w-[15%]">Gesamt</th>
                <th v-if="isEditing" class="w-[5%]"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr
                v-for="(item, index) in form.items"
                :key="index"
                class="group hover:bg-neutral-50/50"
              >
                <td class="px-6 py-3">
                  <input
                    v-if="isEditing"
                    type="text"
                    v-model="item.description"
                    class="w-full bg-transparent border-0 border-b border-transparent focus:border-neutral-400 focus:ring-0 p-0 text-sm placeholder-neutral-300"
                    placeholder="Beschreibung..."
                  />
                  <span v-else class="font-medium text-neutral-900">{{
                    item.description
                  }}</span>
                </td>

                <td class="px-4 py-3 text-right">
                  <input
                    v-if="isEditing"
                    type="number"
                    min="0"
                    step="0.1"
                    v-model.number="item.quantity"
                    class="w-full text-right bg-transparent border-0 border-b border-transparent focus:border-neutral-400 focus:ring-0 p-0 text-sm"
                  />
                  <span v-else class="text-neutral-600">{{
                    item.quantity
                  }}</span>
                </td>

                <td class="px-4 py-3 text-right">
                  <input
                    v-if="isEditing"
                    type="number"
                    step="0.01"
                    v-model.number="item.amount"
                    class="w-full text-right bg-transparent border-0 border-b border-transparent focus:border-neutral-400 focus:ring-0 p-0 text-sm"
                  />
                  <span v-else>€{{ formatMoney(item.amount) }}</span>
                </td>

                <td class="px-6 py-3 text-right font-medium text-neutral-900">
                  €{{ formatMoney((item.quantity || 0) * (item.amount || 0)) }}
                </td>

                <td v-if="isEditing" class="px-2 text-center">
                  <button
                    @click="removeItem(index)"
                    class="text-neutral-300 hover:text-red-500 transition-colors p-1"
                    title="Zeile löschen"
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

              <tr v-if="isEditing && form.items.length === 0">
                <td
                  colspan="5"
                  class="px-6 py-8 text-center text-neutral-400 border-dashed border-2 border-neutral-100 m-4 rounded-lg"
                >
                  <p class="text-sm">Keine Positionen vorhanden.</p>
                  <button
                    @click="addItem"
                    class="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    Erste Zeile hinzufügen
                  </button>
                </td>
              </tr>
            </tbody>

            <tfoot class="bg-neutral-50 border-t border-neutral-200">
              <tr>
                <td colspan="3" class="px-6 py-3 text-right text-neutral-600">
                  Netto
                </td>
                <td class="px-6 py-3 text-right text-neutral-900">
                  €{{ formatMoney(totals.net) }}
                </td>
                <td v-if="isEditing"></td>
              </tr>
              <tr>
                <td colspan="3" class="px-6 py-1 text-right text-neutral-600">
                  USt (19%)
                </td>
                <td class="px-6 py-1 text-right text-neutral-900">
                  €{{ formatMoney(totals.tax) }}
                </td>
                <td v-if="isEditing"></td>
              </tr>
              <tr>
                <td
                  colspan="3"
                  class="px-6 py-4 text-right font-bold text-lg text-neutral-900"
                >
                  Gesamtbetrag
                </td>
                <td
                  class="px-6 py-4 text-right font-bold text-lg text-neutral-900"
                >
                  €{{ formatMoney(totals.gross) }}
                </td>
                <td v-if="isEditing"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div
          class="bg-white border border-neutral-200 rounded-xl shadow-sm p-6"
        >
          <label class="block text-sm font-medium text-neutral-700 mb-2"
            >Anmerkungen</label
          >
          <textarea
            v-if="isEditing"
            v-model="form.notes"
            rows="4"
            class="w-full border-gray-300 rounded-lg shadow-sm focus:border-neutral-900 focus:ring-neutral-900 text-sm"
          ></textarea>
          <p v-else class="text-neutral-600 text-sm whitespace-pre-wrap">
            {{ invoice.notes || "Keine Anmerkungen." }}
          </p>
        </div>
      </div>

      <div class="space-y-6">
        <div
          class="bg-white border border-neutral-200 rounded-xl shadow-sm p-6"
        >
          <h3 class="font-semibold text-neutral-900 mb-4">Einstellungen</h3>

          <div class="space-y-4">
            <div>
              <label
                class="block text-xs font-medium text-neutral-500 uppercase"
                >Status</label
              >
              <select
                v-if="isEditing"
                v-model="form.status"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-neutral-900 focus:border-neutral-900 sm:text-sm rounded-md"
              >
                <option value="DELETED">Storniert</option>
                <option value="DRAFT">Entwurf</option>
                <option value="SENT">Versendet</option>
                <option value="PAID">Bezahlt</option>
                <option value="OVERDUE">Überfällig</option>
              </select>
              <div v-else class="mt-1">
                <span
                  :class="[
                    'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                    getStatusClass(invoice.status),
                  ]"
                >
                  {{ getStatusLabel(invoice.status) }}
                </span>
              </div>
            </div>

            <div>
              <label
                class="block text-xs font-medium text-neutral-500 uppercase"
                >Fälligkeit</label
              >
              <input
                v-if="isEditing"
                type="date"
                v-model="form.due_date"
                class="mt-1 block w-full text-sm border-gray-300 rounded-md focus:ring-neutral-900 focus:border-neutral-900"
              />
              <p v-else class="mt-1 text-sm text-neutral-900">
                {{ formatDate(invoice.due_date) }}
              </p>
            </div>

            <div class="pt-4 border-t border-neutral-100">
              <label
                class="block text-xs font-medium text-neutral-500 uppercase"
                >Kunde</label
              >
              
              <div v-if="isEditing" class="mt-2 space-y-2">
                <div v-if="form.user_id" class="flex items-center justify-between p-2 border border-neutral-200 rounded-md bg-neutral-50">
                   <div class="flex items-center gap-2 overflow-hidden">
                      <div class="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold">
                         User
                      </div>
                      <div class="truncate text-sm">
                         <span class="font-medium text-neutral-900">{{ form.user_preview?.username || 'User ID: ' + form.user_id }}</span>
                         <span class="text-xs text-neutral-500 ml-1">({{ form.user_preview?.email || '...' }})</span>
                      </div>
                   </div>
                   <button @click="removeUser" class="text-red-500 hover:text-red-700 p-1">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                   </button>
                </div>

                <div v-else class="relative">
                  <input 
                    type="text" 
                    v-model="userSearchQuery"
                    @input="handleUserSearch"
                    placeholder="Name oder E-Mail suchen..."
                    class="block w-full text-sm border-gray-300 rounded-md focus:ring-neutral-900 focus:border-neutral-900"
                  />
                  <div v-if="userSearchResults.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                     <div 
                        v-for="user in userSearchResults" 
                        :key="user.id"
                        @click="selectUser(user)"
                        class="px-3 py-2 hover:bg-neutral-50 cursor-pointer flex flex-col border-b border-neutral-50 last:border-0"
                     >
                        <span class="text-sm font-medium text-neutral-900">{{ user.username }}</span>
                        <span class="text-xs text-neutral-500">{{ user.email }}</span>
                     </div>
                  </div>
                  <div v-if="isSearchingUsers" class="absolute right-3 top-2.5">
                     <svg class="animate-spin w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  </div>
                </div>
                <p class="text-xs text-neutral-400">Lassen Sie das Feld leer für "Gast / Manuell".</p>
              </div>

              <div v-else>
                 <div v-if="invoice.User" class="mt-2 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                       {{ invoice.User.username?.substring(0, 2).toUpperCase() }}
                    </div>
                    <div class="overflow-hidden">
                       <p class="text-sm font-medium text-neutral-900 truncate">
                          {{ invoice.User.username }}
                       </p>
                       <p class="text-xs text-neutral-500 truncate">
                          {{ invoice.User.email }}
                       </p>
                    </div>
                 </div>
                 <p v-else class="mt-1 text-sm text-neutral-500 italic">
                    Gast / Manuell
                 </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const router = useRouter();
const api = useBookingApi();

const loading = ref(true);
const saving = ref(false);
const isEditing = ref(false);
const invoice = ref<any>(null);

// Form State (Reactive)
const form = ref({
  status: "DRAFT",
  notes: "",
  due_date: "",
  user_id: null as number | null,
  user_preview: null as any, 
  items: [] as Array<{ description: string; quantity: number; amount: number }>,
});

const invoiceId = route.params.id as string;

// Search State
const userSearchQuery = ref("");
const userSearchResults = ref<any[]>([]);
const isSearchingUsers = ref(false);
let searchTimeout: any = null;

// --- Computed Totals (Live Berechnung) ---
const totals = computed(() => {
  const net = form.value.items.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.amount || 0);
  }, 0);
  const tax = net * 0.19; // 19%
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
    const data = await api.sales.getOne(invoiceId);
    if (data) {
      invoice.value = data;

      // Init Form Data
      form.value.status = data.status;
      form.value.notes = data.notes || "";
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
            const users = await api.users.getAll(); 
            const q = userSearchQuery.value.toLowerCase();
            userSearchResults.value = users.filter((u: any) => 
                u.username?.toLowerCase().includes(q) || 
                u.email?.toLowerCase().includes(q)
            ).slice(0, 5); 
        } catch(e) {
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

const addItem = () => {
  form.value.items.push({
    description: "",
    quantity: 1,
    amount: 0,
  });
};

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

const saveInvoice = async () => {
  saving.value = true;
  try {
    const res = await api.sales.update(Number(invoiceId), {
      status: form.value.status,
      notes: form.value.notes,
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
        }));
      }
      form.value.user_preview = res.User;
      isEditing.value = false;
    }
  } finally {
    saving.value = false;
  }
};

const sendInvoiceEmail = async () => {
  saving.value = true;
  const res = await api.sales.sendEmail(invoiceId);
  if (res) {
    saving.value = false;
    alert("Email gesendet");
  } else {
    saving.value = false;
    alert("Fehler beim Senden");
  }
};

const handleDelete = async () => {
  if (!confirm("Rechnung wirklich löschen?")) return;
  await api.sales.delete(Number(invoiceId));
  router.push("/booking-system/invoices");
};

const handleDownload = async () => {
  try {
    const blob = await api.sales.downloadInvoice(invoiceId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Rechnung-${invoice.value.invoice_number}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e) {
    console.error(e);
  }
};

// --- Helpers ---
const formatMoney = (val: number) => Number(val || 0).toFixed(2);
const formatDate = (date: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("de-DE");
};
const getStatusClass = (status: string) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-700 border-green-200";
    case "SENT":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "OVERDUE":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    PAID: "Bezahlt",
    SENT: "Versendet",
    DRAFT: "Entwurf",
    OVERDUE: "Überfällig",
    DELETED: "Storniert"
  };
  return map[status] || status;
};

onMounted(() => {
  loadInvoice();
});
</script>