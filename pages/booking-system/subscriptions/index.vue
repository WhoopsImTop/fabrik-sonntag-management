<template>
  <div class="space-y-6">
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
          Abonnements
        </h1>
        <p class="text-neutral-500 mt-1">
          Verwalten Sie wiederkehrende Rechnungen und Langzeitmieten.
        </p>
      </div>
      <button
        @click="router.push('/booking-system/subscriptions/new')"
        class="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-none hover:bg-neutral-800 transition-colors shadow-sm"
      >
        <svg
          class="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Neues Abo
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <p class="text-sm font-medium text-neutral-500">Aktive Abos</p>
        <h3 class="text-2xl font-bold text-neutral-900 mt-1">
          {{ activeCount }}
        </h3>
      </div>
      <div class="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <p class="text-sm font-medium text-neutral-500">Monatliches Volumen</p>
        <h3 class="text-2xl font-bold text-neutral-900 mt-1">
          €{{ formatMoney(monthlyVolume) }}
        </h3>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <span
          class="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Abos suchen..."
          class="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>
      <select
        v-model="statusFilter"
        class="px-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
      >
        <option value="all">Alle Status</option>
        <option value="ACTIVE">Aktiv</option>
        <option value="PAUSED">Pausiert</option>
        <option value="CANCELLED">Beendet</option>
      </select>
    </div>

    <div class="w-full overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Beschreibung</th>
            <th class="pb-3 pr-4 font-medium">Kunde</th>
            <th class="pb-3 pr-4 font-medium">Intervall</th>
            <th class="pb-3 pr-4 font-medium">Nächste Abrechnung</th>
            <th class="pb-3 pr-4 font-medium">Status</th>
            <th class="pb-3 font-medium text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="py-12 text-center text-neutral-500">Lädt…</td>
          </tr>
          <tr v-else-if="filteredSubscriptions.length === 0">
            <td colspan="6" class="py-12 text-center text-neutral-500">
              Keine Abonnements vorhanden
            </td>
          </tr>
          <tr
            v-for="sub in filteredSubscriptions"
            :key="sub.id"
            class="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
          >
            <td class="py-4 pr-4 font-medium text-neutral-900">
              {{ sub.description || "Ohne Titel" }}
              <div
                class="text-xs text-neutral-500 font-normal mt-0.5"
                v-if="sub.LineItems?.length"
              >
                {{ sub.LineItems.length }} Positionen
              </div>
            </td>
            <td class="py-4 pr-4 text-neutral-900">
              {{
                sub.User?.details?.company ||
                `${sub.User?.details?.first_name ?? ""} ${sub.User?.details?.last_name ?? ""}`.trim() ||
                "Unbekannt"
              }}
              <div class="text-xs text-neutral-500">{{ sub.User?.email }}</div>
            </td>
            <td class="py-4 pr-4 text-neutral-700">
              {{ sub.interval }}
            </td>
            <td class="py-4 pr-4 text-neutral-900">
              {{ formatDate(sub.next_billing_date) }}
            </td>
            <td class="py-4 pr-4">
              <span :class="getStatusClass(sub.status)">
                {{ getStatusLabel(sub.status) }}
              </span>
            </td>
            <td class="py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  @click="router.push(`/booking-system/subscriptions/${sub.id}`)"
                  class="text-brand-accent hover:underline"
                >
                  Bearbeiten
                </button>

                <button
                  v-if="sub.status === 'ACTIVE'"
                  @click="cancelSubscription(sub)"
                  class="text-amber-600 hover:underline"
                  title="Abo beenden"
                >
                  Beenden
                </button>

                <button
                  @click="deleteSubscription(sub.id)"
                  class="text-red-600 hover:text-red-700"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

// Router importieren für die Navigation
const router = useRouter();
const api = useBookingApi();
const { confirm } = useConfirm();

// State
const loading = ref(true);
const subscriptions = ref<any[]>([]);
const searchQuery = ref("");
const statusFilter = ref("all");

// --- Computed ---
const activeCount = computed(
  () => subscriptions.value.filter((s) => s.status === "ACTIVE").length,
);
const filteredSubscriptions = computed(() => {
  let list = subscriptions.value;
  if (statusFilter.value !== "all") {
    list = list.filter((s) => s.status === statusFilter.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (s) =>
        s.description?.toLowerCase().includes(q) ||
        s.User?.username?.toLowerCase().includes(q) ||
        s.User?.email?.toLowerCase().includes(q),
    );
  }
  return list;
});

const monthlyVolume = computed(() => {
  return subscriptions.value
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, sub) => {
      const subTotal =
        sub.LineItems?.reduce(
          (iSum: number, item: any) =>
            iSum + Number(item.amount) * Number(item.quantity),
          0,
        ) || 0;
      const factor = sub.interval === "YEARLY" ? 1 / 12 : 1;
      return sum + subTotal * factor;
    }, 0);
});

// --- Helpers ---
const formatMoney = (val: any) => Number(val || 0).toFixed(2);
const formatDate = (date: string) =>
  date ? new Date(date).toLocaleDateString("de-DE") : "-";

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: "text-emerald-600",
    PAUSED: "text-amber-600",
    CANCELLED: "text-neutral-400",
  };
  return map[status] || "text-neutral-500";
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    ACTIVE: "Aktiv",
    PAUSED: "Pausiert",
    CANCELLED: "Beendet",
  };
  return map[status] || status;
};

// --- Actions ---
const loadData = async () => {
  loading.value = true;
  try {
    const subsData = await api.subscriptions.getAll();
    subscriptions.value = subsData || [];
  } finally {
    loading.value = false;
  }
};

// HIER WURDEN MODAL-FUNKTIONEN (openModal, save, addItem etc.) ENTFERNT

const cancelSubscription = async (sub: any) => {
  const confirmed = await confirm({
    title: "Abo beenden",
    message:
      'Möchten Sie dieses Abo wirklich beenden? Der Status wird auf "Beendet" gesetzt.',
    variant: "warning",
    confirmLabel: "Ja, beenden",
    icon: "i-heroicons-exclamation-triangle-20-solid",
  });
  if (!confirmed) return;

  await api.subscriptions.update(sub.id, { status: "CANCELLED" });
  await loadData();
};

const deleteSubscription = async (id: number) => {
  const confirmed = await confirm({
    title: "Abo löschen",
    message: "Achtung: Soll das Abo wirklich gelöscht werden?",
    variant: "danger",
    confirmLabel: "Ja, löschen",
    icon: "i-heroicons-trash-20-solid",
  });
  if (!confirmed) return;

  await api.subscriptions.delete(id);
  await loadData();
};

onMounted(() => {
  loadData();
});
</script>
