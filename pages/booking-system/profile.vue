<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-neutral-900">Mein Profil</h1>
      <p class="text-neutral-600 mt-1">Verwalten Sie Ihre persönlichen Daten und Mitgliedschaft</p>
    </div>

    <!-- Profile Card -->
    <div class="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
      <div v-if="loading" class="flex justify-center py-12">
        <svg class="animate-spin w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div v-else>
        <!-- Header with Avatar -->
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-8">
          <div class="flex items-center space-x-6">
            <div class="h-24 w-24 bg-white rounded-full flex items-center justify-center">
              <span class="text-blue-600 font-bold text-3xl">
                {{ getInitials(profile.first_name, profile.last_name) }}
              </span>
            </div>
            <div class="text-white">
              <h2 class="text-2xl font-bold">{{ profile.first_name }} {{ profile.last_name }}</h2>
              <p class="text-blue-100 mt-1">{{ profile.email }}</p>
            </div>
          </div>
        </div>

        <!-- Profile Information -->
        <div class="p-8 space-y-6">
          <!-- Personal Information -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-neutral-900">Persönliche Informationen</h3>
              <button
                v-if="!editMode"
                @click="editMode = true"
                class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bearbeiten
              </button>
            </div>
            
            <div v-if="!editMode" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p class="text-sm font-medium text-neutral-500 mb-1">Vorname</p>
                <p class="text-neutral-900">{{ profile.first_name }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-500 mb-1">Nachname</p>
                <p class="text-neutral-900">{{ profile.last_name }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-500 mb-1">E-Mail</p>
                <p class="text-neutral-900">{{ profile.email }}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-500 mb-1">Telefon</p>
                <p class="text-neutral-900">{{ profile.mobile_number || '-' }}</p>
              </div>
              <div class="md:col-span-2">
                <p class="text-sm font-medium text-neutral-500 mb-1">Adresse</p>
                <p class="text-neutral-900">
                  {{ profile.street }}<br />
                  {{ profile.zip_code }} {{ profile.city }}
                </p>
              </div>
            </div>

            <!-- Edit Form -->
            <div v-else class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">Vorname</label>
                  <input
                    v-model="editForm.first_name"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">Nachname</label>
                  <input
                    v-model="editForm.last_name"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">E-Mail</label>
                  <input
                    v-model="editForm.email"
                    type="email"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">Telefon</label>
                  <input
                    v-model="editForm.mobile_number"
                    type="tel"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-neutral-700 mb-2">Straße</label>
                  <input
                    v-model="editForm.street"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">PLZ</label>
                  <input
                    v-model="editForm.zip_code"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">Stadt</label>
                  <input
                    v-model="editForm.city"
                    type="text"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div class="flex justify-end space-x-2 pt-4">
                <button
                  @click="cancelEdit"
                  class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  @click="saveProfile"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>

          <!-- Membership -->
          <div class="border-t border-neutral-200 pt-6">
            <h3 class="text-lg font-semibold text-neutral-900 mb-4">Mitgliedschaft</h3>
            <div v-if="membership" class="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center space-x-3">
                  <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <div>
                    <p class="text-xl font-bold text-purple-900">{{ membership.type_name }}</p>
                    <p class="text-sm text-purple-600">Aktive Mitgliedschaft</p>
                  </div>
                </div>
                <span class="px-3 py-1 bg-purple-200 text-purple-800 text-sm font-semibold rounded-full">
                  {{ membership.discount_percent }}% Rabatt
                </span>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-purple-600">Gültig seit</p>
                  <p class="text-purple-900 font-medium">{{ formatDate(membership.valid_from) }}</p>
                </div>
                <div>
                  <p class="text-purple-600">Gültig bis</p>
                  <p class="text-purple-900 font-medium">{{ membership.valid_until ? formatDate(membership.valid_until) : 'Unbegrenzt' }}</p>
                </div>
              </div>
            </div>
            <div v-else class="bg-neutral-50 border border-neutral-200 rounded-lg p-6 text-center">
              <svg class="w-8 h-8 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-neutral-600">Sie haben derzeit keine aktive Mitgliedschaft</p>
            </div>
          </div>

          <!-- Recent Bookings -->
          <div class="border-t border-neutral-200 pt-6">
            <h3 class="text-lg font-semibold text-neutral-900 mb-4">Letzte Buchungen</h3>
            <div v-if="recentBookings.length === 0" class="text-center py-8 text-neutral-500">
              Keine Buchungen vorhanden
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="booking in recentBookings"
                :key="booking.id"
                class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div class="flex items-center space-x-4">
                  <div class="p-2 bg-blue-100 rounded-lg">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-neutral-900">{{ booking.resource_name }}</p>
                    <p class="text-sm text-neutral-600">{{ formatDate(booking.start_at) }}</p>
                  </div>
                </div>
                <span class="text-sm font-semibold text-neutral-900">€{{ booking.total }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useBookingApi()
const loading = ref(true)
const editMode = ref(false)
const profile = ref<any>({})
const membership = ref<any>(null)
const recentBookings = ref<any[]>([])
const editForm = ref<any>({})

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('de-DE')
}

const loadProfile = async () => {
  loading.value = true
  try {
    // Load profile
    const profileData = await api.users.getProfile()
    if (profileData) {
      profile.value = profileData
      editForm.value = { ...profileData }
    }

    // Load membership
    try {
      const membershipData = await api.memberships.getMy()
      if (membershipData) membership.value = membershipData
    } catch (error) {
      console.log('No membership found')
    }

    // Load recent bookings
    const bookings = await api.bookings.getAll()
    if (bookings && Array.isArray(bookings)) {
      recentBookings.value = bookings.slice(0, 3)
    }
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  const result = await api.users.updateProfile(editForm.value)
  if (result) {
    profile.value = { ...editForm.value }
    editMode.value = false
  }
}

const cancelEdit = () => {
  editForm.value = { ...profile.value }
  editMode.value = false
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped></style>
