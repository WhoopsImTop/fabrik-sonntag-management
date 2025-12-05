<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">Email-Vorlagen</h1>
      <button
        class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
        @click="openCreateModal"
      >
        Neue Vorlage
      </button>
    </div>

    <!-- Templates Table -->
    <table class="w-full rounded-lg overflow-hidden border border-black/10 shadow-sm bg-white">
      <thead class="bg-neutral-50">
        <tr class="text-left">
          <th class="px-3 py-1.5 text-sm">Schlüssel</th>
          <th class="px-3 py-1.5 text-sm">Sprache</th>
          <th class="px-3 py-1.5 text-sm">Betreff</th>
          <th class="px-3 py-1.5 text-sm">Aktualisiert</th>
          <th class="px-3 py-1.5 text-sm text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="template in templates" :key="template.id" class="border-t border-black/10">
          <td class="px-3 py-2 text-sm font-mono">{{ template.key }}</td>
          <td class="px-3 py-2 text-sm">
            <span class="px-2 py-1 rounded-lg text-xs border border-black/10 bg-blue-100 text-blue-900">
              {{ template.language.toUpperCase() }}
            </span>
          </td>
          <td class="px-3 py-2 text-sm">{{ template.subject }}</td>
          <td class="px-3 py-2 text-sm">{{ formatDate(template.updatedAt) }}</td>
          <td class="px-3 py-2 text-sm flex items-center gap-1 justify-end">
            <NuxtLink
              :to="`/booking-system/email-templates/edit/${template.id}`"
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              title="Bearbeiten"
            >
              <UIcon name="i-lucide-edit" size="16" />
            </NuxtLink>
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="duplicateTemplate(template)"
              title="Duplizieren"
            >
              <UIcon name="i-lucide-copy" size="16" />
            </div>
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-red-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="deleteTemplate(template)"
              title="Löschen"
            >
              <UIcon name="i-lucide-trash-2" size="16" />
            </div>
          </td>
        </tr>
        <tr v-if="templates.length === 0">
          <td colspan="5" class="px-3 py-4 text-sm text-center text-neutral-500">
            Keine Email-Vorlagen gefunden
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-4 w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Neue Email-Vorlage</h3>
          <button
            type="button"
            @click="showCreateModal = false"
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

        <form @submit.prevent="createTemplate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Schlüssel *</label>
            <input
              v-model="newTemplate.key"
              type="text"
              required
              placeholder="z.B. booking_confirmation"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm font-mono text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Sprache *</label>
            <select
              v-model="newTemplate.language"
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            >
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Betreff *</label>
            <input
              v-model="newTemplate.subject"
              type="text"
              required
              class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
            />
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              @click="showCreateModal = false"
              class="bg-neutral-100 hover:bg-neutral-200 font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
            >
              Erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
const router = useRouter();
const templates = ref([]);
const showCreateModal = ref(false);
const newTemplate = ref({
  key: '',
  language: 'de',
  subject: ''
});

const fetchTemplates = async () => {
  try {
    const res = await fetch(import.meta.env.VITE_INTERNAL_API_URL + '/email-templates');
    const data = await res.json();
    templates.value = data;
  } catch (error) {
    console.error('Failed to fetch templates:', error);
  }
};

const openCreateModal = () => {
  newTemplate.value = {
    key: '',
    language: 'de',
    subject: ''
  };
  showCreateModal.value = true;
};

const createTemplate = async () => {
  try {
    const res = await fetch(import.meta.env.VITE_INTERNAL_API_URL + '/email-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('jwt')}`
      },
      body: JSON.stringify({
        ...newTemplate.value,
        bodyHtml: '<p>Email-Inhalt hier...</p>',
        bodyText: 'Email-Inhalt hier...'
      })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }

    const created = await res.json();
    showCreateModal.value = false;
    router.push(`/booking-system/email-templates/edit/${created.id}`);
  } catch (error) {
    console.error('Failed to create template:', error);
    alert(error.message || 'Fehler beim Erstellen der Vorlage');
  }
};

const duplicateTemplate = async (template) => {
  try {
    const res = await fetch(import.meta.env.VITE_INTERNAL_API_URL + '/email-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('jwt')}`
      },
      body: JSON.stringify({
        key: `${template.key}_copy`,
        language: template.language,
        subject: `${template.subject} (Kopie)`,
        bodyHtml: template.bodyHtml,
        bodyText: template.bodyText
      })
    });

    if (res.ok) {
      await fetchTemplates();
    } else {
      alert('Fehler beim Duplizieren der Vorlage');
    }
  } catch (error) {
    console.error('Failed to duplicate template:', error);
    alert('Fehler beim Duplizieren der Vorlage');
  }
};

const deleteTemplate = async (template) => {
  if (!confirm(`Vorlage "${template.key}" wirklich löschen?`)) return;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/email-templates/${template.id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      }
    );

    if (res.ok) {
      await fetchTemplates();
    } else {
      alert('Fehler beim Löschen der Vorlage');
    }
  } catch (error) {
    console.error('Failed to delete template:', error);
    alert('Fehler beim Löschen der Vorlage');
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

onMounted(() => {
  fetchTemplates();
});
</script>

<style scoped></style>
