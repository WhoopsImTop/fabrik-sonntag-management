<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
          Versendete E-Mails
        </h1>
        <p class="mt-1 text-neutral-500">
          Protokoll aller E-Mails, die das System verschickt hat.
        </p>
      </div>
      <button
        v-if="failedTotal > 0 && filters.status !== 'failed'"
        type="button"
        class="inline-flex items-center gap-2 self-start border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 transition-colors hover:bg-red-100 sm:self-auto"
        @click="showFailed"
      >
        <UiIcon name="i-lucide-triangle-alert" class="size-4" />
        {{ failedTotal }} fehlgeschlagen
      </button>
    </div>

    <!-- Filter -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
      <div class="relative sm:col-span-2 lg:col-span-1">
        <UiIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400"
        />
        <input
          v-model="filters.q"
          type="search"
          placeholder="Empfänger oder Betreff suchen…"
          class="w-full border border-neutral-200 bg-white py-2 pl-10 pr-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />
      </div>
      <select v-model="filters.status" class="filter-input">
        <option value="">Alle Status</option>
        <option value="sent">Gesendet</option>
        <option value="failed">Fehlgeschlagen</option>
      </select>
      <select v-model="filters.template_key" class="filter-input">
        <option value="">Alle Arten</option>
        <option value="__custom">Individuelle Nachricht</option>
        <option v-for="key in templateKeys" :key="key" :value="key">
          {{ templateLabel(key) }}
        </option>
      </select>
      <input
        v-model="filters.from"
        type="date"
        class="filter-input"
        aria-label="Von"
        :max="filters.to || undefined"
      />
      <input
        v-model="filters.to"
        type="date"
        class="filter-input"
        aria-label="Bis"
        :min="filters.from || undefined"
      />
    </div>

    <div class="flex items-center justify-between text-sm text-neutral-500">
      <span>
        {{ total }} E-Mail{{ total === 1 ? "" : "s" }}
        <template v-if="hasFilters">gefunden</template>
      </span>
      <button
        v-if="hasFilters"
        type="button"
        class="text-neutral-700 underline-offset-2 hover:underline"
        @click="resetFilters"
      >
        Filter zurücksetzen
      </button>
    </div>

    <!-- Tabelle -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Datum</th>
            <th class="pb-3 pr-4 font-medium">Empfänger</th>
            <th class="pb-3 pr-4 font-medium">Betreff</th>
            <th class="hidden pb-3 pr-4 font-medium lg:table-cell">Art</th>
            <th class="hidden pb-3 pr-4 font-medium md:table-cell">Bezug</th>
            <th class="pb-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !rows.length">
            <td colspan="6" class="py-12 text-center text-neutral-500">Lädt…</td>
          </tr>
          <tr v-else-if="!rows.length">
            <td colspan="6" class="py-12 text-center text-neutral-500">
              {{ hasFilters ? "Keine E-Mails für diese Filter." : "Noch keine E-Mails protokolliert." }}
            </td>
          </tr>
          <tr
            v-for="log in rows"
            :key="log.id"
            class="cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
            :class="loading ? 'opacity-60' : ''"
            tabindex="0"
            @click="openDetail(log)"
            @keydown.enter="openDetail(log)"
          >
            <td class="whitespace-nowrap py-3 pr-4 tabular-nums text-neutral-600">
              {{ formatDate(log.createdAt) }}
            </td>
            <td class="max-w-[16rem] py-3 pr-4">
              <div class="truncate text-neutral-900" :title="log.recipient || ''">
                {{ log.recipient || "—" }}
              </div>
              <div v-if="customerName(log)" class="truncate text-xs text-neutral-500">
                {{ customerName(log) }}
              </div>
            </td>
            <td class="max-w-[22rem] py-3 pr-4">
              <div class="truncate font-medium text-neutral-900" :title="log.subject">
                {{ log.subject || "Ohne Betreff" }}
              </div>
              <div
                v-if="log.attachments?.length"
                class="mt-0.5 flex items-center gap-1 text-xs text-neutral-500"
              >
                <UiIcon name="i-lucide-paperclip" class="size-3" />
                {{ log.attachments.length }} Anhang{{ log.attachments.length === 1 ? "" : "e" }}
              </div>
            </td>
            <td class="hidden py-3 pr-4 text-xs text-neutral-600 lg:table-cell">
              {{ templateLabel(log.template_key) }}
            </td>
            <td class="hidden py-3 pr-4 text-xs md:table-cell" @click.stop>
              <NuxtLink
                v-if="log.Booking"
                :to="`/booking-system/calendar?id=${log.Booking.id}`"
                class="text-neutral-700 hover:underline"
              >
                Buchung #{{ log.Booking.id }}
              </NuxtLink>
              <NuxtLink
                v-else-if="log.User"
                :to="`/booking-system/users/${log.User.id}`"
                class="text-neutral-700 hover:underline"
              >
                Kontakt
              </NuxtLink>
              <span v-else class="text-neutral-400">—</span>
            </td>
            <td class="py-3">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  log.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700',
                ]"
              >
                {{ log.error ? "Fehlgeschlagen" : "Gesendet" }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex items-center justify-between text-sm">
      <span class="text-neutral-500 tabular-nums">
        {{ offset + 1 }}–{{ Math.min(offset + pageSize, total) }} von {{ total }}
      </span>
      <div class="flex gap-2">
        <UiButton
          size="sm"
          variant="outline"
          icon="i-lucide-chevron-left"
          :disabled="offset === 0 || loading"
          @click="goTo(offset - pageSize)"
        >
          Zurück
        </UiButton>
        <UiButton
          size="sm"
          variant="outline"
          :disabled="offset + pageSize >= total || loading"
          @click="goTo(offset + pageSize)"
        >
          Weiter
        </UiButton>
      </div>
    </div>

    <!-- Detail -->
    <Teleport to="body">
      <div
        v-if="detail"
        class="dialog-overlay z-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-log-title"
      >
        <div class="absolute inset-0" @click="closeDetail" />
        <div class="dialog-panel max-w-2xl">
          <div class="dialog-header">
            <div class="min-w-0 flex-1">
              <p class="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {{ templateLabel(detail.template_key) }}
              </p>
              <h3 id="email-log-title" class="dialog-title">
                {{ detail.subject || "Ohne Betreff" }}
              </h3>
              <p class="dialog-desc">{{ formatDate(detail.createdAt) }} Uhr</p>
            </div>
            <button type="button" class="dialog-close" aria-label="Schließen" @click="closeDetail">
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>

          <dl class="grid shrink-0 grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-b border-neutral-200 px-6 py-3 text-sm">
            <dt class="text-neutral-500">An</dt>
            <dd class="break-all text-neutral-900">{{ detail.recipient || "— (nicht protokolliert)" }}</dd>
            <dt class="text-neutral-500">Status</dt>
            <dd>
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  detail.error ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800',
                ]"
              >
                {{ detail.error ? "Fehlgeschlagen" : "Erfolgreich gesendet" }}
              </span>
            </dd>
            <template v-if="detail.Booking || detail.User">
              <dt class="text-neutral-500">Bezug</dt>
              <dd class="flex flex-wrap gap-x-3">
                <NuxtLink
                  v-if="detail.Booking"
                  :to="`/booking-system/calendar?id=${detail.Booking.id}`"
                  class="text-neutral-700 hover:underline"
                  @click="closeDetail"
                >
                  Buchung #{{ detail.Booking.id }}
                  <span v-if="detail.Booking.Resource?.name">· {{ detail.Booking.Resource.name }}</span>
                </NuxtLink>
                <NuxtLink
                  v-if="detail.User"
                  :to="`/booking-system/users/${detail.User.id}`"
                  class="text-neutral-700 hover:underline"
                  @click="closeDetail"
                >
                  {{ customerName(detail) || detail.User.email }}
                </NuxtLink>
              </dd>
            </template>
          </dl>

          <div class="dialog-body">
            <div
              v-if="detail.error"
              class="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p class="mb-0.5 font-medium text-red-800">Fehler beim Versand</p>
              <p class="break-words text-red-600">{{ detail.error }}</p>
            </div>

            <div v-if="detail.attachments?.length" class="mb-4 flex flex-wrap gap-2">
              <span
                v-for="file in detail.attachments"
                :key="file"
                class="inline-flex items-center gap-1.5 border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700"
              >
                <UiIcon name="i-lucide-paperclip" class="size-3" />
                {{ file }}
              </span>
            </div>

            <p v-if="detailLoading" class="text-sm text-neutral-500">Lädt Nachricht…</p>
            <div v-else-if="detail.message" class="border border-neutral-200 px-4 py-4">
              <p class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Nachricht
              </p>
              <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-700">
                {{ detail.message }}
              </p>
            </div>
            <p v-else class="text-sm italic text-neutral-400">Kein Nachrichteninhalt gespeichert.</p>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn-dialog-cancel" @click="closeDetail">Schließen</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";

const api = useBookingApi();
const route = useRoute();
const router = useRouter();

const pageSize = 50;

// Systemmails ohne DB-Template bekommen hier einen lesbaren Namen.
const BUILTIN_LABELS: Record<string, string> = {
  HEATING_BATTERY_WARNING: "Batteriewarnung Heizung",
};

const loading = ref(true);
const rows = ref<any[]>([]);
const total = ref(0);
const failedTotal = ref(0);
const offset = ref(0);
const templateKeys = ref<string[]>([]);
const templateNames = ref<Record<string, string>>({});

const filters = reactive({
  q: String(route.query.q ?? ""),
  status: (String(route.query.status ?? "") as "" | "sent" | "failed"),
  template_key: String(route.query.template_key ?? ""),
  from: String(route.query.from ?? ""),
  to: String(route.query.to ?? ""),
});

const hasFilters = computed(() => Object.values(filters).some(Boolean));

const templateLabel = (key?: string | null) => {
  if (!key) return "Individuelle Nachricht";
  if (key === "__custom") return "Individuelle Nachricht";
  return templateNames.value[key] || BUILTIN_LABELS[key] || key;
};

const customerName = (log: any) => {
  const d = log.User?.details;
  if (!d) return "";
  const name = `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim();
  return d.company ? (name ? `${name} · ${d.company}` : d.company) : name;
};

const formatDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

let requestId = 0;
const load = async () => {
  const current = ++requestId;
  loading.value = true;
  const res = await api.communications.getAll({ ...filters, limit: pageSize, offset: offset.value });
  if (current !== requestId) return; // veraltete Antwort verwerfen
  loading.value = false;
  if (!res) return;
  rows.value = res.rows;
  total.value = res.count;
  failedTotal.value = res.failed_total;
  templateKeys.value = res.template_keys;
};

const loadTemplateNames = async () => {
  const list = (await api.templates.getAll()) as any[] | null;
  if (!Array.isArray(list)) return;
  templateNames.value = Object.fromEntries(
    list.filter((t) => t?.key).map((t) => [t.key, t.name || t.key]),
  );
};

const syncQuery = () => {
  const query = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  router.replace({ query });
};

let debounce: ReturnType<typeof setTimeout> | null = null;
watch(
  () => ({ ...filters }),
  (next, prev) => {
    offset.value = 0;
    syncQuery();
    if (debounce) clearTimeout(debounce);
    // Tippen in der Suche entprellen, Auswahlfelder sofort laden
    const delay = next.q !== prev?.q ? 300 : 0;
    debounce = setTimeout(load, delay);
  },
);

const goTo = (next: number) => {
  offset.value = Math.max(0, next);
  load();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const resetFilters = () => {
  Object.assign(filters, { q: "", status: "", template_key: "", from: "", to: "" });
};

const showFailed = () => {
  filters.status = "failed";
};

// --- Detail ---
const detail = ref<any | null>(null);
const detailLoading = ref(false);

const openDetail = async (log: any) => {
  detail.value = { ...log };
  detailLoading.value = true;
  const full = await api.communications.getOne(log.id);
  detailLoading.value = false;
  if (full && detail.value?.id === log.id) detail.value = full;
};

const closeDetail = () => {
  detail.value = null;
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && detail.value) closeDetail();
};

onMounted(() => {
  load();
  loadTemplateNames();
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  if (debounce) clearTimeout(debounce);
});
</script>

<style scoped>
.filter-input {
  width: 100%;
  border: 1px solid var(--color-neutral-200, #e5e5e5);
  background: #fff;
  padding: 0.5rem 0.75rem;
}
.filter-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-neutral-900, #171717);
}
</style>
