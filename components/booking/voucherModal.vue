<template>
  <div class="fixed z-50 inset-0 overflow-y-auto" role="dialog" aria-modal="true">
    <div 
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
      @click="$emit('close')"
    ></div>

    <div class="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
      <div 
        class="relative bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-5xl w-full border border-slate-200"
      >
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h3 class="text-xl font-semibold text-slate-900 tracking-tight">
              Gast-Onboarding & WiFi
            </h3>
            <div class="flex items-center gap-2 mt-1.5">
               <div :class="['h-1.5 w-8 rounded-full transition-all', step === 1 ? 'bg-blue-600' : 'bg-slate-200']"></div>
               <div :class="['h-1.5 w-8 rounded-full transition-all', step === 2 ? 'bg-blue-600' : 'bg-slate-200']"></div>
               <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                 Schritt {{ step }} von 2
               </p>
            </div>
          </div>
          <button 
            @click="$emit('close')" 
            class="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-all"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <div class="p-0 h-[680px] overflow-hidden flex flex-col bg-white">
          
          <div v-if="step === 1" class="flex-1 flex flex-col p-6 overflow-hidden">
            <div class="flex p-1 bg-slate-100 rounded-xl self-center mb-8 w-full max-w-[400px] border border-slate-200/50">
              <button 
                @click="activeTab = 'list'"
                :class="['flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all', activeTab === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700']"
              >
                Vorhandene Codes
              </button>
              <button 
                @click="activeTab = 'create'"
                :class="['flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all', activeTab === 'create' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700']"
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
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600' 
                      : 'border-slate-200 hover:border-slate-400 bg-white shadow-sm'
                  ]"
                >
                  <div class="flex justify-between items-start mb-3">
                    <span class="font-mono text-base font-bold tracking-tighter text-slate-900">
                      {{ formatVoucherCode(v.code) }}
                    </span>
                    <div v-if="selectedVoucher?.code === v.code" class="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-200">
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
                <div class="bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-inner">
                  <h4 class="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Voucher Konfiguration</h4>
                  <div class="grid grid-cols-2 gap-6">
                    <div class="col-span-2">
                      <label class="text-xs font-bold text-slate-500 uppercase ml-1">Interne Bezeichnung</label>
                      <input v-model="formVoucher.name" type="text" class="w-full mt-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-50 outline-none transition-all" placeholder="z.B. Gast Gruppe Sonntag">
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase ml-1">Dauer (Minuten)</label>
                      <input v-model.number="formVoucher.timeLimitMinutes" type="number" class="w-full mt-2 px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-50">
                    </div>
                    <div>
                      <label class="text-xs font-bold text-slate-500 uppercase ml-1">Gäste Limit</label>
                      <input v-model.number="formVoucher.guestLimit" type="number" class="w-full mt-2 px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-50">
                    </div>
                    <div class="col-span-2 pt-4">
                      <button 
                        @click="handleCreate" 
                        :disabled="loading" 
                        class="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-200 flex items-center justify-center"
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

          <div v-if="step === 2" class="flex-1 flex flex-col overflow-hidden bg-slate-50/30 p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
              
              <div class="flex flex-col gap-4 h-full min-h-0">
                <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4 flex-1">
                  <div class="flex items-center justify-between">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">E-Mail Daten</label>
                    <select 
                      v-model="selectedTemplateId" 
                      @change="applyTemplate" 
                      class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded cursor-pointer outline-none hover:bg-blue-100 transition-colors"
                    >
                      <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Empfänger Adresse</label>
                    <input 
                      v-model="emailData.email" 
                      type="email" 
                      class="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 bg-slate-50/50" 
                      placeholder="gast@beispiel.de"
                    >
                  </div>

                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1">Betreff</label>
                    <input 
                      v-model="emailData.subject" 
                      type="text" 
                      class="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 bg-slate-50/50" 
                      placeholder="E-Mail Betreff"
                    >
                  </div>
                  
                  <div class="flex-1 flex flex-col">
                    <label class="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1">Inhalt (HTML)</label>
                    <textarea 
                      v-model="emailData.rawBody" 
                      class="flex-1 w-full p-4 border border-slate-200 rounded-xl text-[13px] font-mono leading-relaxed bg-slate-50/50 focus:bg-white outline-none focus:border-blue-500 transition-all resize-none"
                      placeholder="HTML Inhalt hier bearbeiten..."
                    ></textarea>
                  </div>
                  
                  <div class="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3 items-start">
                    <div class="text-amber-600 mt-0.5">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <p class="text-[10px] text-amber-800 leading-snug">
                      Der Tag <strong>{{ wifi_token }}</strong> wird automatisch durch <strong>{{ formatVoucherCode(selectedVoucher?.code) }}</strong> ersetzt.
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-4 h-full min-h-0">
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                  <div class="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Vorschau</label>
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

        <div class="px-6 py-5 bg-white border-t border-slate-100 flex justify-between items-center">
          <button 
            @click="step === 2 ? (step = 1) : $emit('close')" 
            class="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            {{ step === 2 ? 'Zurück zum Voucher' : 'Abbrechen' }}
          </button>

          <div class="flex items-center gap-4">
            <button 
              v-if="step === 1"
              @click="step = 2"
              :disabled="!selectedVoucher"
              class="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-30 shadow-xl shadow-slate-200 active:scale-95 transition-all"
            >
              Weiter zur E-Mail
            </button>
            <button 
              v-else
              @click="confirmSend = true"
              :disabled="!emailData.email || !emailData.subject || loading"
              class="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all"
            >
              Prüfen & Senden
            </button>
          </div>
        </div>

        <transition name="fade">
          <div v-if="confirmSend" class="absolute inset-0 z-[100] bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-6">
            <div class="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center transform transition-all">
              <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                 <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                 </svg>
              </div>
              <h4 class="text-2xl font-black text-slate-900 mb-3">E-Mail abschicken?</h4>
              <p class="text-sm text-slate-500 mb-8 leading-relaxed">
                Die Willkommens-E-Mail wird jetzt an <br><strong class="text-slate-900">{{ emailData.email }}</strong> gesendet.
              </p>
              <div class="flex flex-col gap-3">
                 <button @click="handleSend" class="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                   Ja, jetzt senden
                 </button>
                 <button @click="confirmSend = false" class="w-full py-4 bg-white text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all">
                   Nochmals prüfen
                 </button>
              </div>
            </div>
          </div>
        </transition>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";

const props = defineProps({ 
  initialEmail: { type: String, default: "" } 
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