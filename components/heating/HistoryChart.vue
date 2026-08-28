<script setup lang="ts">
import {
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Tooltip,
  Filler,
  Legend,
);

type SeriesPoint = { t: string; v: number };
type HistorySeries = {
  current_temperature?: SeriesPoint[];
  target_temperature?: SeriesPoint[];
  window_open?: SeriesPoint[];
};

const props = defineProps<{
  entityId?: number;
  roomId?: number;
}>();

const heatingApi = useHeatingApi();
const hours = ref(24);
const loading = ref(false);
const series = ref<HistorySeries>({});
const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"line"> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

const ranges = [
  { hours: 24, label: "24 Stunden" },
  { hours: 168, label: "7 Tage" },
  { hours: 720, label: "30 Tage" },
];

const toPoints = (rows?: SeriesPoint[]) =>
  (rows || []).map((row) => ({ x: Date.parse(row.t), y: row.v }));

const hasData = computed(() => {
  const current = series.value.current_temperature?.length || 0;
  const target = series.value.target_temperature?.length || 0;
  const windowOpen = series.value.window_open?.length || 0;
  return current + target + windowOpen > 0;
});

const formatTick = (value: number) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (hours.value <= 24) {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildChart = () => {
  if (!canvasRef.value) return;
  chart?.destroy();
  chart = null;
  if (!hasData.value) return;

  const windowPoints = toPoints(series.value.window_open);
  const datasets: any[] = [
    {
      label: "Ist",
      data: toPoints(series.value.current_temperature),
      borderColor: "#171717",
      backgroundColor: "#171717",
      stepped: "after",
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      yAxisID: "y",
    },
    {
      label: "Soll",
      data: toPoints(series.value.target_temperature),
      borderColor: "#ea580c",
      backgroundColor: "#ea580c",
      stepped: "after",
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
      borderDash: [5, 4],
      yAxisID: "y",
    },
  ];
  if (windowPoints.length) {
    datasets.push({
      label: "Fenster offen",
      data: windowPoints,
      borderColor: "rgba(2, 132, 199, 0.7)",
      backgroundColor: "rgba(14, 165, 233, 0.2)",
      stepped: "after",
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 0,
      borderWidth: 1,
      yAxisID: "window",
    });
  }

  chart = new Chart(canvasRef.value, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { boxWidth: 12, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            title: (items) => {
              const x = items[0]?.parsed?.x;
              if (x == null) return "";
              return new Date(x).toLocaleString("de-DE", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });
            },
            label: (item) => {
              const label = item.dataset.label || "";
              const y = item.parsed?.y;
              if (y == null) return label;
              if (item.dataset.yAxisID === "window") {
                return `${label}: ${y >= 0.5 ? "ja" : "nein"}`;
              }
              return `${label}: ${Number(y).toLocaleString("de-DE", {
                maximumFractionDigits: 1,
              })} °C`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          ticks: {
            color: "#737373",
            font: { size: 10 },
            maxTicksLimit: 8,
            callback: (value) => formatTick(Number(value)),
          },
          grid: { display: false },
          border: { color: "#e5e5e5" },
        },
        y: {
          title: {
            display: true,
            text: "°C",
            color: "#737373",
            font: { size: 11 },
          },
          ticks: { color: "#737373", font: { size: 10 } },
          grid: { color: "#e5e5e5" },
          border: { color: "#e5e5e5" },
        },
        window: {
          min: 0,
          max: 1,
          display: false,
          position: "right",
          grid: { drawOnChartArea: false },
        },
      },
    },
  });
};

const load = async () => {
  if (!props.entityId && !props.roomId) return;
  loading.value = true;
  const data = props.roomId
    ? await heatingApi.getRoomHistory(props.roomId, { hours: hours.value })
    : await heatingApi.getHistory(props.entityId as number, { hours: hours.value });
  series.value = data?.series || {};
  loading.value = false;
  await nextTick();
  buildChart();
};

onMounted(() => {
  load();
  refreshTimer = setInterval(load, 60_000);
});

watch([hours, () => props.entityId, () => props.roomId], load);

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  chart?.destroy();
  chart = null;
});
</script>

<template>
  <section class="border border-neutral-200 p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 class="font-semibold">
        {{ roomId ? "Verlauf (Mittelwert aller Thermostate)" : "Verlauf" }}
      </h2>
      <div class="flex border border-neutral-200">
        <button
          v-for="range in ranges"
          :key="range.hours"
          type="button"
          class="px-2 py-1 text-xs"
          :class="
            hours === range.hours
              ? 'bg-neutral-900 text-white'
              : 'bg-white text-neutral-700 hover:bg-neutral-50'
          "
          @click="hours = range.hours"
        >
          {{ range.label }}
        </button>
      </div>
    </div>
    <p v-if="loading && !hasData" class="text-sm text-neutral-500">Laden…</p>
    <p v-else-if="!hasData" class="text-sm text-neutral-500">
      Noch keine Verlaufsdaten. Ist, Soll und Fenster-offen erscheinen, sobald
      {{ roomId ? "die Thermostate Werte senden" : "das Thermostat Werte sendet" }}.
    </p>
    <div v-show="hasData" class="h-64 w-full">
      <canvas ref="canvasRef" />
    </div>
  </section>
</template>
