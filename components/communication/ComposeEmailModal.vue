<template>
  <div class="dialog-overlay overflow-y-auto" role="dialog" aria-modal="true">
    <div class="absolute inset-0" @click="$emit('close')" />

    <div class="dialog-panel max-w-5xl my-8">
      <div class="dialog-header">
        <div class="min-w-0 flex-1">
          <h3 class="dialog-title">E-Mail senden</h3>
          <p class="dialog-desc">
            Individuelle Nachricht an den Gast verfassen und versenden.
          </p>
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

      <div class="flex h-[640px] flex-col overflow-hidden bg-neutral-50/50 p-6">
        <div
          v-if="loadingTemplates"
          class="flex flex-1 items-center justify-center"
        >
          <div
            class="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-900"
          />
        </div>

        <div
          v-else
          class="grid h-full min-h-0 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-2"
        >
          <div class="flex min-h-0 flex-col gap-4 overflow-y-auto">
            <div
              class="flex flex-1 flex-col gap-4 border border-neutral-200 bg-white p-5"
            >
              <div class="flex items-center justify-between gap-3">
                <label
                  class="text-xs font-bold uppercase tracking-widest text-neutral-400"
                >
                  E-Mail Daten
                </label>
                <select
                  v-model="selectedTemplateId"
                  class="cursor-pointer bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-700 outline-none transition-colors hover:bg-neutral-200"
                  @change="applyTemplate"
                >
                  <option :value="null">Ohne Vorlage</option>
                  <option v-for="t in templates" :key="t.id" :value="t.id">
                    {{ t.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="dialog-label">Empfänger Adresse</label>
                <input
                  v-model="emailData.email"
                  type="email"
                  class="dialog-input"
                  placeholder="gast@beispiel.de"
                />
              </div>

              <div>
                <label class="dialog-label">Betreff</label>
                <input
                  v-model="emailData.subject"
                  type="text"
                  class="dialog-input"
                  placeholder="E-Mail Betreff"
                />
              </div>

              <div class="flex min-h-0 flex-1 flex-col">
                <label class="dialog-label">Inhalt</label>
                <ClientOnly>
                  <UiRichTextEditor
                    v-model="emailData.rawBody"
                    class="min-h-[200px] flex-1"
                  />
                </ClientOnly>
              </div>

              <div class="border border-neutral-200 bg-neutral-50 p-4">
                <div class="mb-3 flex items-center justify-between gap-3">
                  <label
                    class="text-xs font-bold uppercase tracking-widest text-neutral-400"
                  >
                    Verfuegbare Platzhalter
                  </label>
                  <span class="text-xs text-neutral-500">
                    Werden mit der aktuellen Buchung ersetzt
                  </span>
                </div>

                <div class="space-y-3 text-xs text-neutral-700">
                  <div v-for="group in placeholderGroups" :key="group.label">
                    <p class="mb-1 font-semibold text-neutral-900">
                      {{ group.label }}
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <code
                        v-for="placeholder in group.items"
                        :key="placeholder"
                        class="border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700"
                      >
                        {{ placeholder }}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex min-h-0 flex-col">
            <div
              class="flex h-full flex-col overflow-hidden border border-neutral-200 bg-white"
            >
              <div
                class="flex items-center justify-between border-b border-neutral-200 px-5 py-3"
              >
                <label
                  class="text-xs font-bold uppercase tracking-widest text-neutral-400"
                >
                  Live Vorschau
                </label>
              </div>
              <div
                class="preview-container flex-1 overflow-y-auto p-8"
                v-html="previewContent"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer !justify-between">
        <button type="button" class="btn-dialog-cancel" @click="$emit('close')">
          Abbrechen
        </button>
        <button
          type="button"
          class="btn-dialog-primary"
          :disabled="!canSend || sending"
          @click="confirmSend = true"
        >
          Prüfen & Senden
        </button>
      </div>

      <transition name="fade">
        <div
          v-if="confirmSend"
          class="dialog-overlay absolute inset-0 z-[99] !m-0"
        >
          <div class="dialog-panel max-w-sm text-center">
            <div class="dialog-header !justify-center !border-b-0">
              <div class="flex w-full flex-col items-center gap-4">
                <div
                  class="flex size-16 items-center justify-center bg-neutral-100 text-neutral-700"
                >
                  <UiIcon name="i-lucide-mail" class="size-8" />
                </div>
                <div>
                  <h4 class="dialog-title">E-Mail abschicken?</h4>
                  <p class="dialog-desc">
                    Die E-Mail wird jetzt an
                    <strong class="text-neutral-900">{{ emailData.email }}</strong>
                    gesendet.
                  </p>
                </div>
              </div>
            </div>
            <div class="dialog-footer !flex-col">
              <button
                type="button"
                class="btn-dialog-primary w-full"
                :disabled="sending"
                @click="handleSend"
              >
                {{ sending ? "Wird gesendet…" : "Ja, jetzt senden" }}
              </button>
              <button
                type="button"
                class="btn-dialog-cancel w-full"
                :disabled="sending"
                @click="confirmSend = false"
              >
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
  booking: { type: Object, default: null },
});

const emit = defineEmits(["close", "success"]);

const api = useBookingApi();

const loadingTemplates = ref(false);
const sending = ref(false);
const confirmSend = ref(false);
const templates = ref<any[]>([]);
const selectedTemplateId = ref<number | null>(null);

const emailData = reactive({
  email: props.initialEmail,
  subject: "",
  rawBody: "",
});

const placeholderGroups = [
  {
    label: "Gast",
    items: [
      "{{user_name}}",
      "{{first_name}}",
      "{{last_name}}",
      "{{email}}",
      "{{phone}}",
      "{{company}}",
      "{{user.name}}",
      "{{user.email}}",
    ],
  },
  {
    label: "Buchung",
    items: [
      "{{booking_id}}",
      "{{booking_status}}",
      "{{start}}",
      "{{end}}",
      "{{start_date}}",
      "{{end_date}}",
      "{{start_time}}",
      "{{end_time}}",
      "{{booking.start}}",
      "{{booking.end}}",
    ],
  },
  {
    label: "Ressource",
    items: ["{{resource_name}}", "{{resource.name}}"],
  },
];

const formatDate = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

const formatTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const bookingPlaceholderData = computed(() => {
  const booking = props.booking || {};
  const user = booking.User || {};
  const details = user.details || {};
  const firstName = details.first_name?.trim() || "";
  const lastName = details.last_name?.trim() || "";
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.email ||
    "Gast";
  const startAt = booking.start_at || null;
  const endAt = booking.end_at || null;
  const startDate = formatDate(startAt);
  const endDate = formatDate(endAt);
  const startTime = formatTime(startAt);
  const endTime = formatTime(endAt);
  const startLabel = startAt ? `${startDate} ${startTime}` : "";
  const endLabel = endAt ? `${endDate} ${endTime}` : "";
  const resourceName = booking.Resource?.name || booking.resource_name || "";
  const email = user.email || props.initialEmail || "";
  const phone = details.mobile_number || "";
  const company = details.company || "";

  return {
    booking_id: booking.id ?? "",
    booking_status: booking.status ?? "",
    user_name: fullName,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    mobile_number: phone,
    company,
    resource_name: resourceName,
    start: startLabel,
    end: endLabel,
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    "booking.id": booking.id ?? "",
    "booking.status": booking.status ?? "",
    "user.name": fullName,
    "user.first_name": firstName,
    "user.last_name": lastName,
    "user.email": email,
    "user.phone": phone,
    "user.company": company,
    "resource.name": resourceName,
    "booking.start": startLabel,
    "booking.end": endLabel,
    "booking.start_date": startDate,
    "booking.end_date": endDate,
    "booking.start_time": startTime,
    "booking.end_time": endTime,
  };
});

const replacePlaceholders = (text: string) => {
  if (!text) return "";
  return text.replace(/{{\s*([\w.]+)\s*}}/g, (match, key) => {
    const value =
      bookingPlaceholderData.value[
        key as keyof typeof bookingPlaceholderData.value
      ];
    return value == null || value === "" ? match : String(value);
  });
};

const canSend = computed(
  () =>
    Boolean(emailData.email?.trim()) &&
    Boolean(emailData.subject?.trim()) &&
    Boolean(emailData.rawBody?.trim()),
);

const previewContent = computed(() => {
  if (!emailData.rawBody) {
    return '<p class="text-slate-300 italic">Warte auf Inhalt...</p>';
  }
  return replacePlaceholders(emailData.rawBody);
});

const applyTemplate = () => {
  const t = templates.value.find(
    (temp) => temp.id === selectedTemplateId.value,
  );
  if (t) {
    emailData.subject = replacePlaceholders(t.subject || "");
    emailData.rawBody = replacePlaceholders(t.body || "");
  }
};

const fetchTemplates = async () => {
  loadingTemplates.value = true;
  try {
    const tRes = await api.emailService.getAll();
    templates.value = tRes?.data || tRes || [];
  } catch (err) {
    console.error("Fehler beim Laden der Vorlagen:", err);
  } finally {
    loadingTemplates.value = false;
  }
};

const handleSend = async () => {
  confirmSend.value = false;
  sending.value = true;
  try {
    const payload: Record<string, unknown> = {
      email: emailData.email,
      subject: emailData.subject,
      content: replacePlaceholders(emailData.rawBody),
      user_id: props.userId ?? null,
      booking_id: props.bookingId ?? null,
    };
    if (selectedTemplateId.value != null) {
      payload.template_id = selectedTemplateId.value;
    }

    const success = await api.emailService.sendCustomEmail(payload);
    if (success) {
      emit("success");
      emit("close");
    }
  } catch (err) {
    console.error("Fehler beim Senden:", err);
  } finally {
    sending.value = false;
  }
};

onMounted(fetchTemplates);
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.preview-container :deep(p) {
  margin-bottom: 1.25rem;
  line-height: 1.7;
  color: #334155;
}
.preview-container :deep(a) {
  color: #2563eb;
  text-decoration: underline;
  font-weight: 500;
}
.preview-container :deep(strong) {
  font-weight: 700;
  color: #0f172a;
}
</style>
