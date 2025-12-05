<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">
          {{ user?.id ? 'Nutzer bearbeiten' : 'Neuer Nutzer' }}
        </h3>
        <button
          type="button"
          @click="$emit('close')"
          class="p-2 rounded-md hover:bg-neutral-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="saveUser" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Benutzername *</label>
            <input
              v-model="form.username"
              type="text"
              required
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">E-Mail *</label>
            <input
              v-model="form.email"
              type="email"
              required
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
        </div>

        <div v-if="!user?.id">
          <label class="block text-sm font-medium mb-1">Passwort *</label>
          <input
            v-model="form.password"
            type="password"
            :required="!user?.id"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Vorname</label>
            <input
              v-model="form.firstName"
              type="text"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nachname</label>
            <input
              v-model="form.lastName"
              type="text"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Telefon</label>
          <input
            v-model="form.phone"
            type="tel"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Straße</label>
          <input
            v-model="form.street"
            type="text"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          />
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">PLZ</label>
            <input
              v-model="form.zip"
              type="text"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Stadt</label>
            <input
              v-model="form.city"
              type="text"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Land</label>
            <input
              v-model="form.country"
              type="text"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Rolle</label>
            <select
              v-model="form.role"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            >
              <option value="user">Nutzer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="flex items-end">
            <label class="flex items-center gap-2 text-sm font-medium">
              <input
                v-model="form.isGuest"
                type="checkbox"
                class="border rounded border-black/10 shadow-sm"
              />
              Gast-Nutzer
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="bg-neutral-100 hover:bg-neutral-200 font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
          >
            {{ user?.id ? 'Speichern' : 'Erstellen' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  user: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'saved']);

const form = ref({
  username: props.user?.username || '',
  email: props.user?.email || '',
  password: '',
  firstName: props.user?.firstName || '',
  lastName: props.user?.lastName || '',
  phone: props.user?.phone || '',
  street: props.user?.street || '',
  city: props.user?.city || '',
  zip: props.user?.zip || '',
  country: props.user?.country || '',
  role: props.user?.role || 'user',
  isGuest: props.user?.isGuest || false
});

const saveUser = async () => {
  try {
    const url = props.user?.id
      ? `${import.meta.env.VITE_INTERNAL_API_URL}/users/${props.user.id}`
      : `${import.meta.env.VITE_INTERNAL_API_URL}/users`;

    const method = props.user?.id ? 'PATCH' : 'POST';

    // Don't send password if editing and field is empty
    const payload = { ...form.value };
    if (props.user?.id && !payload.password) {
      delete payload.password;
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('jwt')}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save user');
    }

    emit('saved');
  } catch (error) {
    console.error('Failed to save user:', error);
    alert(error.message || 'Fehler beim Speichern des Nutzers');
  }
};
</script>

<style scoped></style>
