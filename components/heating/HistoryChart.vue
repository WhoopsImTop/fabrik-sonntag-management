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
const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
// Angezeigter Tag (immer 00:00 – 23:59)
const day = ref(startOfDay(new Date()));
const dayStartMs = computed(() => day.value.getTime());
const dayEndMs = computed(() => {
  const d = new Date(day.value);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
});
const isToday = computed(() => dayStartMs.value === startOfDay(new Date()).getTime());
const dayLabel = computed(() =>
  day.value.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }),
);
const dayInputValue = computed({
  get: () => {
    const d = day.value;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  },
  set: (value: string) => {
    if (!value) return;
    const [y, m, d] = value.split("-").map(Number);
    day.value = new Date(y, m - 1, d);
  },
});
const shiftDay = (delta: number) => {
  const d = new Date(day.value);
  d.setDate(d.getDate() + delta);
  if (d.getTime() > startOfDay(new Date()).getTime()) return;
  day.value = d;
};
const loading = ref(false);
const series = ref<HistorySeries>({});
const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"line"> | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

type ChartPoint = { x: number; y: number | null };

// Ist, Soll und Fenster werden zu unterschiedlichen Zeiten geloggt. Der
// Tooltip (mode "index") greift aber je Datensatz denselben Array-Index ab –
// ohne gemeinsames Zeitraster zeigt er also Werte von verschiedenen Uhrzeiten.
// Deshalb alle Reihen auf dieselben Zeitpunkte bringen und den jeweils letzten
// Wert halten (Stufenverlauf).
const toAlignedPoints = (list: (SeriesPoint[] | undefined)[]) => {
  const parsed = list.map((rows) =>
    (rows || [])
      .map((row) => ({ x: Date.parse(row.t), y: row.v }))
      .filter((point) => Number.isFinite(point.x))
      .sort((a, b) => a.x - b.x),
  );
  const times = [...new Set(parsed.flatMap((rows) => rows.map((p) => p.x)))].sort(
    (a, b) => a - b,
  );
  return parsed.map((rows): ChartPoint[] => {
    if (!rows.length) return [];
    let idx = 0;
    let current: number | null = null;
    return times.map((x) => {
      while (idx < rows.length && rows[idx].x <= x) {
        current = rows[idx].y;
        idx += 1;
      }
      return { x, y: current };
    });
  });
};

const hasData = computed(() => {
  const current = series.value.current_temperature?.length || 0;
  const target = series.value.target_temperature?.length || 0;
  const windowOpen = series.value.window_open?.length || 0;
  return current + target + windowOpen > 0;
});

const formatTick = (value: number) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (value >= dayEndMs.value) return "23:59";
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildChart = () => {
  if (!canvasRef.value) return;
  chart?.destroy();
  chart = null;
  if (!hasData.value) return;

  const [currentPoints, targetPoints, windowPoints] = toAlignedPoints([
    series.value.current_temperature,
    series.value.target_temperature,
    series.value.window_open,
  ]);
  const datasets: any[] = [
    {
      label: "Ist",
      data: currentPoints,
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
      data: targetPoints,
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
          filter: (item) => item.parsed?.y != null,
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
          min: dayStartMs.value,
          max: dayEndMs.value,
          // Feste Beschriftung: 00:00, 03:00, … 21:00 und Tagesende 23:59
          afterBuildTicks: (axis: any) => {
            const step = 3 * 3600 * 1000;
            const ticks = [];
            for (let t = dayStartMs.value; t <= dayEndMs.value; t += step) {
              ticks.push({ value: t });
            }
            ticks.push({ value: dayEndMs.value });
            axis.ticks = ticks;
          },
          ticks: {
            color: "#737373",
            font: { size: 10 },
            autoSkip: false,
            maxRotation: 0,
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
  // Für heute nur bis jetzt abfragen, damit der letzte Wert nicht in die Zukunft fortgeschrieben wird.
  const query = {
    from: new Date(dayStartMs.value).toISOString(),
    to: new Date(Math.min(dayEndMs.value, Date.now())).toISOString(),
  };
  const data = props.roomId
    ? await heatingApi.getRoomHistory(props.roomId, query)
    : await heatingApi.getHistory(props.entityId as number, query);
  series.value = data?.series || {};
  loading.value = false;
  await nextTick();
  buildChart();
};

onMounted(() => {
  load();
  refreshTimer = setInterval(() => {
    if (isToday.value) load();
  }, 60_000);
});

watch([day, () => props.entityId, () => props.roomId], load);

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  chart?.destroy();
  chart = null;
});
</script>

<template>
  <section class="border border-neutral-200 p-4 rounded-xl">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 class="font-semibold">
        {{ roomId ? "Verlauf (Mittelwert aller Thermostate)" : "Verlauf" }}
      </h2>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
          aria-label="Vorheriger Tag"
          @click="shiftDay(-1)"
        >
          ‹
        </button>
        <input
          v-model="dayInputValue"
          type="date"
          :max="new Date().toISOString().slice(0, 10)"
          :title="dayLabel"
          class="border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
        />
        <button
          type="button"
          class="border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
          :disabled="isToday"
          aria-label="Nächster Tag"
          @click="shiftDay(1)"
        >
          ›
        </button>
        <button
          type="button"
          class="border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
          :disabled="isToday"
          @click="day = startOfDay(new Date())"
        >
          Heute
        </button>
      </div>
    </div>
    <p v-if="loading && !hasData" class="text-sm text-neutral-500">Laden…</p>
    <p v-else-if="!hasData" class="text-sm text-neutral-500">
      Keine Verlaufsdaten für {{ dayLabel }}.
    </p>
    <div v-show="hasData" class="h-64 w-full">
      <canvas ref="canvasRef" />
    </div>
  </section>
</template>
