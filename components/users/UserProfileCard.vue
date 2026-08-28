<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3
        v-if="showIdentity"
        class="text-lg font-semibold text-neutral-900 tracking-tight"
      >
        Stammdaten
      </h3>
      <p v-else class="text-sm text-neutral-500">Kontaktdaten und Adresse</p>
      <button
        type="button"
        class="text-sm font-medium text-brand-accent hover:underline"
        @click="isEditing = !isEditing"
      >
        {{ isEditing ? "Abbrechen" : "Bearbeiten" }}
      </button>
    </div>

    <div v-if="!isEditing" class="space-y-6">
      <div v-if="showIdentity" class="flex items-center gap-4">
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white"
        >
          {{ getInitials(user.username) }}
        </div>
        <div>
          <h2 class="text-lg font-bold text-neutral-900">
            {{
              user.details?.user_type === "COMPANY" && user.details.company
                ? user.details.company
                : (user.details?.first_name || "") +
                  " " +
                  (user.details?.last_name || "")
            }}
          </h2>
          <div class="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
            <span class="uppercase tracking-wide">{{ user.role || "user" }}</span>
            <span v-if="user.details?.user_type === 'COMPANY'">· Firma</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <div v-if="user.details?.user_type === 'PERSON'">
          <p class="text-xs font-medium text-neutral-500">Vorname</p>
          <p class="mt-0.5 text-neutral-900">
            {{ user.details?.first_name || "—" }}
          </p>
        </div>
        <div v-if="user.details?.user_type === 'PERSON'">
          <p class="text-xs font-medium text-neutral-500">Nachname</p>
          <p class="mt-0.5 text-neutral-900">
            {{ user.details?.last_name || "—" }}
          </p>
        </div>
        <div
          v-if="
            user.details?.user_type === 'COMPANY' &&
            (user.details?.first_name || user.details?.last_name)
          "
          class="sm:col-span-2"
        >
          <p class="text-xs font-medium text-neutral-500">Ansprechpartner</p>
          <p class="mt-0.5 text-neutral-900">
            {{ user.details?.first_name || "" }}
            {{ user.details?.last_name || "" }}
          </p>
        </div>
        <div
          v-if="
            user.details?.company && user.details?.user_type !== 'COMPANY'
          "
        >
          <p class="text-xs font-medium text-neutral-500">Firma</p>
          <p class="mt-0.5 text-neutral-900">{{ user.details.company }}</p>
        </div>
        <div>
          <p class="text-xs font-medium text-neutral-500">E-Mail</p>
          <p class="mt-0.5 text-neutral-900">
            <a
              v-if="user.email"
              :href="'mailto:' + user.email"
              class="hover:text-brand-accent"
              >{{ user.email }}</a
            >
            <span v-else>—</span>
          </p>
        </div>
        <div>
          <p class="text-xs font-medium text-neutral-500">Mobilnummer</p>
          <p class="mt-0.5 text-neutral-900">
            <a
              v-if="user.details?.mobile_number"
              :href="'tel:' + user.details.mobile_number"
              class="hover:text-brand-accent"
              >{{ user.details.mobile_number }}</a
            >
            <span v-else>—</span>
          </p>
        </div>
        <div>
          <p class="text-xs font-medium text-neutral-500">Adresse</p>
          <p class="mt-0.5 text-neutral-900">
            <template
              v-if="
                user.details?.street ||
                user.details?.house_number ||
                user.details?.zip_code ||
                user.details?.city
              "
            >
              {{ user.details?.street || "" }}
              {{ user.details?.house_number || "" }}<br />
              {{ user.details?.zip_code || "" }}
              {{ user.details?.city || "" }}
              <template v-if="user.details?.country">
                <br />{{ user.details.country }}
              </template>
            </template>
            <span v-else>—</span>
          </p>
        </div>
        <div>
          <p class="text-xs font-medium text-neutral-500">
            Ansprechpartner auf Rechnung
          </p>
          <p class="mt-0.5 text-neutral-900">
            {{ user.details?.display_contact_person ? "Ja" : "Nein" }}
          </p>
        </div>
        <div v-if="user.details?.vat_number">
          <p class="text-xs font-medium text-neutral-500">USt-IdNr.</p>
          <p class="mt-0.5 text-neutral-900">{{ user.details.vat_number }}</p>
        </div>
        <div v-if="user.details?.debitor_number">
          <p class="text-xs font-medium text-neutral-500">Debitorennummer</p>
          <p class="mt-0.5 text-neutral-900">
            {{ user.details.debitor_number }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium text-neutral-500">Mitglied seit</p>
          <p class="mt-0.5 text-neutral-900">{{ formatDate(user.createdAt) }}</p>
        </div>
      </div>
    </div>

    <form v-else @submit.prevent="saveUser" class="space-y-4">
      <div>
        <label class="dialog-label">Kontotyp</label>
        <div class="flex rounded-none border border-neutral-200 overflow-hidden max-w-xs">
          <button
            type="button"
            @click="form.user_type = 'PERSON'"
            :class="[
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              form.user_type === 'PERSON'
                ? 'bg-brand-accent text-neutral-900'
                : 'bg-white text-neutral-700 hover:bg-neutral-50',
            ]"
          >
            Person
          </button>
          <button
            type="button"
            @click="form.user_type = 'COMPANY'"
            :class="[
              'flex-1 px-4 py-2 text-sm font-medium transition-colors',
              form.user_type === 'COMPANY'
                ? 'bg-brand-accent text-neutral-900'
                : 'bg-white text-neutral-700 hover:bg-neutral-50',
            ]"
          >
            Firma
          </button>
        </div>
      </div>

      <div>
        <label class="dialog-label"
          >Ansprechpartner auf Rechnung einblenden</label
        >
        <ToggleButton
          v-model="form.display_contact_person"
          :labels="{ checked: 'Ja', unchecked: 'Nein' }"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="dialog-label">{{
            form.user_type === "COMPANY" ? "Ansprechpartner Vorname" : "Vorname"
          }}</label>
          <input v-model="form.first_name" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">{{
            form.user_type === "COMPANY"
              ? "Ansprechpartner Nachname"
              : "Nachname"
          }}</label>
          <input v-model="form.last_name" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">{{
            form.user_type === "COMPANY"
              ? "Ansprechpartner Telefon"
              : "Telefonnummer"
          }}</label>
          <input v-model="form.mobile_number" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label"
            >Firma {{ form.user_type === "COMPANY" ? "" : "(optional)" }}</label
          >
          <input
            v-model="form.company"
            :required="form.user_type === 'COMPANY'"
            class="dialog-input"
            :placeholder="
              form.user_type === 'COMPANY'
                ? 'Firmenname (Pflicht)'
                : 'Firma (optional)'
            "
          />
        </div>
        <div v-if="form.user_type === 'COMPANY'">
          <label class="dialog-label">USt-IdNr.</label>
          <input
            v-model="form.vat_number"
            class="dialog-input"
            placeholder="DE123456789"
          />
        </div>
        <div>
          <label class="dialog-label">Straße</label>
          <input v-model="form.street" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">Hausnummer</label>
          <input v-model="form.house_number" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">Postleitzahl</label>
          <input v-model="form.zip_code" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">Stadt</label>
          <input v-model="form.city" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">Land</label>
          <input v-model="form.country" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">E-Mail</label>
          <input v-model="form.email" type="email" class="dialog-input" />
        </div>
        <div>
          <label class="dialog-label">Rolle</label>
          <select v-model="form.role" class="dialog-input">
            <option value="user">User</option>
            <option value="tenant">Mieter (Heizung)</option>
            <option value="sachbearbeiter">Sachbearbeiter</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label class="dialog-label">Debitoren Nummer</label>
          <input
            v-model="form.debitor_number"
            type="text"
            class="dialog-input"
          />
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="btn-dialog-cancel"
          @click="isEditing = false"
        >
          Abbrechen
        </button>
        <button type="submit" :disabled="loading" class="btn-dialog-primary">
          {{ loading ? "Speichert..." : "Speichern" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import ToggleButton from "@/components/users/ToggleButton.vue";

const props = withDefaults(
  defineProps<{ user: any; showIdentity?: boolean }>(),
  { showIdentity: true },
);
const emit = defineEmits(["update"]);

const isEditing = ref(false);
const loading = ref(false);
const form = ref({
  first_name: "",
  last_name: "",
  company: "",
  mobile_number: "",
  street: "",
  house_number: "",
  zip_code: "",
  city: "",
  country: "",
  email: "",
  role: "",
  debitor_number: "",
  user_type: "PERSON" as "PERSON" | "COMPANY",
  vat_number: "",
  display_contact_person: false,
});

watch(
  () => props.user,
  (u) => {
    if (u)
      form.value = {
        first_name: u?.details?.first_name ?? "",
        last_name: u?.details?.last_name ?? "",
        company: u?.details?.company ?? "",
        mobile_number: u?.details?.mobile_number ?? "",
        street: u?.details?.street ?? "",
        house_number: u?.details?.house_number ?? "",
        zip_code: u?.details?.zip_code ?? "",
        city: u?.details?.city ?? "",
        country: u?.details?.country ?? "",
        email: u.email,
        role: u.role,
        debitor_number: u?.details?.debitor_number ?? "",
        user_type: u?.details?.user_type ?? "PERSON",
        vat_number: u?.details?.vat_number ?? "",
        display_contact_person: u?.details?.display_contact_person ?? false,
      };
  },
  { immediate: true },
);

const getInitials = (n: string) => (n ? n.substring(0, 2).toUpperCase() : "?");
const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE");

const saveUser = async () => {
  loading.value = true;
  try {
    await emit("update", { id: props.user.id, ...form.value });
    isEditing.value = false;
  } finally {
    loading.value = false;
  }
};
</script>
