<template>
  <div class="space-y-6 max-w-7xl mx-auto py-6 px-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">E-Mail Vorlagen</h1>
        <p class="text-slate-600 mt-1">Verwalten Sie die automatischen System-Nachrichten.</p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="template in templatesList"
        :key="template.id"
        class="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
      >
        <div class="p-6 flex-1">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-blue-50 rounded-lg">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 leading-tight">{{ template.name }}</h3>
                <code class="text-[10px] text-slate-400 mt-1 block bg-slate-50 px-1 py-0.5 rounded w-fit">{{ template.key }}</code>
              </div>
            </div>
          </div>
          
          <div class="mb-4">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Betreff</span>
            <p class="text-sm text-slate-700 font-medium truncate" :title="template.subject">
              {{ template.subject }}
            </p>
          </div>

          <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
             <span
              :class="[
                'px-2.5 py-0.5 text-xs font-medium rounded-full',
                template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              ]"
            >
              {{ template.is_active ? 'Aktiv' : 'Inaktiv' }}
            </span>
          </div>
        </div>

        <div class="bg-gray-50 px-6 py-3 rounded-b-xl border-t border-gray-100 flex justify-end">
          <button
            @click="openEditor(template)"
            class="text-sm font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            Bearbeiten
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDialog && editingTemplate" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="closeDialog" aria-hidden="true"></div>
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-6 border-b pb-2">
              Vorlage bearbeiten: <span class="text-blue-600">{{ editingTemplate.name }}</span>
            </h3>
            
            <div class="grid grid-cols-1 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Betreff der E-Mail</label>
                <input 
                  v-model="form.subject" 
                  type="text"
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border" 
                />
              </div>

              <div v-if="availableVariables.length" class="bg-blue-50 p-4 rounded-md border border-blue-100">
                  <p class="text-xs text-blue-800 font-bold mb-2 uppercase tracking-wide">Verfügbare Platzhalter</p>
                  <div class="flex flex-wrap gap-2">
                    <button 
                      v-for="v in availableVariables" 
                      :key="v"
                      @click="insertVariable(v)"
                      class="px-2 py-1 bg-white text-blue-700 text-xs font-mono rounded border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                      title="Klicken zum Einfügen"
                    >
                      {{`${v}`}}
                    </button>
                  </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">E-Mail Inhalt (HTML)</label>
                <textarea 
                  id="templateBody"
                  v-model="form.body" 
                  rows="12" 
                  class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono p-3 border text-gray-800 leading-relaxed"
                ></textarea>
                <p class="text-xs text-gray-500 mt-2 flex items-center gap-1">
                   <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                   Tipp: Nutzen Sie HTML Tags wie <code>&lt;br&gt;</code>, <code>&lt;p&gt;</code> oder <code>&lt;b&gt;</code> zur Formatierung.
                </p>
              </div>

              <div class="flex items-center">
                  <button 
                    type="button" 
                    @click="form.is_active = !form.is_active"
                    :class="[form.is_active ? 'bg-blue-600' : 'bg-gray-200', 'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500']" 
                    role="switch" 
                    aria-checked="false"
                  >
                    <span aria-hidden="true" :class="[form.is_active ? 'translate-x-5' : 'translate-x-0', 'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200']"></span>
                  </button>
                  <span class="ml-3 text-sm font-medium text-gray-900">Automatischen Versand aktivieren</span>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-100">
            <button 
              type="button" 
              @click="save"
              :disabled="saving"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-900 text-base font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ saving ? 'Speichert...' : 'Speichern' }}
            </button>
            <button 
              type="button" 
              @click="closeDialog"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
const api = useBookingApi()

const loading = ref(true)
const saving = ref(false)
const templatesList = ref<any[]>([])
const showDialog = ref(false)
const editingTemplate = ref<any>(null)

// Form State
const form = ref({
  subject: '',
  body: '',
  is_active: true
})

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

const openEditor = (template: any) => {
  editingTemplate.value = template
  form.value = {
    subject: template.subject,
    body: template.body,
    is_active: template.is_active
  }
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  editingTemplate.value = null
}

const save = async () => {
  if (!editingTemplate.value) return
  saving.value = true
  try {
    const updated = await api.templates.update(editingTemplate.value.id, form.value)
    if (updated) {
       // Liste aktualisieren, ohne kompletten Reload
       const idx = templatesList.value.findIndex(t => t.id === updated.id)
       if (idx !== -1) templatesList.value[idx] = updated
       closeDialog()
    }
  } finally {
    saving.value = false
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