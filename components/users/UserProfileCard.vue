<template>
  <div
    class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
  >
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-slate-900">Stammdaten</h3>
        <button
          @click="isEditing = !isEditing"
          class="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          {{ isEditing ? "Abbrechen" : "Bearbeiten" }}
        </button>
      </div>

      <div v-if="!isEditing" class="space-y-6">
        <div class="flex items-center gap-4">
          <div
            class="h-16 w-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold"
          >
            {{ getInitials(user.username) }}
          </div>
          <div>
            <h2 class="text-xl font-bold text-slate-900">
              {{ user.username }}
            </h2>
            <span
              class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 uppercase tracking-wide"
            >
              {{ user.role || "user" }}
            </span>
          </div>
        </div>

        <div class="grid gap-4 border-t border-slate-100 pt-4">
          <div>
            <label class="text-xs font-semibold text-slate-500 uppercase"
              >E-Mail</label
            >
            <p class="text-slate-900 font-medium flex items-center gap-2">
              <svg
                class="w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {{ user.email }}
            </p>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 uppercase"
              >Mitglied seit</label
            >
            <p class="text-slate-900">{{ formatDate(user.createdAt) }}</p>
          </div>
        </div>
      </div>

      <form v-else @submit.prevent="saveUser" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Vorname</label
          >
          <input
            v-model="form.first_name"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Nachname</label
          >
          <input
            v-model="form.last_name"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Telefonnummer</label
          >
          <input
            v-model="form.mobile_number"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Firma (optional)</label
          >
          <input
            v-model="form.company"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Straße</label>
          <input
            v-model="form.street"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Hausnummer</label
          >
          <input
            v-model="form.house_number"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Postleitzahl</label
          >
          <input
            v-model="form.zip_code"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Stadt</label>
          <input
            v-model="form.city"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">E-Mail</label>
          <input
            v-model="form.email"
            type="email"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Rolle</label>
          <select
            v-model="form.role"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700"
            >Debitoren Nummer</label
          >
          <input
            v-model="form.debitor_number"
            type="text"
            class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>
        <div class="pt-4 flex justify-end">
          <button
            type="submit"
            :disabled="loading"
            class="bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            {{ loading ? "Speichert..." : "Speichern" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
const props = defineProps<{ user: any }>();
const emit = defineEmits(["update"]);

const isEditing = ref(false);
const loading = ref(false);
const form = ref({
  first_name: "",
  last_name: "",
  company: "",
  mobile_number: "",
  street: "",
  house_number: "",
  zip_code: "",
  city: "",
  email: "",
  role: "",
  debitor_number: "",
});

// Init Form
watch(
  () => props.user,
  (u) => {
    if (u)
      form.value = {
        first_name: u?.details?.first_name ?? "",
        last_name: u?.details?.last_name ?? "",
        company: u?.details?.company ?? "",
        mobile_number: u?.details?.mobile_number ?? "",
        street: u?.details?.street ?? "",
        house_number: u?.details?.house_number ?? "",
        zip_code: u?.details?.zip_code ?? "",
        city: u?.details?.city ?? "",
        email: u.email,
        role: u.role,
        debitor_number: u?.details?.debitor_number ?? "",
      };
  },
  { immediate: true },
);

const getInitials = (n: string) => (n ? n.substring(0, 2).toUpperCase() : "?");
const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE");

const saveUser = async () => {
  loading.value = true;
  try {
    await emit("update", { id: props.user.id, ...form.value });
    isEditing.value = false;
  } finally {
    loading.value = false;
  }
};
</script>
