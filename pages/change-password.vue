<template>
  <div class="max-w-xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Passwort ändern</h1>
      <p class="text-sm text-slate-500 mt-1">
        Aktualisieren Sie Ihr Passwort für die Administrationsoberfläche.
      </p>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <label class="flex flex-col text-sm text-slate-600 gap-1">
          Aktuelles Passwort
          <input
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            class="p-2 border border-slate-200 shadow-sm rounded-lg bg-white"
            required
          />
        </label>

        <label class="flex flex-col text-sm text-slate-600 gap-1">
          Neues Passwort
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            class="p-2 border border-slate-200 shadow-sm rounded-lg bg-white"
            required
            minlength="8"
          />
        </label>

        <label class="flex flex-col text-sm text-slate-600 gap-1">
          Neues Passwort bestätigen
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="p-2 border border-slate-200 shadow-sm rounded-lg bg-white"
            required
            minlength="8"
          />
        </label>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg text-sm border border-black/10 shadow-sm disabled:opacity-50"
        >
          {{ loading ? "Speichere..." : "Passwort ändern" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useBookingApi();
const router = useRouter();
const toast = useToast();

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");

onMounted(() => {
  if (!localStorage.getItem("jwt")) {
    router.push("/login");
  }
});

const handleSubmit = async () => {
  error.value = "";

  if (newPassword.value.length < 8) {
    error.value = "Passwort muss mindestens 8 Zeichen haben.";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = "Passwörter stimmen nicht überein.";
    return;
  }

  loading.value = true;
  try {
    const result = await api.auth.changePassword(
      currentPassword.value,
      newPassword.value,
    );
    if (!result) return;

    toast.add({
      title: "Erfolg",
      description: result.message || "Passwort erfolgreich geändert",
      color: "green",
    });
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
  } finally {
    loading.value = false;
  }
};
</script>
