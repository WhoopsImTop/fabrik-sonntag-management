<template>
  <div class="space-y-8 pb-12">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
          Analytics
        </h1>
        <p class="mt-1 text-sm text-neutral-500">
          First-Party-Statistiken ohne Cookies. Filterbar nach Website und Seite.
        </p>
      </div>
      <div class="flex flex-wrap items-end gap-3">
        <label class="block text-sm">
          <span class="mb-1 block text-neutral-500">Website</span>
          <select
            v-model.number="siteId"
            class="border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <option v-for="site in sites" :key="site.id" :value="site.id">
              {{ site.name }} ({{ site.domain }})
            </option>
          </select>
        </label>
        <label class="block text-sm">
          <span class="mb-1 block text-neutral-500">Seite / Pfad</span>
          <input
            v-model="pathFilter"
            type="text"
            placeholder="alle"
            class="w-56 border border-neutral-200 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label class="block text-sm">
          <span class="mb-1 block text-neutral-500">Zeitraum</span>
          <select
            v-model="rangeKey"
            class="border border-neutral-200 bg-white px-3 py-2 text-sm"
          >
            <option value="7">7 Tage</option>
            <option value="30">30 Tage</option>
            <option value="90">90 Tage</option>
            <option value="custom">Benutzerdefiniert</option>
          </select>
        </label>
        <template v-if="rangeKey === 'custom'">
          <input
            v-model="customFrom"
            type="date"
            class="border border-neutral-200 px-3 py-2 text-sm"
          />
          <input
            v-model="customTo"
            type="date"
            class="border border-neutral-200 px-3 py-2 text-sm"
          />
        </template>
        <button
          type="button"
          class="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
          :disabled="loading || !siteId"
          @click="loadStats"
        >
          {{ loading ? "Lädt…" : "Aktualisieren" }}
        </button>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <p v-else-if="!sites.length" class="text-sm text-neutral-500">
      Noch keine Website angelegt. Unten eine Domain hinzufügen, dann das
      Snippet auf der Seite einbinden.
    </p>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div
        v-for="card in kpiCards"
        :key="card.label"
        class="flex flex-col justify-between border border-neutral-200 bg-white px-5 py-5"
      >
        <p class="text-3xl font-semibold tracking-tight text-neutral-900">
          {{ card.value }}
        </p>
        <p class="mt-3 text-sm text-neutral-500">{{ card.label }}</p>
      </div>
    </div>

    <section class="border border-neutral-200 bg-white p-5">
      <h2 class="mb-4 text-lg font-semibold text-neutral-900">Verlauf</h2>
      <div class="h-64">
        <canvas ref="chartRef"></canvas>
      </div>
    </section>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section class="border border-neutral-200 bg-white">
        <h2 class="border-b border-neutral-200 px-5 py-4 text-lg font-semibold">
          Seiten
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-neutral-200 text-neutral-500">
                <th class="px-5 py-3 font-medium">Pfad</th>
                <th class="px-5 py-3 font-medium">Aufrufe</th>
                <th class="px-5 py-3 font-medium">Besucher</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!pageRows.length">
                <td colspan="3" class="px-5 py-8 text-center text-neutral-400">
                  Keine Daten
                </td>
              </tr>
              <tr
                v-for="row in pageRows"
                :key="row.path"
                class="cursor-pointer border-b border-neutral-100 hover:bg-neutral-50"
                @click="pathFilter = row.path"
              >
                <td class="max-w-xs truncate px-5 py-3" :title="row.path">
                  {{ row.path }}
                </td>
                <td class="px-5 py-3">{{ row.pageviews }}</td>
                <td class="px-5 py-3">{{ row.visitors }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="border border-neutral-200 bg-white">
        <h2 class="border-b border-neutral-200 px-5 py-4 text-lg font-semibold">
          Referrer
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-neutral-200 text-neutral-500">
                <th class="px-5 py-3 font-medium">Quelle</th>
                <th class="px-5 py-3 font-medium">Aufrufe</th>
                <th class="px-5 py-3 font-medium">Besucher</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!referrerRows.length">
                <td colspan="3" class="px-5 py-8 text-center text-neutral-400">
                  Keine Daten
                </td>
              </tr>
              <tr
                v-for="row in referrerRows"
                :key="row.referrer"
                class="border-b border-neutral-100"
              >
                <td class="px-5 py-3">{{ row.referrer }}</td>
                <td class="px-5 py-3">{{ row.pageviews }}</td>
                <td class="px-5 py-3">{{ row.visitors }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section class="border border-neutral-200 bg-white">
        <h2 class="border-b border-neutral-200 px-5 py-4 text-lg font-semibold">
          Events &amp; Conversions
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-neutral-200 text-neutral-500">
                <th class="px-5 py-3 font-medium">Event</th>
                <th class="px-5 py-3 font-medium">Anzahl</th>
                <th class="px-5 py-3 font-medium">Besucher</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!eventRows.length">
                <td colspan="3" class="px-5 py-8 text-center text-neutral-400">
                  Keine Events
                </td>
              </tr>
              <tr
                v-for="row in eventRows"
                :key="row.name"
                class="border-b border-neutral-100"
              >
                <td class="px-5 py-3">
                  {{ row.name }}
                  <span
                    v-if="row.isConversion"
                    class="ml-2 text-xs text-neutral-500"
                    >Conversion</span
                  >
                </td>
                <td class="px-5 py-3">{{ row.count }}</td>
                <td class="px-5 py-3">{{ row.visitors }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="border border-neutral-200 bg-white">
        <h2 class="border-b border-neutral-200 px-5 py-4 text-lg font-semibold">
          Pfade
        </h2>
        <ul class="divide-y divide-neutral-100 text-sm">
          <li
            v-if="!pathRows.length"
            class="px-5 py-8 text-center text-neutral-400"
          >
            Keine Journeys
          </li>
          <li
            v-for="row in pathRows"
            :key="row.journey"
            class="flex items-start justify-between gap-4 px-5 py-3"
          >
            <span class="break-all text-neutral-700">{{ row.journey }}</span>
            <span class="shrink-0 text-neutral-500">{{ row.count }}</span>
          </li>
        </ul>
      </section>
    </div>

    <section
      v-if="hasLivemapData"
      class="border border-neutral-200 bg-white p-5"
    >
      <h2 class="mb-4 text-lg font-semibold text-neutral-900">Livemap</h2>
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div v-for="block in livemapBlocks" :key="block.title">
          <h3 class="mb-2 text-sm font-medium text-neutral-500">
            {{ block.title }}
          </h3>
          <ul class="space-y-1 text-sm">
            <li v-if="!block.items.length" class="text-neutral-400">—</li>
            <li
              v-for="item in block.items"
              :key="item.value"
              class="flex justify-between gap-2"
            >
              <span>{{ item.value }}</span>
              <span class="text-neutral-500">{{ item.count }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="border border-neutral-200 bg-white">
      <div class="border-b border-neutral-200 px-5 py-4">
        <h2 class="text-lg font-semibold text-neutral-900">Websites</h2>
        <p class="mt-1 text-sm text-neutral-500">
          Domain ohne Protokoll, z. B. fabrik-sonntag.de. Das Skript setzt keine
          Cookies.
        </p>
      </div>
      <div class="space-y-6 px-5 py-5">
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="addSite">
          <label class="block text-sm">
            <span class="mb-1 block text-neutral-500">Name</span>
            <input
              v-model="newSite.name"
              required
              class="border border-neutral-200 px-3 py-2"
            />
          </label>
          <label class="block text-sm">
            <span class="mb-1 block text-neutral-500">Domain</span>
            <input
              v-model="newSite.domain"
              required
              placeholder="fabrik-sonntag.de"
              class="border border-neutral-200 px-3 py-2"
            />
          </label>
          <button
            type="submit"
            class="border border-neutral-900 px-4 py-2 text-sm hover:bg-neutral-50"
          >
            Hinzufügen
          </button>
        </form>

        <div
          v-for="site in sites"
          :key="site.id"
          class="border border-neutral-100 p-4"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-medium text-neutral-900">{{ site.name }}</p>
              <p class="text-sm text-neutral-500">{{ site.domain }}</p>
            </div>
            <button
              type="button"
              class="text-sm text-red-600 hover:underline"
              @click="removeSite(site.id)"
            >
              Löschen
            </button>
          </div>
          <label class="mt-3 block text-xs text-neutral-500">Snippet</label>
          <pre
            class="mt-1 overflow-x-auto bg-neutral-50 p-3 text-xs text-neutral-800"
            >{{ snippetFor(site) }}</pre
          >
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { useAnalyticsApi, type AnalyticsSite } from "~/composables/useAnalyticsApi";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend,
);

const api = useAnalyticsApi();
const sites = ref<AnalyticsSite[]>([]);
const scriptUrl = ref("https://haustechnik.fabrik-sonntag.de/analytics.js");
const siteId = ref<number | null>(null);
const pathFilter = ref("");
const rangeKey = ref("30");
const customFrom = ref("");
const customTo = ref("");
const loading = ref(false);
const error = ref("");
const chartRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"line"> | null = null;

const overview = ref({
  pageviews: 0,
  visitors: 0,
  avgDurationMs: 0,
  bounceRate: 0,
  conversions: 0,
});
const pageRows = ref<
  { path: string; title: string | null; pageviews: number; visitors: number }[]
>([]);
const referrerRows = ref<
  { referrer: string; pageviews: number; visitors: number }[]
>([]);
const eventRows = ref<
  { name: string; count: number; visitors: number; isConversion: boolean }[]
>([]);
const pathRows = ref<{ journey: string; count: number }[]>([]);
const livemap = ref({
  pois: [] as { value: string; count: number }[],
  renters: [] as { value: string; count: number }[],
  contacts: [] as { value: string; count: number }[],
  spaces: [] as { value: string; count: number }[],
});
const newSite = ref({ name: "", domain: "" });

const formatDuration = (ms: number) => {
  if (!ms) return "0s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
};

const kpiCards = computed(() => [
  { label: "Besucher", value: overview.value.visitors },
  { label: "Seitenaufrufe", value: overview.value.pageviews },
  { label: "Ø Verweildauer", value: formatDuration(overview.value.avgDurationMs) },
  { label: "Absprungrate", value: `${overview.value.bounceRate}%` },
  { label: "Conversions", value: overview.value.conversions },
]);

const hasLivemapData = computed(
  () =>
    livemap.value.pois.length +
      livemap.value.renters.length +
      livemap.value.contacts.length +
      livemap.value.spaces.length >
    0,
);

const livemapBlocks = computed(() => [
  { title: "POIs", items: livemap.value.pois },
  { title: "Mieter", items: livemap.value.renters },
  { title: "Kontakt", items: livemap.value.contacts },
  { title: "Freie Flächen", items: livemap.value.spaces },
]);

const rangeIso = () => {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  if (rangeKey.value === "custom" && customFrom.value && customTo.value) {
    return {
      from: new Date(`${customFrom.value}T00:00:00`).toISOString(),
      to: new Date(`${customTo.value}T23:59:59`).toISOString(),
    };
  }
  const days = Number(rangeKey.value) || 30;
  from.setDate(from.getDate() - (days - 1));
  return { from: from.toISOString(), to: to.toISOString() };
};

const snippetFor = (site: AnalyticsSite) =>
  `<script defer src="${scriptUrl.value}" data-site="${site.publicId}"><` + `/script>`;

const renderChart = (
  points: { date: string; pageviews: number; visitors: number }[],
) => {
  if (!chartRef.value) return;
  chart?.destroy();
  chart = new Chart(chartRef.value, {
    type: "line",
    data: {
      labels: points.map((p) =>
        new Date(p.date).toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
        }),
      ),
      datasets: [
        {
          label: "Besucher",
          data: points.map((p) => p.visitors),
          borderColor: "#171717",
          backgroundColor: "rgba(23,23,23,0.08)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Aufrufe",
          data: points.map((p) => p.pageviews),
          borderColor: "#a3a3a3",
          backgroundColor: "transparent",
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
};

const loadSites = async () => {
  const data = await api.listSites();
  sites.value = data.sites || [];
  if (data.scriptUrl) scriptUrl.value = data.scriptUrl;
  if (!siteId.value && sites.value.length) siteId.value = sites.value[0].id;
};

const loadStats = async () => {
  if (!siteId.value) return;
  loading.value = true;
  error.value = "";
  try {
    const query = {
      siteId: siteId.value,
      path: pathFilter.value.trim() || undefined,
      ...rangeIso(),
    };
    const [ov, ts, pg, rf, ev, pj] = await Promise.all([
      api.overview(query),
      api.timeseries(query),
      api.pages(query),
      api.referrers(query),
      api.events(query),
      api.paths(query),
    ]);
    overview.value = ov;
    pageRows.value = pg.pages || [];
    referrerRows.value = rf.referrers || [];
    eventRows.value = ev.events || [];
    pathRows.value = pj.paths || [];
    livemap.value = ev.livemap || {
      pois: [],
      renters: [],
      contacts: [],
      spaces: [],
    };
    await nextTick();
    renderChart(ts.points || []);
  } catch (err: any) {
    error.value =
      err?.data?.error || err?.message || "Statistiken konnten nicht geladen werden.";
  } finally {
    loading.value = false;
  }
};

const addSite = async () => {
  error.value = "";
  try {
    await api.createSite({
      name: newSite.value.name.trim(),
      domain: newSite.value.domain.trim(),
    });
    newSite.value = { name: "", domain: "" };
    await loadSites();
  } catch (err: any) {
    error.value = err?.data?.error || "Website konnte nicht angelegt werden.";
  }
};

const removeSite = async (id: number) => {
  if (!confirm("Website und alle Events löschen?")) return;
  await api.deleteSite(id);
  if (siteId.value === id) siteId.value = null;
  await loadSites();
  if (siteId.value) await loadStats();
};

watch(siteId, () => {
  if (siteId.value) loadStats();
});

onMounted(async () => {
  try {
    await loadSites();
    if (siteId.value) await loadStats();
  } catch (err: any) {
    error.value = err?.data?.error || "Analytics konnte nicht geladen werden.";
  }
});

onBeforeUnmount(() => {
  chart?.destroy();
});
</script>
