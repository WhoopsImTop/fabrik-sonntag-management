<template>
  <div class="flex items-center justify-center md:grid md:grid-cols-2 md:bg-gray-100 h-screen">
    <div class="hidden md:block h-screen object-cover">
      <img
        src="../public/fabrik-sonntag-P3330623-Pano-2.jpg"
        class="w-full h-full object-cover"
      />
    </div>
    <div class="flex flex-col items-center justify-center bg-gray-100">
      <div class="rounded-full overflow-hidden border border-neutral-200 bg-white w-16 h-16 flex items-center justify-center shadow-md mb-4">
        <img src="../public/fabrik-sonntag_logo.png" class="h-16" />
      </div>
      <h2 class="text-2xl font-bold text-center">Willkommen!</h2>
      <p class="text-sm text-neutral-600 text-center">
        Melden Sie sich in der Administrationsoberfläche an.
      </p>
      <form
        @submit.prevent="login"
        class="w-full max-w-xs flex flex-col items-center mt-16"
      >
        <div class="w-full flex flex-col gap-3 mb-4">
          <label class="flex flex-col text-xs text-neutral-600 gap-1"
            >E-Mail-Adresse
            <input
              v-model="username"
              type="text"
              placeholder="E-Mail-Adresse"
              class="p-2 border border-black/10 shadow-sm rounded-lg bg-white"
              required
          /></label>
          <label class="flex flex-col text-xs text-neutral-600 gap-1"
            >Passwort
            <input
              v-model="password"
              type="password"
              placeholder="Passwort"
              class="p-2 border border-black/10 shadow-sm rounded-lg bg-white"
              required
            />
          </label>
        </div>
        <button
          type="submit"
          class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm w-full mb-2"
        >
          Anmelden
        </button>
        <p v-if="error" class="text-red-500 text-xs">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

// Verwende das auth Layout (ohne Sidebar)
definePageMeta({
  layout: "auth",
});

const username = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();

async function login() {
  error.value = "";
  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.value,
          password: password.value,
        }),
      }
    );
    if (!response.ok)
      throw new Error("Bitte überprüfen Sie ihre E-Mail und ihr Passwort");
    const data = await response.json();
    if (!data.token)
      throw new Error(
        "Es ist ein Fehler aufgetreten, bitte versuchen Sie es später erneut"
      );
    localStorage.setItem("jwt", data.token);
    router.push("/");
  } catch (e) {
    error.value = e.message || "Unbekannter Fehler";
  }
}
</script>
