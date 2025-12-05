<template>
  <div class="p-4">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink
        to="/booking-system/email-templates"
        class="p-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10"
      >
        <UIcon name="i-lucide-arrow-left" size="20" />
      </NuxtLink>
      <h1 class="text-lg font-bold">Email-Vorlage bearbeiten</h1>
    </div>

    <div v-if="template" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Editor -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Vorlagen-Details</h2>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">Schlüssel</label>
                <input
                  v-model="template.key"
                  type="text"
                  class="w-full p-2 border rounded-lg border-black/10 shadow-sm font-mono text-sm"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Sprache</label>
                <select
                  v-model="template.language"
                  class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
                >
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Betreff</label>
              <input
                v-model="template.subject"
                type="text"
                class="w-full p-2 border rounded-lg border-black/10 shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">HTML-Inhalt</label>
              <textarea
                v-model="template.bodyHtml"
                rows="15"
                class="w-full p-2 border rounded-lg border-black/10 shadow-sm font-mono text-sm"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Text-Inhalt (Optional)</label>
              <textarea
                v-model="template.bodyText"
                rows="8"
                class="w-full p-2 border rounded-lg border-black/10 shadow-sm font-mono text-sm"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-4">
        <!-- Actions -->
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Aktionen</h2>
          <div class="space-y-2">
            <button
              @click="saveTemplate"
              class="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 rounded-lg text-sm border border-black/10 shadow-sm"
            >
              Speichern
            </button>
            <button
              @click="previewTemplate"
              class="w-full bg-neutral-100 hover:bg-neutral-200 font-bold py-2 rounded-lg text-sm border border-black/10 shadow-sm"
            >
              Vorschau
            </button>
          </div>
        </div>

        <!-- Variables -->
        <div class="bg-white rounded-lg p-4 border border-black/10 shadow-sm">
          <h2 class="text-lg font-semibold mb-4">Verfügbare Variablen</h2>
          <p class="text-xs text-neutral-600 mb-3">Klicken zum Kopieren</p>
          <div class="space-y-2 text-sm">
            <div 
              v-for="variable in availableVariables" 
              :key="variable.name"
              @click="copyVariable(variable.name)"
              class="bg-neutral-50 p-2 rounded border border-black/10 cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <code class="text-xs font-mono">{{ variable.name }}</code>
              <p class="text-xs text-neutral-600 mt-1">{{ variable.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreview" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Vorschau</h3>
          <button
            type="button"
            @click="showPreview = false"
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
        <div class="border border-black/10 rounded-lg p-4">
          <div class="mb-4 pb-4 border-b border-black/10">
            <strong>Betreff:</strong> {{ previewSubject }}
          </div>
          <div v-html="previewHtml" class="prose max-w-none"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const router = useRouter();
const template = ref(null);
const showPreview = ref(false);
const previewHtml = ref('');
const previewSubject = ref('');

const availableVariables = [
  { name: '{{userName}}', description: 'Name des Nutzers' },
  { name: '{{userEmail}}', description: 'E-Mail des Nutzers' },
  { name: '{{bookingId}}', description: 'Buchungs-ID' },
  { name: '{{resourceName}}', description: 'Name der Ressource' },
  { name: '{{startTime}}', description: 'Startzeit' },
  { name: '{{endTime}}', description: 'Endzeit' },
  { name: '{{totalPrice}}', description: 'Gesamtpreis' }
];

const copyVariable = async (variableName) => {
  try {
    await navigator.clipboard.writeText(variableName);
    // Optional: Toast notification
    alert(`${variableName} in Zwischenablage kopiert`);
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};

const fetchTemplate = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/email-templates/${route.params.id}`
    );
    const data = await res.json();
    template.value = data;
  } catch (error) {
    console.error('Failed to fetch template:', error);
  }
};

const saveTemplate = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_INTERNAL_API_URL}/email-templates/${template.value.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        },
        body: JSON.stringify(template.value)
      }
    );

    if (res.ok) {
      alert('Vorlage erfolgreich gespeichert');
    } else {
      const error = await res.json();
      throw new Error(error.error);
    }
  } catch (error) {
    console.error('Failed to save template:', error);
    alert(error.message || 'Fehler beim Speichern der Vorlage');
  }
};

const previewTemplate = () => {
  // Replace variables with example data
  const exampleData = {
    userName: 'Max Mustermann',
    userEmail: 'max@example.com',
    bookingId: '123',
    resourceName: 'Meetingraum A',
    startTime: '05.12.2025 14:00',
    endTime: '05.12.2025 16:00',
    totalPrice: '50.00 EUR'
  };

  previewSubject.value = template.value.subject;
  previewHtml.value = template.value.bodyHtml;

  Object.entries(exampleData).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    previewSubject.value = previewSubject.value.replace(regex, value);
    previewHtml.value = previewHtml.value.replace(regex, value);
  });

  showPreview.value = true;
};

onMounted(() => {
  fetchTemplate();
});
</script>

<style scoped></style>
