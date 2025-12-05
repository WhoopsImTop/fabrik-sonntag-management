<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">Nutzerverwaltung</h1>
      <button
        class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
        @click="openCreateModal"
      >
        Neuer Nutzer
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm mb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label class="block text-sm font-medium mb-1">Rolle</label>
          <select
            v-model="filters.role"
            @change="fetchUsers"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm text-sm"
          >
            <option value="">Alle</option>
            <option value="admin">Admin</option>
            <option value="user">Nutzer</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Typ</label>
          <select
            v-model="filters.isGuest"
            @change="fetchUsers"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm text-sm"
          >
            <option value="">Alle</option>
            <option value="false">Registriert</option>
            <option value="true">Gast</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <select
            v-model="filters.isActive"
            @change="fetchUsers"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm text-sm"
          >
            <option value="">Alle</option>
            <option value="true">Aktiv</option>
            <option value="false">Inaktiv</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="resetFilters"
            class="w-full bg-neutral-100 hover:bg-neutral-200 font-bold py-2 rounded-lg text-sm border border-black/10 shadow-sm"
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <table class="w-full rounded-lg overflow-hidden border border-black/10 shadow-sm bg-white">
      <thead class="bg-neutral-50">
        <tr class="text-left">
          <th class="px-3 py-1.5 text-sm">ID</th>
          <th class="px-3 py-1.5 text-sm">Benutzername</th>
          <th class="px-3 py-1.5 text-sm">E-Mail</th>
          <th class="px-3 py-1.5 text-sm">Name</th>
          <th class="px-3 py-1.5 text-sm">Rolle</th>
          <th class="px-3 py-1.5 text-sm">Typ</th>
          <th class="px-3 py-1.5 text-sm">Status</th>
          <th class="px-3 py-1.5 text-sm text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id" class="border-t border-black/10">
          <td class="px-3 py-2 text-sm">#{{ user.id }}</td>
          <td class="px-3 py-2 text-sm">{{ user.username }}</td>
          <td class="px-3 py-2 text-sm">{{ user.email }}</td>
          <td class="px-3 py-2 text-sm">
            {{ user.firstName || '' }} {{ user.lastName || '' }}
          </td>
          <td class="px-3 py-2 text-sm">
            <span
              :class="user.role === 'admin' ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'"
              class="px-2 py-1 rounded-lg text-xs border border-black/10"
            >
              {{ user.role === 'admin' ? 'Admin' : 'Nutzer' }}
            </span>
          </td>
          <td class="px-3 py-2 text-sm">
            <span
              :class="user.isGuest ? 'bg-yellow-100 text-yellow-900' : 'bg-green-100 text-green-900'"
              class="px-2 py-1 rounded-lg text-xs border border-black/10"
            >
              {{ user.isGuest ? 'Gast' : 'Registriert' }}
            </span>
          </td>
          <td class="px-3 py-2 text-sm">
            <span
              :class="user.isActive ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'"
              class="px-2 py-1 rounded-lg text-xs border border-black/10"
            >
              {{ user.isActive ? 'Aktiv' : 'Inaktiv' }}
            </span>
          </td>
          <td class="px-3 py-2 text-sm flex items-center gap-1 justify-end">
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="editUser(user)"
              title="Bearbeiten"
            >
              <UIcon name="i-lucide-edit" size="16" />
            </div>
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-red-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="toggleUserStatus(user)"
              :title="user.isActive ? 'Deaktivieren' : 'Aktivieren'"
            >
              <UIcon :name="user.isActive ? 'i-lucide-user-x' : 'i-lucide-user-check'" size="16" />
            </div>
          </td>
        </tr>
        <tr v-if="users.length === 0">
          <td colspan="8" class="px-3 py-4 text-sm text-center text-neutral-500">
            Keine Nutzer gefunden
          </td>
        </tr>
      </tbody>
    </table>

    <!-- User Form Dialog -->
    <AppDialogUserForm
      v-if="showUserModal"
      :user="selectedUser"
      @close="closeModal"
      @saved="handleUserSaved"
    />
  </div>
</template>

<script setup>
const users = ref([]);
const showUserModal = ref(false);
const selectedUser = ref(null);

const filters = ref({
  role: '',
  isGuest: '',
  isActive: ''
});

const fetchUsers = async () => {
  try {
    const params = new URLSearchParams();
    if (filters.value.role) params.append('role', filters.value.role);
    if (filters.value.isGuest) params.append('isGuest', filters.value.isGuest);
    if (filters.value.isActive) params.append('isActive', filters.value.isActive);

    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/users?${params.toString()}`
    );
    const data = await res.json();
    users.value = data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
};

const resetFilters = () => {
  filters.value = {
    role: '',
    isGuest: '',
    isActive: ''
  };
  fetchUsers();
};

const openCreateModal = () => {
  selectedUser.value = null;
  showUserModal.value = true;
};

const editUser = (user) => {
  selectedUser.value = user;
  showUserModal.value = true;
};

const toggleUserStatus = async (user) => {
  const action = user.isActive ? 'deaktivieren' : 'aktivieren';
  if (!confirm(`Nutzer "${user.username}" wirklich ${action}?`)) return;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/users/${user.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      }
    );

    if (res.ok) {
      await fetchUsers();
    } else {
      alert('Fehler beim Aktualisieren des Nutzerstatus');
    }
  } catch (error) {
    console.error('Failed to toggle user status:', error);
    alert('Fehler beim Aktualisieren des Nutzerstatus');
  }
};

const closeModal = () => {
  showUserModal.value = false;
  selectedUser.value = null;
};

const handleUserSaved = () => {
  closeModal();
  fetchUsers();
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped></style>
