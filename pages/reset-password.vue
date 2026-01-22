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
      <h2 class="text-2xl font-bold text-center">Neues Passwort</h2>
      <p class="text-sm text-neutral-600 text-center max-w-xs">
        Waehle ein neues Passwort fuer dein Konto.
      </p>

      <form
        @submit.prevent="resetPassword"
        class="w-full max-w-xs flex flex-col items-center mt-10"
      >
        <div class="w-full flex flex-col gap-3 mb-4">
          <label class="flex flex-col text-xs text-neutral-600 gap-1">
            Neues Passwort
            <input
              v-model="newPassword"
              type="password"
              placeholder="Neues Passwort"
              class="p-2 border border-black/10 shadow-sm rounded-lg bg-white"
              required
              minlength="8"
            />
          </label>
          <label class="flex flex-col text-xs text-neutral-600 gap-1">
            Passwort bestaetigen
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Passwort bestaetigen"
              class="p-2 border border-black/10 shadow-sm rounded-lg bg-white"
              required
              minlength="8"
            />
          </label>
        </div>
        <button
          type="submit"
          :disabled="loading || !token"
          class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm w-full mb-2 disabled:opacity-50"
        >
          {{ loading ? 'Speichere...' : 'Passwort setzen' }}
        </button>
        <NuxtLink
          to="/login"
          class="text-xs text-neutral-500 hover:text-neutral-700"
        >
          Zurueck zum Login
        </NuxtLink>
        <p v-if="message" class="text-emerald-600 text-xs mt-2 text-center">
          {{ message }}
        </p>
        <p v-if="error" class="text-red-500 text-xs mt-2 text-center">
          {{ error }}
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')

const token = computed(() => String(route.query.token || ''))

const resetPassword = async () => {
  message.value = ''
  error.value = ''
  if (!token.value) {
    error.value = 'Reset-Token fehlt.'
    return
  }
  if (newPassword.value.length < 8) {
    error.value = 'Passwort muss mindestens 8 Zeichen haben.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwoerter stimmen nicht ueberein.'
    return
  }
  loading.value = true
  try {
    const response = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/auth/reset-password`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.value,
          newPassword: newPassword.value
        })
      }
    )
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data?.error || 'Passwort konnte nicht gesetzt werden.')
    }
    const data = await response.json().catch(() => ({}))
    message.value = data?.message || 'Passwort erfolgreich zurueckgesetzt.'
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e) {
    error.value = e.message || 'Unbekannter Fehler'
  } finally {
    loading.value = false
  }
}
</script>
