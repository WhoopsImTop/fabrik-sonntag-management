<template>
  <div class="dialog-overlay overflow-y-auto" role="dialog" aria-modal="true">
    <div 
      class="absolute inset-0" 
      @click="$emit('close')"
    ></div>

    <div class="dialog-panel max-w-5xl my-8">
        <div class="dialog-header">
          <div class="min-w-0 flex-1">
            <h3 class="dialog-title">
              Gast-Onboarding & WiFi
            </h3>
            <div class="flex items-center gap-2 mt-1.5">
               <div :class="['h-1.5 w-8 rounded-full transition-all', step === 1 ? 'bg-neutral-900' : 'bg-neutral-200']"></div>
               <div :class="['h-1.5 w-8 rounded-full transition-all', step === 2 ? 'bg-neutral-900' : 'bg-neutral-200']"></div>
               <p class="text-[11px] font-bold text-neutral-400 uppercase tracking-widest ml-2">
                 Schritt {{ step }} von 2
               </p>
            </div>
          </div>
          <button 
            type="button"
            class="dialog-close"
            aria-label="Schließen"
            @click="$emit('close')" 
          >
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="p-0 h-[680px] overflow-hidden flex flex-col bg-white">
          
          <div v-if="step === 1" class="flex-1 flex flex-col p-6 overflow-hidden">
            <div class="flex p-1 bg-neutral-100 rounded-md self-center mb-8 w-full max-w-[400px] border border-neutral-200">
              <button 
                @click="activeTab = 'list'"
                :class="['flex-1 px-4 py-2 text-sm font-semibold rounded-none transition-all', activeTab === 'list' ? 'bg-white shadow-sm text-neutral-900 border border-neutral-900' : 'text-neutral-500 hover:text-neutral-700']"
              >
                Vorhandene Codes
              </button>
              <button 
                @click="activeTab = 'create'"
                :class="['flex-1 px-4 py-2 text-sm font-semibold rounded-none transition-all', activeTab === 'create' ? 'bg-white shadow-sm text-neutral-900 border border-neutral-900' : 'text-neutral-500 hover:text-neutral-700']"
              >
                Neu generieren
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-1">
              <div v-if="activeTab === 'list'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div 
                  v-for="v in sortedVouchers" :key="v.code"
                  @click="selectedVoucher = v"
                  :class="[
                    'group p-5 border rounded-2xl cursor-pointer transition-all duration-200 relative',
                    selectedVoucher?.code === v.code 
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900' 
                      : 'border-neutral-200 hover:border-neutral-400 bg-white shadow-sm'
                  ]"
                >
                  <div class="flex justify-between items-start mb-3">
                    <span class="font-mono text-base font-bold tracking-tighter text-slate-900">
                      {{ formatVoucherCode(v.code) }}
                    </span>
                    <div v-if="selectedVoucher?.code === v.code" class="h-5 w-5 bg-neutral-900 rounded-full flex items-center justify-center">
                        <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                  </div>
                  <p class="text-xs text-slate-500 font-medium truncate mb-4">{{ v.name || 'Allgemeiner Voucher' }}</p>
                  <div class="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                     <span class="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold uppercase">
                        {{ v.timeLimitMinutes / 60 }} Std.
                     </span>
                     <span class="text-[10px] text-slate-400 font-medium">
                        {{ formatDate(v.createdAt) }}
                     </span>
                  </div>
                </div>
                <div v-if="sortedVouchers.length === 0" class="col-span-full py-20 text-center">
                  <p class="text-slate-400 text-sm italic">Keine Voucher gefunden.</p>
                </div>
              </div>

              <div v-if="activeTab === 'create'" class="max-w-2xl mx-auto">
                <div class="bg-neutral-50 border border-neutral-200 rounded-md p-8">
                  <h4 class="text-sm font-bold text-neutral-900 mb-6 uppercase tracking-widest">Voucher Konfiguration</h4>
                  <div class="grid grid-cols-2 gap-6">
                    <div class="col-span-2">
                      <label class="dialog-label">Interne Bezeichnung</label>
                      <input v-model="formVoucher.name" type="text" class="dialog-input" placeholder="z.B. Gast Gruppe Sonntag">
                    </div>
                    <div>
                      <label class="dialog-label">Dauer (Minuten)</label>
                      <input v-model.number="formVoucher.timeLimitMinutes" type="number" class="dialog-input">
                    </div>
                    <div>
                      <label class="dialog-label">Gäste Limit</label>
                      <input v-model.number="formVoucher.guestLimit" type="number" class="dialog-input">
                    </div>
                    <div class="col-span-2 pt-4">
                      <button 
                        @click="handleCreate" 
                        :disabled="loading" 
                        class="btn-dialog-primary w-full py-3"
                      >
                         <span v-if="loading" class="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                         Voucher in Unifi erstellen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="step === 2" class="flex-1 flex flex-col overflow-hidden bg-neutral-50/50 p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
              
              <div class="flex flex-col gap-4 h-full min-h-0">
                <div class="bg-white p-5 rounded-none border border-neutral-200 flex flex-col gap-4 flex-1">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">E-Mail Daten</label>
                    <select 
                      v-model="selectedTemplateId" 
                      @change="applyTemplate" 
                      class="text-xs font-bold text-neutral-700 bg-neutral-100 px-2 py-1 rounded-md cursor-pointer outline-none hover:bg-neutral-200 transition-colors"
                    >
                      <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="dialog-label">Empfänger Adresse</label>
                    <input 
                      v-model="emailData.email" 
                      type="email" 
                      class="dialog-input" 
                      placeholder="gast@beispiel.de"
                    >
                  </div>

                  <div>
                    <label class="dialog-label">Betreff</label>
                    <input 
                      v-model="emailData.subject" 
                      type="text" 
                      class="dialog-input" 
                      placeholder="E-Mail Betreff"
                    >
                  </div>
                  
                  <div class="flex-1 flex flex-col">
                    <label class="dialog-label">Inhalt (HTML)</label>
                    <textarea 
                      v-model="emailData.rawBody" 
                      class="dialog-input flex-1 min-h-[120px] font-mono text-[13px] leading-relaxed resize-none"
                      placeholder="HTML Inhalt hier bearbeiten..."
                    ></textarea>
                  </div>
                  
                  <div class="p-3 bg-amber-50 rounded-md border border-amber-100 flex gap-3 items-start">
                    <div class="text-amber-600 mt-0.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <p class="text-[10px] text-amber-800 leading-snug">
                      Der Tag wird automatisch durch <strong>{{ formatVoucherCode(selectedVoucher?.code) }}</strong> ersetzt.
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-4 h-full min-h-0">
                <div class="bg-white rounded-none border border-neutral-200 flex flex-col h-full overflow-hidden">
                  <div class="px-5 py-3 border-b border-neutral-200 flex justify-between items-center">
                    <label class="text-xs font-bold text-neutral-400 uppercase tracking-widest">Live Vorschau</label>
                    <div class="flex gap-1">
                      <div class="w-2 h-2 rounded-full bg-slate-200"></div>
                      <div class="w-2 h-2 rounded-full bg-slate-200"></div>
                      <div class="w-2 h-2 rounded-full bg-slate-200"></div>
                    </div>
                  </div>
                  <div 
                    class="flex-1 overflow-y-auto p-8 preview-container" 
                    v-html="renderedContent"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer !justify-between">
          <button 
            type="button"
            @click="step === 2 ? (step = 1) : $emit('close')" 
            class="btn-dialog-cancel"
          >
            {{ step === 2 ? 'Zurück zum Voucher' : 'Abbrechen' }}
          </button>

          <div class="flex items-center gap-3">
            <button 
              v-if="step === 1"
              type="button"
              @click="step = 2"
              :disabled="!selectedVoucher"
              class="btn-dialog-primary"
            >
              Weiter zur E-Mail
            </button>
            <button 
              v-else
              type="button"
              @click="confirmSend = true"
              :disabled="!emailData.email || !emailData.subject || loading"
              class="btn-dialog-primary"
            >
              Prüfen & Senden
            </button>
          </div>
        </div>

        <transition name="fade">
          <div
            v-if="confirmSend"
            class="dialog-overlay absolute inset-0 z-[99] !m-0"
          >
            <div class="dialog-panel max-w-sm text-center">
              <div class="dialog-header !border-b-0 !justify-center">
                <div class="flex w-full flex-col items-center gap-4">
                  <div class="flex size-16 items-center justify-center bg-neutral-100 text-neutral-700">
                    <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h4 class="dialog-title">E-Mail abschicken?</h4>
                    <p class="dialog-desc">
                      Die Willkommens-E-Mail wird jetzt an
                      <strong class="text-neutral-900">{{ emailData.email }}</strong>
                      gesendet.
                    </p>
                  </div>
                </div>
              </div>
              <div class="dialog-footer !flex-col">
                <button type="button" @click="handleSend" class="btn-dialog-primary w-full">
                  Ja, jetzt senden
                </button>
                <button type="button" @click="confirmSend = false" class="btn-dialog-cancel w-full">
                  Nochmals prüfen
                </button>
              </div>
            </div>
          </div>
        </transition>

      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";

const props = defineProps({
  initialEmail: { type: String, default: "" },
  userId: { type: Number, default: null },
  bookingId: { type: Number, default: null },
});
const emit = defineEmits(["close", "success"]);

const api = useBookingApi();

// --- UI State ---
const step = ref(1);
const activeTab = ref('list');
const loading = ref(false);
const confirmSend = ref(false);

// --- Data State ---
const vouchers = ref<any>([]);
const templates = ref<any[]>([]);
const selectedVoucher = ref<any>(null);
const selectedTemplateId = ref<number | null>(8);

const formVoucher = reactive({
  count: 1,
  name: "",
  guestLimit: 1,
  timeLimitMinutes: 1440,
  rxRateLimitKbps: 60000,
  txRateLimitKbps: 12000,
});

const emailData = reactive({
  email: props.initialEmail,
  subject: "",
  rawBody: "",
});

// --- Logic ---

const sortedVouchers = computed(() => {
  const list = vouchers.value?.data || [];
  return [...list].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
});

const formatVoucherCode = (code: string) => {
  if (!code) return "";
  if (code.includes('-')) return code;
  const mid = Math.floor(code.length / 2);
  return `${code.slice(0, mid)}-${code.slice(mid)}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "Neu";
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const renderedContent = computed(() => {
  if (!emailData.rawBody) return '<p class="text-slate-300 italic">Warte auf Inhalt...</p>';
  
  const tokenHtml = selectedVoucher.value
    ? `<strong style="font-family: 'Courier New', Courier, monospace; color: #2563eb; background: #eff6ff; padding: 4px 8px; border-radius: 6px; border: 1px solid #dbeafe;">${formatVoucherCode(selectedVoucher.value.code)}</strong>`
    : `<span style="color: #94a3b8; border: 1px dashed #cbd5e1; padding: 2px 4px;">[WiFi Code erscheint hier]</span>`;
    
  return emailData.rawBody.replace(/{{wifi_token}}/g, tokenHtml);
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [vRes, tRes] = await Promise.all([
      api.wifiToken.getAll(),
      api.emailService.getAll()
    ]);
    vouchers.value = vRes;
    templates.value = tRes?.data || tRes;
    applyTemplate();
  } catch (err) {
    console.error("Fehler beim Laden:", err);
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  loading.value = true;
  try {
    const res = await api.wifiToken.createToken(formVoucher);
    if (res) {
      await fetchData();
      activeTab.value = 'list';
      if (sortedVouchers.value.length > 0) {
        selectedVoucher.value = sortedVouchers.value[0];
      }
    }
  } finally {
    loading.value = false;
  }
};

const applyTemplate = () => {
  const t = templates.value.find(temp => temp.id === selectedTemplateId.value);
  if (t) {
    emailData.subject = t.subject;
    emailData.rawBody = t.body;
  }
};

const handleSend = async () => {
  confirmSend.value = false;
  loading.value = true;
  try {
    const payload = {
      email: emailData.email,
      subject: emailData.subject,
      content: renderedContent.value,
      user_id: props.userId ?? null,
      booking_id: props.bookingId ?? null,
    };
    const success = await api.emailService.sendCustomEmail(payload);
    if (success) {
      emit("success");
      emit("close");
    }
  } catch (err) {
    console.error("Fehler beim Senden:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.preview-container :deep(p) { margin-bottom: 1.25rem; line-height: 1.7; color: #334155; }
.preview-container :deep(a) { color: #2563eb; text-decoration: underline; font-weight: 500; }
.preview-container :deep(strong) { font-weight: 700; color: #0f172a; }
</style>