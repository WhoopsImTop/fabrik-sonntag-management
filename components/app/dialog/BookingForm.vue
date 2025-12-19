<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">
          {{ booking?.id ? 'Buchung bearbeiten' : 'Neue Buchung' }}
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

      <form @submit.prevent="saveBooking" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nutzer</label>
          <select
            v-model="form.userId"
            required
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          >
            <option value="">Nutzer auswählen</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.firstName }} {{ user.lastName }} ({{ user.email }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Ressource</label>
          <select
            v-model="form.resourceId"
            required
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          >
            <option value="">Ressource auswählen</option>
            <option v-for="resource in resources" :key="resource.id" :value="resource.id">
              {{ resource.title }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Startzeit</label>
            <input
              v-model="form.startTime"
              type="datetime-local"
              required
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Endzeit</label>
            <input
              v-model="form.endTime"
              type="datetime-local"
              required
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <select
            v-model="form.status"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          >
            <option value="REQUESTED">Ausstehend</option>
            <option value="CONFIRMED">Bestätigt</option>
            <option value="CANCELLED">Storniert</option>
            <option value="COMPLETED">Abgeschlossen</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Notizen</label>
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
          ></textarea>
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
            {{ booking?.id ? 'Speichern' : 'Erstellen' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  booking: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'saved']);

const users = ref([]);
const resources = ref([]);

const form = ref({
  userId: props.booking?.userId || '',
  resourceId: props.booking?.resourceId || '',
  startTime: props.booking?.startTime ? formatDateTimeLocal(props.booking.startTime) : '',
  endTime: props.booking?.endTime ? formatDateTimeLocal(props.booking.endTime) : '',
  status: props.booking?.status || 'REQUESTED',
  notes: props.booking?.notes || ''
});

function formatDateTimeLocal(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Users endpoint might not exist in new API - we may need to remove this
const fetchUsers = async () => {
  try {
    const res = await fetch(
      import.meta.env.VITE_INTERNAL_API_URL + '/admin/users',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      }
    );
    const data = await res.json();
    users.value = data;
  } catch (error) {
    console.error('Failed to fetch users - endpoint may not exist:', error);
    // User dropdown will be empty if endpoint doesn't exist
  }
};

const fetchResources = async () => {
  try {
    const res = await fetch(
      import.meta.env.VITE_INTERNAL_API_URL + '/resources',
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      }
    );
    const data = await res.json();
    resources.value = data;
  } catch (error) {
    console.error('Failed to fetch resources:', error);
  }
};

const saveBooking = async () => {
  try {
    const url = props.booking?.id
      ? `${import.meta.env.VITE_INTERNAL_API_URL}/admin/bookings/${props.booking.id}`
      : `${import.meta.env.VITE_INTERNAL_API_URL}/bookings`;

    const method = props.booking?.id ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('jwt')}`
      },
      body: JSON.stringify(form.value)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save booking');
    }

    emit('saved');
  } catch (error) {
    console.error('Failed to save booking:', error);
    alert(error.message || 'Fehler beim Speichern der Buchung');
  }
};

onMounted(() => {
  fetchUsers();
  fetchResources();
});
</script>

<style scoped></style>
