<template>
  <div class="min-h-screen bg-slate-50/50 pb-12 font-sans">
    <div class="bg-white border-b border-slate-200 px-6 py-4 mb-8">
      <div class="max-w-7xl mx-auto flex items-center gap-4">
        <button
          @click="$router.push('/booking-system/users')"
          class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:opacity-50 ring-offset-white hover:bg-slate-100 hover:text-slate-900 h-9 px-3 py-2 border border-slate-200 bg-transparent text-slate-500"
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
            class="mr-2 h-4 w-4"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Zurück
        </button>
        <h1 class="text-xl font-semibold text-slate-900 tracking-tight">
          Nutzerprofil
        </h1>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <svg
        class="animate-spin w-10 h-10 text-slate-400"
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

    <div v-else-if="user" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-1 space-y-6">
          <UserProfileCard :user="user" @update="handleUpdateUser" />

          <div class="grid grid-cols-2 gap-4">
            <div
              class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
            >
              <p class="text-sm text-slate-500 font-medium">Gesamtumsatz</p>
              <p class="text-2xl font-bold text-slate-900 mt-2">
                {{ totalRevenue }} €
              </p>
            </div>
            <div
              class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
            >
              <p class="text-sm text-slate-500 font-medium">Buchungen</p>
              <p class="text-2xl font-bold text-slate-900 mt-2">
                {{ user.Bookings?.length || 0 }}
              </p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-6">
          <div
            class="inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 w-full"
          >
            <button
              v-for="tab in ['bookings', 'invoices', 'memberships']"
              :key="tab"
              @click="activeTab = tab"
              :class="[
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1',
                activeTab === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'hover:text-slate-900',
              ]"
            >
              {{
                tab === "memberships"
                  ? "Mitgliedschaften"
                  : tab === "bookings"
                  ? "Buchungen"
                  : "Rechnungen"
              }}
            </button>
          </div>

          <div
            class="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[400px] overflow-hidden"
          >
            <div v-if="activeTab === 'bookings'" class="p-0">
              <UserBookingsHistory :bookings="user.Bookings" />
            </div>

            <div v-if="activeTab === 'invoices'" class="p-0">
              <UserInvoicesList
                :invoices="user.Invoices"
                @download="downloadInvoice"
              />
            </div>

            <div v-if="activeTab === 'memberships'" class="p-6">
              <div class="flex justify-between items-center mb-6">
                <div>
                  <h3
                    class="text-lg font-semibold text-slate-900 tracking-tight"
                  >
                    Aktive Mitgliedschaften
                  </h3>
                  <p class="text-sm text-slate-500">
                    Übersicht der laufenden Verträge.
                  </p>
                </div>
                <button
                  @click="showMembershipModal = true"
                  class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-colors"
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
                    class="mr-2 h-4 w-4"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  Zuweisen
                </button>
              </div>

              <div
                v-if="
                  !user.UserMemberships || user.UserMemberships.length === 0
                "
                class="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50"
              >
                <svg
                  class="h-10 w-10 text-slate-400 mb-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p class="text-sm text-slate-500 font-medium">
                  Keine Mitgliedschaften vorhanden.
                </p>
                <p class="text-xs text-slate-400">
                  Weisen Sie oben eine neue zu.
                </p>
              </div>

              <ul
                v-else
                class="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden"
              >
                <li
                  v-for="ms in user.UserMemberships"
                  :key="ms.id"
                  class="p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors group"
                >
                  <div>
                    <p class="font-semibold text-slate-900">
                      {{ ms.MembershipType?.name }}
                    </p>
                    <div
                      class="flex items-center text-xs text-slate-500 mt-1 space-x-2"
                    >
                      <span
                        >Ab:
                        {{
                          new Date(ms.valid_from).toLocaleDateString("de-DE")
                        }}</span
                      >
                      <span>•</span>
                      <span v-if="ms.valid_until"
                        >Bis:
                        {{
                          new Date(ms.valid_until).toLocaleDateString("de-DE")
                        }}</span
                      >
                      <span v-else>Unbegrenzt gültig</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-4">
                    <span
                      class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"
                    >
                      Aktiv
                    </span>

                    <button
                      @click="removeMembership(ms.id)"
                      class="text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50"
                      title="Mitgliedschaft entfernen"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" x2="10" y1="11" y2="17" />
                        <line x1="14" x2="14" y1="11" y2="17" />
                      </svg>
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showMembershipModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
    >
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        @click="showMembershipModal = false"
      ></div>
      <div
        class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-slate-200"
      >
        <button
          @click="showMembershipModal = false"
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
          <h3
            class="text-lg font-semibold text-slate-900 leading-none tracking-tight mb-1"
          >
            Mitgliedschaft zuweisen
          </h3>
          <p class="text-sm text-slate-500 mb-6">
            Wählen Sie einen Typ und den Gültigkeitszeitraum.
          </p>

          <form @submit.prevent="assignMembership" class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700"
                >Typ</label
              >
              <select
                v-model="newMembership.type_id"
                required
                class="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                <option :value="null" disabled>Bitte wählen...</option>
                <option
                  v-for="type in membershipTypes"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.name }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700"
                >Gültig ab</label
              >
              <input
                type="date"
                v-model="newMembership.valid_from"
                required
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700"
                >Gültig bis (Optional)</label
              >
              <input
                type="date"
                v-model="newMembership.valid_until"
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                placeholder="Leer lassen für unbegrenzt"
              />
              <p class="text-[0.8rem] text-slate-500">
                Leer lassen für unbegrenzte Gültigkeit.
              </p>
            </div>

            <div
              class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 pt-4 border-t border-slate-100"
            >
              <button
                type="button"
                @click="showMembershipModal = false"
                class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 sm:mt-0"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                :disabled="!newMembership.type_id"
                class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none mb-2 sm:mb-0"
              >
                Zuweisen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import UserProfileCard from "@/components/users/UserProfileCard.vue";
import UserBookingsHistory from "@/components/users/UserBookingsHistory.vue";
import UserInvoicesList from "@/components/users/UserInvoicesList.vue";

const api = useBookingApi();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const user = ref<any>(null);
const activeTab = ref("bookings");
const showMembershipModal = ref(false);
const membershipTypes = ref<any[]>([]);

const newMembership = ref({
  type_id: null,
  valid_from: new Date().toISOString().split("T")[0],
  valid_until: "",
});

const totalRevenue = computed(() => {
  if (!user.value?.Invoices) return "0.00";
  const sum = user.value.Invoices.reduce(
    (acc: number, inv: any) =>
      acc + (inv.status === "PAID" ? parseFloat(inv.total_amount || 0) : 0),
    0
  );
  return sum.toFixed(2);
});

const loadUser = async () => {
  loading.value = true;
  try {
    const userId = route.params.id;
    const data = await api.users.getOne(userId);
    if (data) user.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadMembershipTypes = async () => {
  try {
    const types = await api.memberships.getTypes();
    if (types) {
      membershipTypes.value = types;
    }
  } catch (e) {
    console.error("Fehler beim Laden der M-Typen", e);
  }
};

const assignMembership = async () => {
  try {
    const result = await api.memberships.assign({
      user_id: user.value.id,
      membership_type_id: newMembership.value.type_id,
      valid_from: newMembership.value.valid_from,
      valid_until: newMembership.value.valid_until || null,
    });

    if (result) {
      showMembershipModal.value = false;
      newMembership.value = {
        type_id: null,
        valid_from: new Date().toISOString().split("T")[0],
        valid_until: "",
      };
      await loadUser();
    }
  } catch (e: any) {
    console.error(e);
  }
};

const removeMembership = async (membershipId: number) => {
  if (!confirm("Möchten Sie diese Mitgliedschaft wirklich entfernen?")) return;

  try {
    const success = await api.memberships.removeAssignment(membershipId);
    if (success) {
      await loadUser(); // Liste aktualisieren
    }
  } catch (e) {
    console.error(e);
  }
};

const handleUpdateUser = async (updatedData: any) => {
  try {
    await api.users.update(updatedData.id, updatedData);
    await loadUser();
  } catch (e) {
    // Error handled by composable
  }
};

const downloadInvoice = async (invoiceId: number) => {
  try {
    const blob = await api.sales.downloadInvoice(invoiceId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rechnung_${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    // Error handled by composable
  }
};

onMounted(() => {
  loadUser();
  loadMembershipTypes();
});
</script>
