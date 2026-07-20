<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
          Benutzerverwaltung
        </h1>
        <p class="text-slate-500 mt-1.5">
          Verwalten Sie alle Benutzer und deren Status.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-none bg-brand-accent px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-colors hover:brightness-95"
        @click="showAddModal = true"
      >
        <UiIcon name="i-lucide-plus" class="size-4" />
        Benutzer hinzufügen
      </button>
    </div>

    <div class="flex flex-col gap-3 md:flex-row md:items-center">
      <div class="relative flex-1">
        <UiIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Suchen nach Name oder E-Mail…"
          class="w-full rounded-none border border-neutral-200 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>
      <select
        v-model="statusFilter"
        class="rounded-none border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
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

    <div class="overflow-x-auto">
      <div v-if="loading" class="py-12 text-center text-neutral-500">Lädt…</div>
      <div v-else-if="filteredUsers.length === 0" class="py-12 text-center text-neutral-500">
        Keine Benutzer gefunden
      </div>
      <table v-else class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Benutzer</th>
            <th class="pb-3 pr-4 font-medium">Email</th>
            <th class="pb-3 pr-4 font-medium">Rolle</th>
            <th class="pb-3 pr-4 font-medium">Status</th>
            <th class="pb-3 font-medium text-right">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
            @click="viewUser(user)"
          >
            <td class="py-4 pr-4">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white"
                >
                  {{
                    getInitials(
                      user.details?.first_name || user.username,
                      user.details?.last_name,
                    )
                  }}
                </div>
                <div>
                  <div class="font-medium text-neutral-900">
                    {{
                      user.details?.first_name && user.details?.last_name
                        ? `${user.details.first_name} ${user.details.last_name}`
                        : user.username
                    }}
                  </div>
                  <div class="text-xs text-neutral-500">
                    <span
                      v-if="user.details?.user_type === 'COMPANY'"
                      class="mr-1 text-brand-accent"
                      >Firma</span
                    >
                    {{
                      user?.details?.company ||
                      `${user?.details?.first_name ?? ""} ${user?.details?.last_name ?? ""}`.trim() ||
                      "-"
                    }}
                  </div>
                </div>
              </div>
            </td>
            <td class="py-4 pr-4">
              <a
                :href="`mailto:${user.email}`"
                class="text-brand-accent hover:underline"
                @click.stop
              >
                {{ user.email }}
              </a>
            </td>
            <td class="py-4 pr-4 text-neutral-700">
              {{ getRoleLabel(user.role) }}
            </td>
            <td class="py-4 pr-4">
              <span
                :class="
                  user.isActive ? 'text-emerald-600' : 'text-red-600'
                "
              >
                {{ user.isActive ? "Aktiv" : "Inaktiv" }}
              </span>
            </td>
            <td class="py-4 text-right">
              <button
                type="button"
                class="font-medium text-brand-accent hover:underline"
                @click.stop="viewUser(user)"
              >
                Details
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showAddModal" class="dialog-overlay" role="dialog" aria-modal="true">
      <div class="absolute inset-0" @click="showAddModal = false"></div>

      <div class="dialog-panel max-w-lg">
        <div class="dialog-header">
          <div class="min-w-0 flex-1">
            <h2 class="dialog-title">Neuen Benutzer anlegen</h2>
            <p class="dialog-desc">
              Erstellen Sie einen neuen Kunden- oder Admin-Account.
            </p>
          </div>
          <button type="button" class="dialog-close" aria-label="Schließen" @click="showAddModal = false">
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <form @submit.prevent="createUser">
          <div class="dialog-body space-y-4">
            <div>
              <label class="dialog-label">Kontotyp</label>
              <div class="flex rounded-none border border-neutral-200 overflow-hidden">
                <button type="button" @click="newUser.details.user_type = 'PERSON'"
                  :class="['flex-1 px-4 py-2 text-sm font-medium transition-colors', newUser.details.user_type === 'PERSON' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50']">Person</button>
                <button type="button" @click="newUser.details.user_type = 'COMPANY'"
                  :class="['flex-1 px-4 py-2 text-sm font-medium transition-colors', newUser.details.user_type === 'COMPANY' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50']">Firma</button>
              </div>
            </div>

            <div v-if="newUser.details.user_type === 'COMPANY'">
              <label class="dialog-label">Firmenname</label>
              <input v-model="newUser.details.company" type="text" required
                class="dialog-input"
                placeholder="Muster GmbH" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="dialog-label">Vorname</label>
                <input v-model="newUser.details.first_name" type="text" :required="newUser.details.user_type === 'PERSON'"
                  class="dialog-input" />
              </div>
              <div>
                <label class="dialog-label">Nachname</label>
                <input v-model="newUser.details.last_name" type="text" :required="newUser.details.user_type === 'PERSON'"
                  class="dialog-input" />
              </div>
            </div>
            <div>
              <label class="dialog-label">Username</label>
              <input v-model="newUser.username" type="text" required
                class="dialog-input" />
            </div>
            <div>
              <label class="dialog-label">E-Mail</label>
              <input v-model="newUser.email" type="email" required
                class="dialog-input" />
            </div>
            <div>
              <label class="dialog-label">Rolle</label>
              <select v-model="newUser.role" class="dialog-input">
                <option value="user">User (Kunde)</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn-dialog-cancel" @click="showAddModal = false">
              Abbrechen
            </button>
            <button type="submit" class="btn-dialog-primary" :disabled="createLoading">
              <svg v-if="createLoading" class="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
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
    user_type: "PERSON" as "PERSON" | "COMPANY",
    company: "",
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

  filtered.sort((a, b) => {
    const firstNameA = a.details?.first_name || '';
    const firstNameB = b.details?.first_name || '';
    const lastNameA = a.details?.last_name || '';
    const lastNameB = b.details?.last_name || '';
    const companyA = a.details?.company || '';
    const companyB = b.details?.company || '';

    return (
      firstNameA.localeCompare(firstNameB) ||
      lastNameA.localeCompare(lastNameB) ||
      companyA.localeCompare(companyB)
    );
  });

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
    const payload = {
      username: newUser.value.username,
      email: newUser.value.email,
      password: newUser.value.password,
      role: newUser.value.role,
      first_name: newUser.value.details.first_name,
      last_name: newUser.value.details.last_name,
      details: newUser.value.details
    };

    const success = await api.users.create(payload);

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
          user_type: "PERSON",
          company: "",
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
