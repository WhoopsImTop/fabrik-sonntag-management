<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
          E-Mail Vorlagen
        </h1>
        <p class="mt-1 text-neutral-500">
          Verwalten Sie die automatischen System-Nachrichten.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-none bg-brand-accent px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:brightness-95"
        @click="openEditor()"
      >
        <UiIcon name="i-lucide-plus" class="size-4" />
        Neue Vorlage
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Name</th>
            <th class="pb-3 pr-4 font-medium">Key</th>
            <th class="pb-3 pr-4 font-medium">Betreff</th>
            <th class="pb-3 pr-4 font-medium">Status</th>
            <th class="pb-3 font-medium text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="py-12 text-center text-neutral-500">Lädt…</td>
          </tr>
          <tr v-else-if="templatesList.length === 0">
            <td colspan="5" class="py-12 text-center text-neutral-500">
              Keine Vorlagen vorhanden.
            </td>
          </tr>
          <tr
            v-for="template in templatesList"
            :key="template.id"
            class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
            @click="openEditor(template)"
          >
            <td class="py-4 pr-4 font-medium text-neutral-900">
              {{ template.name }}
            </td>
            <td class="py-4 pr-4 font-mono text-xs text-neutral-500">
              {{ template.key }}
            </td>
            <td class="max-w-xs truncate py-4 pr-4 text-neutral-700">
              {{ template.subject }}
            </td>
            <td class="py-4 pr-4">
              <span
                :class="
                  template.is_active ? 'text-emerald-600' : 'text-neutral-400'
                "
              >
                {{ template.is_active ? "Aktiv" : "Inaktiv" }}
              </span>
            </td>
            <td class="py-4 text-right">
              <button
                type="button"
                class="font-medium text-brand-accent hover:underline"
                @click.stop="openEditor(template)"
              >
                Bearbeiten
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDialog" class="dialog-overlay overflow-y-auto"
      aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="absolute inset-0" @click="closeDialog" aria-hidden="true"></div>

      <div class="dialog-panel max-w-3xl">
        <div class="dialog-header">
          <h3 id="modal-title" class="dialog-title">
            {{ isNewTemplate ? 'Neue Vorlage' : 'Vorlage bearbeiten:' }}
            <span class="text-neutral-900 font-normal" v-if="!isNewTemplate">{{ editingTemplate.name }}</span>
          </h3>
          <button type="button" class="dialog-close" aria-label="Schließen" @click="closeDialog">
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="dialog-body">
          <div class="grid grid-cols-1 gap-6">
              <div v-if="isNewTemplate" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="dialog-label">Name</label>
                  <input v-model="form.name" type="text" placeholder="z.B. Passwort Reset"
                    class="dialog-input" />
                </div>
                <div>
                  <label class="dialog-label">Key</label>
                  <input v-model="form.key" type="text" placeholder="PASSWORD_RESET"
                    class="dialog-input" />
                </div>
              </div>
              <div>
                <label class="dialog-label">Betreff der E-Mail</label>
                <input v-model="form.subject" type="text"
                  class="dialog-input" />
              </div>

              <div v-if="availableVariables.length" class="bg-neutral-50 p-4 rounded-none border border-neutral-200">
                <p class="text-xs text-neutral-700 font-bold mb-2 uppercase tracking-wide">Verfügbare Platzhalter</p>
                <div class="flex flex-wrap gap-2">
                  <button v-for="v in availableVariables" :key="v" @click="insertVariable(v)"
                    class="px-2 py-1 bg-white text-neutral-700 text-xs font-mono rounded-none border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 transition-colors"
                    title="Klicken zum Einfügen">
                    {{ `${v}` }}
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between mb-1 mt-4">
                <label class="dialog-label mb-0">Anhänge</label>
              </div>
              <!-- Attachments List -->
              <div v-if="form.attachments && form.attachments.length > 0" class="mb-3 space-y-2">
                <div v-for="(att, idx) in form.attachments" :key="idx"
                  class="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                  <div class="flex items-center space-x-2">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span class="text-sm text-gray-700 truncate max-w-xs">{{ att.filename }}</span>
                  </div>
                  <button type="button" @click="removeAttachment(idx)" class="text-red-500 hover:text-red-700 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <!-- Upload Input -->
              <div
                class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative"
                :class="{ 'opacity-50 pointer-events-none': uploading }">
                <div class="space-y-1 text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48"
                    aria-hidden="true">
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <div class="flex text-sm text-neutral-600 justify-center">
                    <label for="file-upload"
                      class="relative cursor-pointer bg-white rounded-md font-medium text-neutral-900 hover:text-neutral-700 focus-within:outline-none focus-within:ring-1 focus-within:ring-neutral-400">
                      <span>Datei hochladen</span>
                      <input id="file-upload" name="file-upload" type="file" multiple class="sr-only"
                        @change="handleFileUpload">
                    </label>
                  </div>
                  <p class="text-xs text-neutral-500">
                    Zusätzliche Anhänge für das Template (z.B. PDF, Bilder)
                  </p>
                </div>
                <!-- Loading overlay -->
                <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <svg class="animate-spin h-6 w-6 text-neutral-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8v8C5.373 20 0 14.627 0 8h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                    </path>
                  </svg>
                </div>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1 mt-6">
                  <label class="dialog-label mb-0">E-Mail Inhalt (HTML)</label>
                  <button type="button" @click="showPreview = !showPreview"
                    class="text-xs font-medium text-neutral-700 hover:text-neutral-900">
                    {{ showPreview ? 'Editor anzeigen' : 'Vorschau' }}
                  </button>
                </div>
                <textarea v-if="!showPreview" id="templateBody" v-model="form.body" rows="12"
                  class="dialog-input font-mono leading-relaxed min-h-[200px]"></textarea>
                <div v-else class="border border-neutral-200 rounded-md p-4 text-sm text-neutral-700 bg-neutral-50 min-h-[200px]"
                  v-html="form.body"></div>
                <p class="text-xs text-neutral-500 mt-2 flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tipp: Nutzen Sie HTML Tags wie <code>&lt;br&gt;</code>, <code>&lt;p&gt;</code> oder
                  <code>&lt;b&gt;</code> zur Formatierung.
                </p>
              </div>

              <div class="flex items-center">
                <button type="button" @click="form.is_active = !form.is_active"
                  :class="[form.is_active ? 'bg-neutral-900' : 'bg-neutral-200', 'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-1 focus:ring-neutral-400']"
                  role="switch" aria-checked="false">
                  <span aria-hidden="true"
                    :class="[form.is_active ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200']"></span>
                </button>
                <span class="ml-3 text-sm font-medium text-neutral-900">Automatischen Versand aktivieren</span>
              </div>
            </div>
        </div>

        <div class="dialog-footer">
          <button type="button" class="btn-dialog-cancel" @click="closeDialog">
            Abbrechen
          </button>
          <button type="button" class="btn-dialog-primary" @click="save" :disabled="saving">
            <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            {{ saving ? 'Speichert...' : 'Speichern' }}
          </button>
        </div>
        <p v-if="formError" class="px-6 pb-3 text-xs text-red-600 text-center shrink-0">
          {{ formError }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
const api = useBookingApi()

interface Attachment {
  filename: string;
  // Add other properties if known, e.g., id, url, etc.
}

interface FormData {
  name: string;
  key: string;
  subject: string;
  body: string;
  is_active: boolean;
  attachments: Attachment[];
}

const loading = ref(true)
const saving = ref(false)
const templatesList = ref<any[]>([])
const showDialog = ref(false)
const editingTemplate = ref<any>(null)
const showPreview = ref(false)
const isNewTemplate = ref(false)
const formError = ref('')

// Form State
const form = ref<FormData>({
  name: '',
  key: '',
  subject: '',
  body: '',
  is_active: true,
  attachments: []
})

const uploading = ref(false)

// Lädt die Templates vom Server
const loadTemplates = async () => {
  loading.value = true
  try {
    const res = await api.templates.getAll()
    if (res) templatesList.value = res
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTemplates()
})

const openEditor = (template?: any) => {
  formError.value = ''
  if (template) {
    isNewTemplate.value = false
    editingTemplate.value = template
    form.value = {
      name: template.name,
      key: template.key,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active,
      attachments: template.attachments || []
    }
  } else {
    isNewTemplate.value = true
    editingTemplate.value = null
    form.value = {
      name: '',
      key: '',
      subject: '',
      body: '',
      is_active: true,
      attachments: []
    }
  }
  showPreview.value = false
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  editingTemplate.value = null
  showPreview.value = false
  isNewTemplate.value = false
  formError.value = ''
}

const save = async () => {
  formError.value = ''
  if (!form.value.subject?.trim() || !form.value.body?.trim()) {
    formError.value = 'Bitte Betreff und Inhalt ausfuellen.'
    return
  }
  saving.value = true
  try {
    if (isNewTemplate.value) {
      if (!form.value.name?.trim() || !form.value.key?.trim()) {
        formError.value = 'Bitte Name und Key angeben.'
        saving.value = false
        return
      }
      const payload = {
        ...form.value,
        name: form.value.name.trim(),
        key: form.value.key.trim().toUpperCase(),
        subject: form.value.subject.trim(),
        body: form.value.body,
        attachments: form.value.attachments
      }
      const created = await api.templates.create(payload)
      if (created) {
        templatesList.value = [created, ...templatesList.value]
        closeDialog()
      }
    } else if (editingTemplate.value) {
      const payload = {
        ...form.value,
        subject: form.value.subject.trim(),
        body: form.value.body,
        attachments: form.value.attachments
      }
      const updated = await api.templates.update(editingTemplate.value.id, payload)
      if (updated) {
        const idx = templatesList.value.findIndex((t: any) => t.id === updated.id)
        if (idx !== -1) templatesList.value[idx] = updated
        closeDialog()
      }
    }
  } finally {
    saving.value = false
  }
}

const handleFileUpload = async (event: any) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('attachments', files[i])
  }

  uploading.value = true
  try {
    const res = await api.templates.uploadAttachments(formData)
    if (res && res.attachments) {
      // Füge hochgeladene Dateien zu den bestehenden Anhängen hinzu
      form.value.attachments = [...(form.value.attachments || []), ...res.attachments]
      // Resette input feld
      event.target.value = ''
    }
  } catch (error) {
    console.error("Fehler beim Hochladen:", error)
  } finally {
    uploading.value = false
  }
}

const removeAttachment = (index: number) => {
  if (form.value.attachments) {
    form.value.attachments.splice(index, 1)
  }
}

// Extrahiert die Variablennamen aus dem Hint-String ("user, date") -> ['user', 'date']
const availableVariables = computed(() => {
  if (!editingTemplate.value?.variables_hint) return []
  return editingTemplate.value.variables_hint.split(',').map((s: string) => s.trim())
})

const insertVariable = (v: string) => {
  const variableString = `{{${v}}}`;
  const textarea = document.getElementById('templateBody') as HTMLTextAreaElement;

  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = form.value.body;

    // Füge an Cursor-Position ein
    form.value.body = text.substring(0, start) + variableString + text.substring(end);

    // Setze Cursor nach Einfügen (Next tick nötig für reactivity)
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variableString.length;
    }, 0);
  } else {
    // Fallback falls Element nicht gefunden
    form.value.body += ` ${variableString} `;
  }
}
</script>
