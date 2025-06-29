<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <form @submit.prevent="login" class="bg-white p-8 rounded shadow-md w-full max-w-sm flex flex-col gap-4">
      <h2 class="text-2xl font-bold mb-4 text-center">Login</h2>
      <input v-model="username" type="text" placeholder="Benutzername" class="p-2 border rounded" required />
      <input v-model="password" type="password" placeholder="Passwort" class="p-2 border rounded" required />
      <button type="submit" class="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded">Anmelden</button>
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Verwende das auth Layout (ohne Sidebar)
definePageMeta({
  layout: 'auth'
})

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()

async function login() {
  error.value = ''
  try {
    const response = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    if (!response.ok) throw new Error('Login fehlgeschlagen')
    const data = await response.json()
    if (!data.token) throw new Error('Kein Token erhalten')
    localStorage.setItem('jwt', data.token)
    router.push('/')
  } catch (e) {
    error.value = e.message || 'Unbekannter Fehler'
  }
}
</script>

<style scoped>
body { background: #f3f4f6; }
</style>
