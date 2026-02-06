<template>
  <div class="space-y-6">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight"
        >
          Benutzerverwaltung
        </h1>
        <p class="text-slate-500 mt-1.5">
          Verwalten Sie alle Benutzer und deren Status.
        </p>
      </div>
      <button
        @click="showAddModal = true"
        class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-colors"
      >
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
        Benutzer hinzufügen
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <div class="relative flex-1">
          <svg
            class="absolute left-3 top-2.5 h-5 w-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Suchen nach Name oder E-Mail..."
            class="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          />
        </div>
        <select
          v-model="statusFilter"
          class="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <option
            v-for="option in statusOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <div
      class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div v-if="loading" class="flex justify-center py-12">
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

      <div v-else-if="filteredUsers.length === 0" class="text-center py-12">
        <p class="text-slate-500">Keine Benutzer gefunden</p>
      </div>

      <table v-else class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50/50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Benutzer
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Email
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Rolle
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="hover:bg-slate-50/50 transition-colors cursor-pointer group"
            @click="viewUser(user)"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div
                  class="flex-shrink-0 h-10 w-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm"
                >
                  {{
                    getInitials(
                      user.details?.first_name || user.username,
                      user.details?.last_name,
                    )
                  }}
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-slate-900">
                    {{
                      user.details?.first_name && user.details?.last_name
                        ? `${user.details.first_name} ${user.details.last_name}`
                        : user.username
                    }}
                  </div>
                  <div class="text-xs text-slate-500">
                    @
                    {{
                      user?.details?.company ||
                      `${user?.details?.first_name ?? ""} ${user?.details?.last_name ?? ""}`.trim() ||
                      "-"
                    }}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-slate-600">{{ user.email }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 capitalize"
              >
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                  user.isActive
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                    : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
                ]"
              >
                <svg
                  v-if="user.isActive"
                  class="h-1.5 w-1.5 fill-emerald-500 mr-1.5"
                  viewBox="0 0 6 6"
                  aria-hidden="true"
                >
                  <circle cx="3" cy="3" r="3" />
                </svg>
                <svg
                  v-else
                  class="h-1.5 w-1.5 fill-red-500 mr-1.5"
                  viewBox="0 0 6 6"
                  aria-hidden="true"
                >
                  <circle cx="3" cy="3" r="3" />
                </svg>
                {{ user.isActive ? "Aktiv" : "Inaktiv" }}
              </span>
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <button
                @click.stop="viewUser(user)"
                class="text-slate-900 hover:text-slate-700 font-medium hover:underline transition-all"
              >
                Details
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showAddModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
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
            Erstellen Sie einen neuen Kunden- oder Admin-Account.
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
                  required
                  class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700"
                >Username</label
              >
              <input
                v-model="newUser.username"
                type="text"
                required
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700"
                >E-Mail</label
              >
              <input
                v-model="newUser.email"
                type="email"
                required
                class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-slate-700"
                >Rolle</label
              >
              <select
                v-model="newUser.role"
                class="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                <option value="user">User (Kunde)</option>
                <option value="admin">Admin</option>
              </select>
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const api = useBookingApi();
const router = useRouter();

const loading = ref(true);
const users = ref<any[]>([]);
const searchQuery = ref("");
const statusFilter = ref("all");

// Modal State
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
  },
});

const statusOptions = [
  { label: "Alle Status", value: "all" },
  { label: "Aktiv", value: "active" },
  { label: "Inaktiv", value: "inactive" },
];

const filteredUsers = computed(() => {
  let filtered = users.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (user) =>
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.details?.first_name?.toLowerCase().includes(query) ||
        user.details?.last_name?.toLowerCase().includes(query) ||
        user.details?.company?.toLowerCase().includes(query),
    );
  }

  if (statusFilter.value !== "all") {
    filtered = filtered.filter((user) =>
      statusFilter.value === "active" ? user.isActive : !user.isActive,
    );
  }

  return filtered;
});

const getInitials = (firstName: string, lastName?: string) => {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
};

const getRoleLabel = (role: string) => {
  const map: Record<string, string> = {
    admin: "Admin",
    user: "User",
  };
  return map[role] || role;
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const data = await api.users.getAll();
    if (data) {
      users.value = Array.isArray(data) ? data : [];
    }
  } finally {
    loading.value = false;
  }
};

const lettersAndNumbers = "1234567890abcdefghijklmnopqrstuvwxyz!&%$?)(][";

function generatePassword(length = 10) {
  let password = "";

  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * lettersAndNumbers.length);
    password += lettersAndNumbers[index];
  }

  return password;
}

const createUser = async () => {
  createLoading.value = true;
  try {
    // Nutzung des neuen Composable-Aufrufs
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
        },
      };
      await loadUsers();
    }
  } catch (e: any) {
    // Fehlerbehandlung macht useBookingApi bereits via Toast
    console.error(e);
  } finally {
    createLoading.value = false;
  }
};

const viewUser = (user: any) => {
  router.push(`/booking-system/users/${user.id}`);
};

onMounted(() => {
  loadUsers();
});
</script>
