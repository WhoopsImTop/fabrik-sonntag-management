<template>
  <div
    role="region"
    aria-label="Fabrik Sonntag Widget"
    class="w-[385px] max-w-full bg-white text-neutral-900 p-4 rounded-lg border border-neutral-200 relative shadow-sm sm:w-[385px]"
  >
    <main class="pt-1">
      <div v-if="!success">
        <form
          @submit.prevent="handleFinalSubmit"
          novalidate
          class="flex flex-col space-y-3"
        >
          <!-- Step 1: type + names + email -->
          <fieldset v-show="step === 0" class="space-y-4 mb-0">
            <label class="block text-xs text-neutral-700"
              >Anfrage für <span class="text-red-500">*</span>
              <select
                v-model="form.type"
                aria-label="Anfrage für"
                class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs placeholder-neutral-400 bg-white"
              >
                <option>Coworking Space</option>
                <option>Teamoffice</option>
                <option>Meetingraum</option>
                <option>Event Location</option>
              </select>
            </label>

            <div class="grid grid-cols-2 gap-2">
              <label class="block text-xs text-neutral-700"
                >Vorname <span class="text-red-500">*</span>
                <input
                  v-model="form.firstName"
                  required
                  placeholder="Max"
                  autofocus
                  @input="clearError('firstName')"
                  class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
                />
                <p v-if="errors.firstName" class="mt-1 text-xs text-red-600">
                  {{ errors.firstName }}
                </p>
              </label>
              <label class="block text-xs text-neutral-700"
                >Nachname <span class="text-red-500">*</span>
                <input
                  v-model="form.lastName"
                  required
                  placeholder="Mustermann"
                  @input="clearError('lastName')"
                  class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
                />
                <p v-if="errors.lastName" class="mt-1 text-xs text-red-600">
                  {{ errors.lastName }}
                </p>
              </label>
            </div>

            <label class="block text-xs text-neutral-700"
              >E‑Mail <span class="text-red-500">*</span>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="name@beispiel.de"
                @input="clearError('email')"
                class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
              />
              <p v-if="errors.email" class="mt-1 text-xs text-red-600">
                {{ errors.email }}
              </p>
            </label>

            <div class="flex flex-col justify-end items-center">
              <button
                type="button"
                @click="nextStep"
                class="px-3 py-1.5 text-sm rounded-full w-full text-center text-white font-bold shadow-lg border-2 border-transparent bg-[#0387d4] hover:-translate-y-0.5 transition-all hover:shadow-xl duration-150 cursor-pointer"
              >
                Weiter
              </button>
            </div>
          </fieldset>

          <!-- Step 2: address + message -->
          <fieldset v-show="step === 1" class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <label class="block text-xs text-neutral-700"
                >Straße <span class="text-red-500">*</span>
                <input
                  v-model="form.street"
                  required
                  placeholder="Musterstraße"
                  @input="clearError('street')"
                  class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
                />
                <p v-if="errors.street" class="mt-1 text-xs text-red-600">
                  {{ errors.street }}
                </p>
              </label>
              <label class="block text-xs text-neutral-700"
                >Hausnr. <span class="text-red-500">*</span>
                <input
                  v-model="form.houseNumber"
                  required
                  placeholder="12a"
                  @input="clearError('houseNumber')"
                  class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
                />
                <p v-if="errors.houseNumber" class="mt-1 text-xs text-red-600">
                  {{ errors.houseNumber }}
                </p>
              </label>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <label class="block text-xs text-neutral-700"
                >PLZ <span class="text-red-500">*</span>
                <input
                  v-model="form.zip"
                  required
                  placeholder="12345"
                  @input="clearError('zip')"
                  class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
                />
                <p v-if="errors.zip" class="mt-1 text-xs text-red-600">
                  {{ errors.zip }}
                </p>
              </label>
              <label class="block text-xs text-neutral-700"
                >Ort <span class="text-red-500">*</span>
                <input
                  v-model="form.city"
                  required
                  placeholder="Stadt"
                  @input="clearError('city')"
                  class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
                />
                <p v-if="errors.city" class="mt-1 text-xs text-red-600">
                  {{ errors.city }}
                </p>
              </label>
            </div>

            <label class="block text-xs text-neutral-700"
              >Nachricht (optional)
              <textarea
                v-model="form.message"
                rows="3"
                placeholder="Wie können wir helfen?"
                class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
              ></textarea>
            </label>

            <div class="flex flex-col justify-end items-center">
              <button
                type="button"
                @click="nextStep"
                class="px-3 py-1.5 text-sm rounded-full w-full text-center text-white font-bold shadow-lg border-2 border-transparent bg-[#0387d4] hover:-translate-y-0.5 transition-all hover:shadow-xl duration-150 cursor-pointer"
              >
                Weiter
              </button>
            </div>
          </fieldset>

          <!-- Step 3: dates (if needed) + review and submit -->
          <fieldset v-show="step === 2" class="space-y-3">
            <div v-if="needsDateRange" class="grid grid-cols-2 gap-2">
              <label class="block text-xs text-neutral-700"
                >Start
                <input
                  v-model="form.start"
                  type="datetime-local"
                  class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
                />
              </label>
              <label class="block text-xs text-neutral-700"
                >Ende
                <input
                  v-model="form.end"
                  type="datetime-local"
                  class="mt-1 block w-full rounded-md border border-neutral-200 px-3 py-2 text-xs"
                />
              </label>
            </div>

            <div class="bg-neutral-50 p-3 rounded-md text-xs text-neutral-700">
              <div class="mb-2"><strong>Typ:</strong> {{ form.type }}</div>
              <div class="mb-2">
                <strong>Name:</strong> {{ form.firstName }} {{ form.lastName }}
              </div>
              <div class="mb-2"><strong>E‑Mail:</strong> {{ form.email }}</div>
              <div class="mb-2">
                <strong>Adresse:</strong> {{ form.street }}
                {{ form.houseNumber }}, {{ form.zip }} {{ form.city }}
              </div>
              <div v-if="form.message" class="mb-2">
                <strong>Nachricht:</strong> {{ form.message }}
              </div>
              <div v-if="form.start || form.end" class="mb-0">
                <strong>Zeitraum:</strong> {{ form.start || "-" }} —
                {{ form.end || "-" }}
              </div>
            </div>

            <div class="flex flex-col justify-end items-center">
              <button
                type="submit"
                :disabled="submitting"
                class="px-3 py-1.5 text-sm rounded-full w-full text-center text-white font-bold shadow-lg border-2 border-transparent bg-[#0387d4] hover:-translate-y-0.5 transition-all hover:shadow-xl duration-150 cursor-pointer"
              >
                {{ submitting ? "Sende..." : "Senden" }}
              </button>
              <span class="text-xs text-gray-400 flex items-center mt-3"
                ><img src="../../public/lock.svg" alt="Lock Icon" class="h-4" />
                Sichere und verschlüsselte Datenübertragung
              </span>
            </div>
          </fieldset>

          <p v-if="error" class="text-xs text-red-600" role="alert">
            {{ error }}
          </p>
        </form>

        <!-- loading skeleton overlay when submitting -->
        <div
          v-if="submitting"
          class="absolute inset-0 bg-white/80 p-3 flex flex-col gap-3"
          aria-hidden="true"
        >
          <div class="flex gap-2">
            <div class="h-3 bg-neutral-200 rounded flex-1 animate-pulse"></div>
            <div class="h-3 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
          </div>
          <div class="h-3 bg-neutral-200 rounded animate-pulse"></div>
          <div class="flex gap-2">
            <div class="h-3 bg-neutral-200 rounded flex-1 animate-pulse"></div>
            <div class="h-3 bg-neutral-200 rounded flex-1 animate-pulse"></div>
          </div>
          <div class="h-3 bg-neutral-200 rounded animate-pulse"></div>
        </div>
      </div>

      <!-- Success screen -->
      <div v-else class="flex flex-col items-center gap-3 p-4">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" fill="#10B981" opacity="0.12" />
          <path
            d="M7 13l3 3 7-7"
            stroke="#059669"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <h4 class="text-lg font-semibold">
          Danke — Ihre Anfrage wurde gesendet
        </h4>
        <p class="text-xs text-neutral-600">
          Wir haben Ihre Anfrage erhalten und melden uns so schnell wie möglich.
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted } from "vue";

const props = defineProps({
  apiUrl: { type: String, default: "" },
  origin: { type: String, default: "*" },
});

const form = reactive({
  type: "Coworking Space",
  firstName: "",
  lastName: "",
  email: "",
  street: "",
  houseNumber: "",
  zip: "",
  city: "",
  message: "",
  start: "",
  end: "",
});

const submitting = ref(false);
const error = ref("");
const success = ref("");
const errors = reactive({
  firstName: "",
  lastName: "",
  email: "",
  street: "",
  houseNumber: "",
  zip: "",
  city: "",
});

const step = ref(0);

const needsDateRange = computed(() => {
  return ["Coworking Space", "Meetingraum", "Event Location"].includes(
    form.type
  );
});

function validateStep(curr) {
  // clear field errors
  Object.keys(errors).forEach((k) => (errors[k] = ""));
  error.value = "";
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let ok = true;
  if (curr === 0) {
    if (!form.firstName) {
      errors.firstName = "Vorname erforderlich";
      ok = false;
    }
    if (!form.lastName) {
      errors.lastName = "Nachname erforderlich";
      ok = false;
    }
    if (!form.email) {
      errors.email = "E‑Mail erforderlich";
      ok = false;
    } else if (!emailRe.test(form.email)) {
      errors.email = "Ungültige E‑Mail";
      ok = false;
    }
  }
  if (curr === 1) {
    if (!form.street) {
      errors.street = "Straße erforderlich";
      ok = false;
    }
    if (!form.houseNumber) {
      errors.houseNumber = "Hausnummer erforderlich";
      ok = false;
    }
    if (!form.zip) {
      errors.zip = "PLZ erforderlich";
      ok = false;
    }
    if (!form.city) {
      errors.city = "Ort erforderlich";
      ok = false;
    }
  }
  return ok;
}

function nextStep() {
  if (!validateStep(step.value)) return;
  step.value = Math.min(2, step.value + 1);
  postHeight();
}

function prevStep() {
  error.value = "";
  step.value = Math.max(0, step.value - 1);
  postHeight();
}

function clearError(field) {
  if (errors[field]) errors[field] = "";
  if (error.value) error.value = "";
}

async function handleFinalSubmit() {
  // final validation across steps
  if (!validateStep(0) || !validateStep(1)) return;
  submitting.value = true;
  success.value = "";

  const payload = {
    type: form.type,
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email,
    street: form.street,
    houseNumber: form.houseNumber,
    zip: form.zip,
    city: form.city,
    message: form.message,
    start: form.start || null,
    end: form.end || null,
    sentAt: new Date().toISOString(),
  };

  try {
    if (props.apiUrl) {
      const res = await fetch(props.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Server antwortete mit einem Fehler");
      success.value = "Vielen Dank — Ihre Anfrage wurde versendet.";
      // notify parent with result
      window.parent?.postMessage(
        { type: "fs-embed-result", status: "success" },
        props.origin || "*"
      );
    } else {
      // default: send to n8n webhook with Basic Auth
      const webhookUrl =
        "https://n8n.fabrik-sonntag.de/webhook-test/37cd6dfe-40bb-403b-84b8-ba4a9927bd89";
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Server antwortete mit einem Fehler");
      success.value = "Vielen Dank — Ihre Anfrage wurde versendet.";
      // notify parent with result
      window.parent?.postMessage(
        { type: "fs-embed-result", status: "success", via: "webhook" },
        props.origin || "*"
      );
    }
    // sende height update nach erfolgreichem submit
    postHeight();
  } catch (e) {
    error.value = e.message || String(e);
    window.parent?.postMessage(
      { type: "fs-embed-result", status: "error", message: error.value },
      props.origin || "*"
    );
  } finally {
    submitting.value = false;
  }
}

function postHeight() {
  if (typeof window === "undefined" || !window.parent) return;
  const height =
    document.documentElement.scrollHeight || document.body.scrollHeight;
  window.parent.postMessage(
    { type: "fs-embed-height", height },
    props.origin || "*"
  );
}

// notify parent about size on mount and when form changes
onMounted(() => {
  postHeight();
});

watch(
  form,
  () => {
    postHeight();
  },
  { deep: true }
);

function resetForm() {
  // reset fields but keep type
  const t = form.type;
  form.type = t;
  form.firstName = "";
  form.lastName = "";
  form.email = "";
  form.street = "";
  form.houseNumber = "";
  form.zip = "";
  form.city = "";
  form.message = "";
  form.start = "";
  form.end = "";
  error.value = "";
  success.value = "";
  step.value = 0;
  postHeight();
}

function closeWidget() {
  // if embedded via iframe, ask parent to close/hide
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "fs-embed-close" }, props.origin || "*");
  }
}
</script>
