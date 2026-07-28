<template>
  <div class="space-y-6 pb-20">
    <div>
      <button
        type="button"
        class="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        @click="$router.push('/booking-system/users')"
      >
        <UiIcon name="i-lucide-chevron-left" class="size-4" />
        Zurück zur Übersicht
      </button>

      <div v-if="loading" class="py-12 text-center text-neutral-500">Lädt…</div>

      <template v-else-if="user">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div class="flex items-center gap-4 min-w-0">
            <div
              class="flex size-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white"
            >
              {{ avatarInitials }}
            </div>
            <div class="min-w-0">
              <h1 class="truncate text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">
                {{ displayName }}
              </h1>
              <p class="mt-0.5 truncate text-neutral-500">
                {{ user.email }}
                <span class="text-neutral-300">·</span>
                <span class="uppercase tracking-wide text-xs">{{ user.role || "user" }}</span>
                <template v-if="user.details?.user_type === 'COMPANY'">
                  <span class="text-neutral-300">·</span> Firma
                </template>
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div>
              <span class="text-neutral-500">Umsatz</span>
              <span class="ml-2 font-semibold text-neutral-900">{{ totalRevenue }} €</span>
            </div>
            <div>
              <span class="text-neutral-500">Buchungen</span>
              <span class="ml-2 font-semibold text-neutral-900">{{ user.Bookings?.length || 0 }}</span>
            </div>
            <button
              type="button"
              class="text-sm text-red-600 transition-colors hover:underline"
              @click="handleDeleteUser()"
            >
              Löschen
            </button>
          </div>
        </div>
      </template>
    </div>

    <template v-if="user && !loading">
      <div class="flex gap-1 overflow-x-auto border-b border-neutral-200">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="[
            'shrink-0 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === tab.id
              ? 'border-brand-accent text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-900',
          ]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div>
        <div v-if="activeTab === 'stammdaten'">
          <UserProfileCard
            :user="user"
            :show-identity="false"
            @update="handleUpdateUser"
          />
        </div>

        <div v-else-if="activeTab === 'bookings'">
          <UserBookingsHistory :bookings="user.Bookings" />
        </div>

        <div v-else-if="activeTab === 'invoices'">
          <UserInvoicesList
            :invoices="user.Invoices"
            @download="downloadInvoice"
          />
        </div>

        <div v-else-if="activeTab === 'communications'">
          <CommunicationHistory
            :user-id="user.id"
            show-booking-link
          />
        </div>

        <div v-else-if="activeTab === 'memberships'" class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-neutral-500">
              {{ user.UserMemberships?.length || 0 }} Mitgliedschaft(en)
            </p>
            <button
              type="button"
              class="btn-dialog-primary gap-2"
              @click="showMembershipModal = true"
            >
              <UiIcon name="i-lucide-plus" class="size-4" />
              Zuweisen
            </button>
          </div>

          <div
            v-if="!user.UserMemberships || user.UserMemberships.length === 0"
            class="py-12 text-center text-neutral-500"
          >
            Keine Mitgliedschaften vorhanden.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-neutral-200 text-neutral-500">
                  <th class="pb-3 pr-4 font-medium">Typ</th>
                  <th class="pb-3 pr-4 font-medium">Gültigkeit</th>
                  <th class="pb-3 pr-4 font-medium">Status</th>
                  <th class="pb-3 font-medium text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ms in user.UserMemberships"
                  :key="ms.id"
                  class="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
                >
                  <td class="py-4 pr-4 font-medium text-neutral-900">
                    {{ ms.MembershipType?.name }}
                  </td>
                  <td class="py-4 pr-4 text-neutral-500">
                    Ab
                    {{ new Date(ms.valid_from).toLocaleDateString("de-DE") }}
                    ·
                    <template v-if="ms.valid_until">
                      Bis
                      {{ new Date(ms.valid_until).toLocaleDateString("de-DE") }}
                    </template>
                    <template v-else>Unbegrenzt</template>
                  </td>
                  <td class="py-4 pr-4 text-neutral-700">Aktiv</td>
                  <td class="py-4 text-right">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center p-1.5 text-neutral-400 transition-colors hover:text-red-600"
                      title="Mitgliedschaft entfernen"
                      @click="removeMembership(ms.id)"
                    >
                      <IconTrash class="size-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if="activeTab === 'kontingente'" class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-neutral-500">
              {{ user.UserQuota?.length || 0 }} Kontingent(e)
            </p>
            <button
              type="button"
              class="btn-dialog-primary gap-2"
              @click="showQuotaModal = true"
            >
              <UiIcon name="i-lucide-plus" class="size-4" />
              Zuweisen
            </button>
          </div>

          <div
            v-if="!user.UserQuota || user.UserQuota.length === 0"
            class="py-12 text-center text-neutral-500"
          >
            Keine Kontingente vorhanden.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-neutral-200 text-neutral-500">
                  <th class="pb-3 pr-4 font-medium">Kontingent</th>
                  <th class="pb-3 pr-4 font-medium">Details</th>
                  <th class="pb-3 pr-4 font-medium">Gültigkeit</th>
                  <th class="pb-3 font-medium text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="quota in user.UserQuota"
                  :key="quota.id"
                  class="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
                >
                  <td class="py-4 pr-4 font-medium text-neutral-900">
                    {{ formatQuotaAvailable(quota) }}
                  </td>
                  <td class="py-4 pr-4 text-neutral-500">
                    <span v-if="quota.Resource?.name">{{ quota.Resource.name }}</span>
                    <span v-if="quota.PricingPlan?.name">
                      · {{ quota.PricingPlan.name }}
                    </span>
                    <span v-if="quota.purchase_booking_id"> · Mit Rechnung</span>
                    <span v-else-if="quota.notes"> · {{ quota.notes }}</span>
                    <span v-else> · Kostenlos zugewiesen</span>
                  </td>
                  <td class="py-4 pr-4 text-neutral-500">
                    <template v-if="quota.valid_until">
                      Bis
                      {{ new Date(quota.valid_until).toLocaleDateString("de-DE") }}
                    </template>
                    <template v-else>Unbegrenzt</template>
                  </td>
                  <td class="py-4 text-right">
                    <button
                      type="button"
                      class="inline-flex items-center justify-center p-1.5 text-neutral-400 transition-colors hover:text-red-600"
                      title="Kontingent entfernen"
                      @click="deleteQuota(quota.id)"
                    >
                      <IconTrash class="size-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="showMembershipModal"
      class="dialog-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="absolute inset-0"
        @click="showMembershipModal = false"
      ></div>
      <div class="dialog-panel max-w-md">
        <div class="dialog-header">
          <div class="min-w-0 flex-1">
            <h3 class="dialog-title">Mitgliedschaft zuweisen</h3>
            <p class="dialog-desc">
              Wählen Sie einen Typ und den Gültigkeitszeitraum.
            </p>
          </div>
          <button
            type="button"
            class="dialog-close"
            aria-label="Schließen"
            @click="showMembershipModal = false"
          >
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <form @submit.prevent="assignMembership">
          <div class="dialog-body space-y-4">
            <div>
              <label class="dialog-label">Typ</label>
              <select
                v-model="newMembership.type_id"
                required
                class="dialog-input"
              >
                <option :value="null" disabled>Bitte wählen...</option>
                <option
                  v-for="type in membershipTypes"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="dialog-label">Gültig ab</label>
              <input
                type="date"
                v-model="newMembership.valid_from"
                required
                class="dialog-input"
              />
            </div>
            <div>
              <label class="dialog-label">Gültig bis (Optional)</label>
              <input
                type="date"
                v-model="newMembership.valid_until"
                class="dialog-input"
                placeholder="Leer lassen für unbegrenzt"
              />
              <p class="mt-1 text-xs text-neutral-500">
                Leer lassen für unbegrenzte Gültigkeit.
              </p>
            </div>
          </div>

          <div class="dialog-footer">
            <button
              type="button"
              class="btn-dialog-cancel"
              @click="showMembershipModal = false"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="btn-dialog-primary"
              :disabled="!newMembership.type_id"
            >
              Zuweisen
            </button>
          </div>
        </form>
      </div>
    </div>

    <div
      v-if="showQuotaModal"
      class="dialog-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="absolute inset-0"
        @click="showQuotaModal = false"
      ></div>
      <div class="dialog-panel max-w-md">
        <div class="dialog-header">
          <div class="min-w-0 flex-1">
            <h3 class="dialog-title">Kontingent zuweisen</h3>
            <p class="dialog-desc">
              Kostenlos oder über ein bestehendes Kontingent-Paket mit Rechnung.
            </p>
          </div>
          <button
            type="button"
            class="dialog-close"
            aria-label="Schließen"
            @click="showQuotaModal = false"
          >
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <form @submit.prevent="assignQuota">
          <div class="dialog-body space-y-4">
            <div>
              <label class="dialog-label">Art der Zuweisung</label>
              <div class="flex rounded-none border border-neutral-200 overflow-hidden">
                <button
                  type="button"
                  @click="newQuota.mode = 'free'"
                  :class="[
                    'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                    newQuota.mode === 'free'
                      ? 'bg-brand-accent text-neutral-900'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50',
                  ]"
                >
                  Kostenlos
                </button>
                <button
                  type="button"
                  @click="newQuota.mode = 'paid'"
                  :class="[
                    'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                    newQuota.mode === 'paid'
                      ? 'bg-brand-accent text-neutral-900'
                      : 'bg-white text-neutral-700 hover:bg-neutral-50',
                  ]"
                >
                  Kostenpflichtig
                </button>
              </div>
            </div>

            <template v-if="newQuota.mode === 'free'">
              <div>
                <label class="dialog-label">Ressource</label>
                <select
                  v-model="newQuota.resource_id"
                  required
                  class="dialog-input"
                >
                  <option :value="null" disabled>Bitte wählen...</option>
                  <option
                    v-for="resource in resources"
                    :key="resource.id"
                    :value="resource.id"
                  >
                    {{ resource.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="dialog-label">Menge</label>
                <input
                  type="number"
                  v-model.number="newQuota.quota_amount"
                  min="1"
                  required
                  class="dialog-input"
                />
              </div>
              <div>
                <label class="dialog-label">Einheit</label>
                <select
                  v-model="newQuota.quota_unit"
                  class="dialog-input"
                >
                  <option value="BOOKINGS">Buchungen</option>
                  <option value="HOURS">Stunden</option>
                  <option value="DAYS">Tage</option>
                </select>
              </div>
              <div>
                <label class="dialog-label">Gültig ab</label>
                <input
                  type="date"
                  v-model="newQuota.valid_from"
                  required
                  class="dialog-input"
                />
              </div>
              <div>
                <label class="dialog-label">Gültig bis (Optional)</label>
                <input
                  type="date"
                  v-model="newQuota.valid_until"
                  class="dialog-input"
                />
              </div>
              <div>
                <label class="dialog-label">Notiz (Optional)</label>
                <input
                  type="text"
                  v-model="newQuota.notes"
                  class="dialog-input"
                  placeholder="z.B. Kulanz"
                />
              </div>
            </template>

            <template v-else>
              <div>
                <label class="dialog-label">Kontingent-Paket</label>
                <select
                  v-model="newQuota.pricing_plan_id"
                  required
                  class="dialog-input"
                >
                  <option :value="null" disabled>Bitte wählen...</option>
                  <option
                    v-for="plan in quotaPlans"
                    :key="plan.id"
                    :value="plan.id"
                  >
                    {{ plan.name }} ({{ plan.quota_amount }}x
                    {{ formatQuotaUnit(plan.quota_unit) }})
                  </option>
                </select>
                <p class="mt-1 text-xs text-neutral-500">
                  Erstellt automatisch eine Rechnung als Entwurf.
                </p>
              </div>
            </template>
          </div>

          <div class="dialog-footer">
            <button
              type="button"
              class="btn-dialog-cancel"
              @click="showQuotaModal = false"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="btn-dialog-primary"
              :disabled="!canAssignQuota"
            >
              Zuweisen
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import UserProfileCard from "@/components/users/UserProfileCard.vue";
import UserBookingsHistory from "@/components/users/UserBookingsHistory.vue";
import UserInvoicesList from "@/components/users/UserInvoicesList.vue";
import CommunicationHistory from "@/components/communication/CommunicationHistory.vue";

const api = useBookingApi();
const route = useRoute();
const router = useRouter();
const { confirm } = useConfirm();
const loading = ref(true);
const user = ref<any>(null);
const activeTab = ref("stammdaten");
const showMembershipModal = ref(false);
const showQuotaModal = ref(false);
const membershipTypes = ref<any[]>([]);
const resources = ref<any[]>([]);
const pricingPlans = ref<any[]>([]);

const tabs = [
  { id: "stammdaten", label: "Stammdaten" },
  { id: "bookings", label: "Buchungen" },
  { id: "invoices", label: "Rechnungen" },
  { id: "communications", label: "Kommunikation" },
  { id: "memberships", label: "Mitgliedschaften" },
  { id: "kontingente", label: "Kontingente" },
];

const newMembership = ref({
  type_id: null,
  valid_from: new Date().toISOString().split("T")[0],
  valid_until: "",
});

const newQuota = ref({
  mode: "free" as "free" | "paid",
  resource_id: null as number | null,
  quota_amount: 1,
  quota_unit: "DAYS",
  valid_from: new Date().toISOString().split("T")[0],
  valid_until: "",
  notes: "",
  pricing_plan_id: null as number | null,
});

const displayName = computed(() => {
  if (!user.value) return "Nutzerprofil";
  const details = user.value.details;
  if (details?.user_type === "COMPANY" && details.company) {
    return details.company;
  }
  const name = `${details?.first_name || ""} ${details?.last_name || ""}`.trim();
  return name || user.value.username || "Nutzerprofil";
});

const avatarInitials = computed(() => {
  if (!user.value) return "?";
  const details = user.value.details;
  if (details?.first_name || details?.last_name) {
    return `${details.first_name?.charAt(0) || ""}${details.last_name?.charAt(0) || ""}`.toUpperCase();
  }
  const source = user.value.username || user.value.email || "?";
  return source.substring(0, 2).toUpperCase();
});

const quotaPlans = computed(() =>
  pricingPlans.value.filter(
    (plan) => plan.quota_amount && Number(plan.quota_amount) > 0,
  ),
);

const canAssignQuota = computed(() => {
  if (newQuota.value.mode === "free") {
    return Boolean(newQuota.value.resource_id && newQuota.value.quota_amount);
  }
  return Boolean(newQuota.value.pricing_plan_id);
});

const formatQuotaUnit = (unit?: string) => {
  if (unit === "HOURS") return "Stunden";
  if (unit === "DAYS") return "Tage";
  return "Buchungen";
};

const formatQuotaAvailable = (quota: any) => {
  const available =
    Number(quota.quota_amount) - Number(quota.used_amount || 0);
  return `${available}x ${formatQuotaUnit(quota.quota_unit)} verfügbar`;
};

const totalRevenue = computed(() => {
  if (!user.value?.Invoices) return "0.00";
  const sum = user.value.Invoices.reduce(
    (acc: number, inv: any) =>
      acc + (inv.status === "PAID" ? parseFloat(inv.total_amount || 0) : 0),
    0,
  );
  return sum.toFixed(2);
});

const loadUser = async () => {
  loading.value = true;
  try {
    const userId = route.params.id;
    const data = await api.users.getOne(userId);
    if (data) user.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const loadMembershipTypes = async () => {
  try {
    const types = await api.memberships.getTypes();
    if (types) {
      membershipTypes.value = types;
    }
  } catch (e) {
    console.error("Fehler beim Laden der M-Typen", e);
  }
};

const loadQuotaFormData = async () => {
  try {
    const [resourceList, planList] = await Promise.all([
      api.resources.getAll(),
      api.pricing.getAll(),
    ]);
    if (resourceList) resources.value = resourceList;
    if (planList) pricingPlans.value = planList;
  } catch (e) {
    console.error("Fehler beim Laden der Kontingent-Daten", e);
  }
};

const assignQuota = async () => {
  try {
    const payload =
      newQuota.value.mode === "free"
        ? {
            user_id: user.value.id,
            mode: "free" as const,
            resource_id: newQuota.value.resource_id,
            quota_amount: newQuota.value.quota_amount,
            quota_unit: newQuota.value.quota_unit,
            valid_from: newQuota.value.valid_from,
            valid_until: newQuota.value.valid_until || null,
            notes: newQuota.value.notes || undefined,
          }
        : {
            user_id: user.value.id,
            mode: "paid" as const,
            pricing_plan_id: newQuota.value.pricing_plan_id,
          };

    const result = await api.quotas.assign(payload);
    if (result) {
      showQuotaModal.value = false;
      newQuota.value = {
        mode: "free",
        resource_id: null,
        quota_amount: 1,
        quota_unit: "BOOKINGS",
        valid_from: new Date().toISOString().split("T")[0],
        valid_until: "",
        notes: "",
        pricing_plan_id: null,
      };
      await loadUser();
    }
  } catch (e) {
    console.error(e);
  }
};

const assignMembership = async () => {
  try {
    const result = await api.memberships.assign({
      user_id: user.value.id,
      membership_type_id: newMembership.value.type_id,
      valid_from: newMembership.value.valid_from,
      valid_until: newMembership.value.valid_until || null,
    });

    if (result) {
      showMembershipModal.value = false;
      newMembership.value = {
        type_id: null,
        valid_from: new Date().toISOString().split("T")[0],
        valid_until: "",
      };
      await loadUser();
    }
  } catch (e: any) {
    console.error(e);
  }
};

const removeMembership = async (membershipId: number) => {
  if (!confirm("Möchten Sie diese Mitgliedschaft wirklich entfernen?")) return;

  try {
    const success = await api.memberships.removeAssignment(membershipId);
    if (success) {
      await loadUser();
    }
  } catch (e) {
    console.error(e);
  }
};

const handleUpdateUser = async (updatedData: any) => {
  try {
    await api.users.update(updatedData.id, updatedData);
    await loadUser();
  } catch (e) {
    // Error handled by composable
  }
};

const handleDeleteUser = async () => {
  const displayName =
    user.value?.details?.company ||
    [user.value?.details?.first_name, user.value?.details?.last_name]
      .filter(Boolean)
      .join(" ") ||
    user.value?.username ||
    "diesen Benutzer";

  const confirmed = await confirm({
    title: "Benutzer löschen",
    message: `Möchten Sie „${displayName}“ wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
    variant: "danger",
    confirmLabel: "Ja, löschen",
    icon: "i-heroicons-trash-20-solid",
  });
  if (!confirmed) return;

  try {
    const userId = route.params.id;
    await api.users.delete(userId);
    router.push("/booking-system/users");
  } catch (e) {
    window.alert(
      "Benutzer konnte nicht gelöscht werden. Es kann daran liegen, das es versendete Rechnungen gibt.",
    );
  }
};

const downloadInvoice = async (invoiceId: number) => {
  try {
    const blob = await api.sales.downloadInvoice(invoiceId);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Rechnung_${invoiceId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    // Error handled by composable
  }
};

const deleteQuota = async (id: number) => {
  if (!confirm("Möchten Sie dieses Kontingent wirklich entfernen?")) return;

  try {
    await api.quotas.delete(id);
    await loadUser();
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  loadUser();
  loadMembershipTypes();
  loadQuotaFormData();
});
</script>
