<template>
  <div class="space-y-8 pb-20">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">
          Mein Profil
        </h1>
        <p class="text-neutral-500 mt-1">
          Persönliche Daten und Mitgliedschaft
        </p>
      </div>
      <button
        v-if="!loading && !editMode"
        type="button"
        class="btn-dialog-cancel gap-1.5 self-start sm:self-auto"
        @click="editMode = true"
      >
        <IconEdit class="size-4" />
        Bearbeiten
      </button>
    </div>

    <div v-if="loading" class="py-12 text-center text-neutral-500">Lädt…</div>

    <template v-else>
      <div class="flex items-center gap-4">
        <div
          class="flex size-14 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lg font-bold text-white"
        >
          {{ getInitials(profile.first_name, profile.last_name) }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-neutral-900">
            {{ profile.first_name }} {{ profile.last_name }}
          </h2>
          <p class="text-neutral-500 mt-0.5">{{ profile.email }}</p>
        </div>
      </div>

      <section>
        <h3 class="text-sm font-medium text-neutral-500 mb-3">Kontaktdaten</h3>

        <div v-if="!editMode" class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p class="text-xs font-medium text-neutral-500">Vorname</p>
            <p class="mt-0.5 text-neutral-900">{{ profile.first_name }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-neutral-500">Nachname</p>
            <p class="mt-0.5 text-neutral-900">{{ profile.last_name }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-neutral-500">E-Mail</p>
            <p class="mt-0.5 text-neutral-900">{{ profile.email }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-neutral-500">Telefon</p>
            <p class="mt-0.5 text-neutral-900">{{ profile.mobile_number || "—" }}</p>
          </div>
          <div class="sm:col-span-2">
            <p class="text-xs font-medium text-neutral-500">Adresse</p>
            <p class="mt-0.5 text-neutral-900">
              {{ profile.street || "—" }}
              <template v-if="profile.zip_code || profile.city">
                <br />{{ profile.zip_code }} {{ profile.city }}
              </template>
            </p>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="dialog-label">Vorname</label>
              <input v-model="editForm.first_name" type="text" class="dialog-input" />
            </div>
            <div>
              <label class="dialog-label">Nachname</label>
              <input v-model="editForm.last_name" type="text" class="dialog-input" />
            </div>
            <div>
              <label class="dialog-label">E-Mail</label>
              <input v-model="editForm.email" type="email" class="dialog-input" />
            </div>
            <div>
              <label class="dialog-label">Telefon</label>
              <input v-model="editForm.mobile_number" type="tel" class="dialog-input" />
            </div>
            <div class="sm:col-span-2">
              <label class="dialog-label">Straße</label>
              <input v-model="editForm.street" type="text" class="dialog-input" />
            </div>
            <div>
              <label class="dialog-label">PLZ</label>
              <input v-model="editForm.zip_code" type="text" class="dialog-input" />
            </div>
            <div>
              <label class="dialog-label">Stadt</label>
              <input v-model="editForm.city" type="text" class="dialog-input" />
            </div>
            <div>
              <label class="dialog-label">Land</label>
              <input v-model="editForm.country" type="text" class="dialog-input" />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn-dialog-cancel" @click="cancelEdit">
              Abbrechen
            </button>
            <button type="button" class="btn-dialog-primary" @click="saveProfile">
              Speichern
            </button>
          </div>
        </div>
      </section>

      <section class="border-t border-neutral-200 pt-6">
        <h3 class="text-sm font-medium text-neutral-500 mb-3">Mitgliedschaft</h3>
        <div v-if="membership" class="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3">
          <div>
            <p class="text-xs font-medium text-neutral-500">Typ</p>
            <p class="mt-0.5 font-medium text-neutral-900">{{ membership.type_name }}</p>
          </div>
          <div>
            <p class="text-xs font-medium text-neutral-500">Gültigkeit</p>
            <p class="mt-0.5 text-neutral-900">
              {{ formatDate(membership.valid_from) }}
              –
              {{ membership.valid_until ? formatDate(membership.valid_until) : "unbegrenzt" }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium text-neutral-500">Rabatt</p>
            <p class="mt-0.5 text-neutral-900">
              {{ formatDiscount(membership.discount_percent) }}%
            </p>
          </div>
        </div>
        <p v-else class="text-neutral-500">Keine aktive Mitgliedschaft</p>
      </section>

      <section class="border-t border-neutral-200 pt-6">
        <h3 class="text-sm font-medium text-neutral-500 mb-3">Letzte Buchungen</h3>
        <div
          v-if="recentBookings.length === 0"
          class="py-8 text-center text-neutral-500"
        >
          Keine Buchungen vorhanden
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-neutral-200 text-neutral-500">
                <th class="pb-3 pr-4 font-medium">Ressource</th>
                <th class="pb-3 pr-4 font-medium">Datum</th>
                <th class="pb-3 font-medium text-right">Betrag</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="booking in recentBookings"
                :key="booking.id"
                class="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
              >
                <td class="py-3 pr-4 font-medium text-neutral-900">
                  {{ booking.resource_name }}
                </td>
                <td class="py-3 pr-4 text-neutral-500">
                  {{ formatDate(booking.start_at) }}
                </td>
                <td class="py-3 text-right font-medium text-neutral-900">
                  €{{ booking.total }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
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

const formatDiscount = (value: number) => {
  if (typeof value !== 'number') return 0
  const normalized = value <= 1 ? value * 100 : value
  return Math.round(normalized * 100) / 100
}

const loadProfile = async () => {
  loading.value = true
  try {
    const profileData = await api.users.getProfile()
    if (profileData) {
      profile.value = profileData
      editForm.value = { ...profileData }
    }

    try {
      const membershipData = await api.memberships.getMy()
      if (membershipData) membership.value = membershipData
    } catch (error) {
      console.log('No membership found')
    }

    const rangeEnd = new Date()
    const rangeStart = new Date()
    rangeStart.setDate(rangeStart.getDate() - 90)
    const bookings = await api.bookings.getAll({
      start: rangeStart.toISOString(),
      end: rangeEnd.toISOString(),
    })
    if (bookings && Array.isArray(bookings)) {
      const filtered = bookings.filter((b: any) =>
        b.user_id === profile.value.id || b.User?.id === profile.value.id
      )
      recentBookings.value = filtered.slice(0, 3)
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
