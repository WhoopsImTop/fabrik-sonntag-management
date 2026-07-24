<template>
  <div class="space-y-6 pb-20">
    <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
          Services & Zusatzleistungen
        </h1>
        <p class="mt-1 text-neutral-500">
          Verwalten Sie Catering, Technik und weitere buchbare Extras.
        </p>
      </div>
      <button type="button" class="btn-dialog-primary gap-2" @click="openAddDialog">
        <UiIcon name="i-lucide-plus" class="size-4" />
        Service hinzufügen
      </button>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1 max-w-sm">
        <UiIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Services suchen…"
          class="w-full rounded-none border border-neutral-200 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>
    </div>

    <div class="w-full overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Service</th>
            <th class="pb-3 pr-4 font-medium">Preis (Netto)</th>
            <th class="pb-3 pr-4 font-medium">Einheit</th>
            <th class="pb-3 font-medium text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="py-12 text-center text-neutral-500">Lädt…</td>
          </tr>
          <tr v-else-if="filteredServices.length === 0">
            <td colspan="4" class="py-12 text-center text-neutral-500">
              Keine Services gefunden.
              <button
                type="button"
                class="ml-1 font-medium text-brand-accent hover:underline"
                @click="openAddDialog"
              >
                Neuen Service anlegen
              </button>
            </td>
          </tr>
          <tr
            v-for="service in filteredServices"
            :key="service.id"
            class="group border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
          >
            <td class="py-4 pr-4">
              <div class="flex items-center gap-3">
                <div class="min-w-0">
                  <div class="font-medium text-neutral-900">
                    {{ service.name }}
                  </div>
                </div>
              </div>
            </td>
            <td class="py-4 pr-4 font-medium text-neutral-900">
              €{{ Number(service.price_per_unit).toFixed(2) }}
            </td>
            <td class="py-4 pr-4 text-neutral-700">
              {{ service.pricing_unit }}
            </td>
            <td class="py-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="p-1.5 text-neutral-400 transition-colors hover:text-neutral-900"
                  title="Bearbeiten"
                  @click="editService(service)"
                >
                  <IconEdit class="size-3 text-neutral-600" />
                </button>
                <button
                  type="button"
                  class="p-1.5 text-neutral-400 transition-colors hover:text-red-600"
                  title="Löschen"
                  @click="deleteService(service)"
                >
                  <IconTrash class="size-4 text-neutral-600" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showDialog"
      class="dialog-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0" @click="showDialog = false" />

      <div class="dialog-panel max-w-md">
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ editingService ? "Service bearbeiten" : "Neuer Service" }}
          </h3>
          <button
            type="button"
            class="dialog-close"
            aria-label="Schließen"
            @click="showDialog = false"
          >
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="dialog-body space-y-5">
          <div>
            <label class="dialog-label">Bezeichnung</label>
            <input
              v-model="serviceForm.name"
              type="text"
              placeholder="z.B. Catering, Beamer, Flipchart"
              class="dialog-input"
            />
          </div>

          <div>
            <label class="dialog-label">Preis (Netto)</label>
            <input
              v-model.number="serviceForm.price_per_unit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="dialog-input text-right"
            />
          </div>

          <div>
            <label class="dialog-label">Abrechnungseinheit</label>
            <div class="relative">
              <input
                v-model="serviceForm.pricing_unit"
                type="text"
                list="pricing-units"
                placeholder="z.B. Pauschal, Stunde, Tag, Stück"
                class="dialog-input"
              />
              <datalist id="pricing-units">
                <option value="Pauschal" />
                <option value="Stunde" />
                <option value="Tag" />
                <option value="Stück" />
                <option value="Person" />
              </datalist>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button
            type="button"
            class="btn-dialog-cancel"
            @click="showDialog = false"
          >
            Abbrechen
          </button>
          <button
            type="button"
            class="btn-dialog-primary"
            :disabled="saving"
            @click="saveService"
          >
            <span
              v-if="saving"
              class="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            Speichern
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from "vue";

const api = useBookingApi();
const { confirm } = useConfirm();
const loading = ref(true);
const saving = ref(false);
const services = ref<any[]>([]);
const searchQuery = ref("");

const showDialog = ref(false);
const editingService = ref(false);
const serviceForm = ref<any>({
  id: null,
  name: "",
  price_per_unit: 0,
  pricing_unit: "Pauschal",
});

const filteredServices = computed(() => {
  if (!searchQuery.value) return services.value;
  const q = searchQuery.value.toLowerCase();
  return services.value.filter((s) => s.name?.toLowerCase().includes(q));
});

const loadServices = async () => {
  loading.value = true;
  try {
    const data = await api.services.getAll();
    if (data) services.value = Array.isArray(data) ? data : [];
  } finally {
    loading.value = false;
  }
};

const getServiceIcon = (name: string) => {
  const lowerName = name?.toLowerCase() || "";

  if (
    lowerName.includes("catering") ||
    lowerName.includes("kaffee") ||
    lowerName.includes("essen")
  ) {
    return () =>
      h(
        "svg",
        {
          class: "w-5 h-5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z",
          }),
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M6 1V4M10 1V4M14 1V4",
          }),
        ],
      );
  }

  if (
    lowerName.includes("beamer") ||
    lowerName.includes("bildschirm") ||
    lowerName.includes("technik") ||
    lowerName.includes("tv")
  ) {
    return () =>
      h(
        "svg",
        {
          class: "w-5 h-5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
          }),
        ],
      );
  }

  if (
    lowerName.includes("internet") ||
    lowerName.includes("wifi") ||
    lowerName.includes("wlan")
  ) {
    return () =>
      h(
        "svg",
        {
          class: "w-5 h-5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
        },
        [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            d: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
          }),
        ],
      );
  }

  return () =>
    h(
      "svg",
      {
        class: "w-5 h-5",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
      },
      [
        h("path", {
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
          "stroke-width": "2",
          d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
        }),
      ],
    );
};

const openAddDialog = () => {
  editingService.value = false;
  serviceForm.value = {
    id: null,
    name: "",
    price_per_unit: 0,
    pricing_unit: "Pauschal",
  };
  showDialog.value = true;
};

const editService = (service: any) => {
  editingService.value = true;
  serviceForm.value = { ...service };
  showDialog.value = true;
};

const saveService = async () => {
  if (!serviceForm.value.name) return;

  saving.value = true;
  try {
    let result;
    if (editingService.value) {
      result = await api.services.update(
        serviceForm.value.id,
        serviceForm.value,
      );
    } else {
      result = await api.services.create(serviceForm.value);
    }

    if (result) {
      await loadServices();
      showDialog.value = false;
    }
  } catch (e) {
    console.error(e);
  } finally {
    saving.value = false;
  }
};

const deleteService = async (service: any) => {
  const confirmed = await confirm({
    title: "Service löschen?",
    message: `Möchten Sie „${service.name}“ wirklich löschen?`,
    confirmLabel: "Ja, löschen",
    variant: "danger",
  });
  if (!confirmed) return;
  await api.services.delete(service.id);
  await loadServices();
};

onMounted(() => {
  loadServices();
});
</script>
