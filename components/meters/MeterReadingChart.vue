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
} from "chart.js";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
);

export type MeterChartPoint = {
  monthLabel: string;
  label: string;
  value: number;
  formatted: string;
};

const props = defineProps<{
  points: MeterChartPoint[];
  einheit?: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"line"> | null = null;

const getColors = () => {
  const styles = getComputedStyle(document.documentElement);
  const primary =
    styles.getPropertyValue("--ui-primary").trim() ||
    styles.getPropertyValue("--color-primary-500").trim() ||
    "rgb(59 130 246)";
  const muted =
    styles.getPropertyValue("--ui-text-muted").trim() ||
    "rgb(156 163 175)";
  const border =
    styles.getPropertyValue("--ui-border").trim() || "rgb(229 231 235)";

  return { primary, muted, border };
};

const formatTooltipValue = (formatted: string, unit: string) => {
  if (!unit || formatted.toLowerCase().includes(unit.toLowerCase())) {
    return formatted;
  }
  return `${formatted} ${unit}`;
};

const buildChart = () => {
  if (!canvasRef.value || props.points.length < 2) {
    return;
  }

  const { primary, muted, border } = getColors();
  const labels = props.points.map((p) => p.monthLabel || p.label);
  const values = props.points.map((p) => p.value);

  if (chart) {
    chart.destroy();
    chart = null;
  }

  chart = new Chart(canvasRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data: values,
          borderColor: primary,
          backgroundColor: "transparent",
          pointBackgroundColor: primary,
          pointBorderColor: primary,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => {
              const index = items[0]?.dataIndex ?? 0;
              return (
                props.points[index]?.monthLabel ||
                props.points[index]?.label ||
                ""
              );
            },
            label: (item) => {
              const index = item.dataIndex ?? 0;
              const point = props.points[index];
              if (!point) {
                return "";
              }
              return formatTooltipValue(point.formatted, props.einheit || "");
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: muted,
            font: { size: 10 },
            maxRotation: 45,
            minRotation: 0,
          },
          border: { color: border },
        },
        y: {
          grid: { color: border },
          ticks: {
            color: muted,
            font: { size: 10 },
          },
          border: { color: border },
        },
      },
    },
  });
};

onMounted(buildChart);

watch(
  () => [props.points, props.einheit],
  () => buildChart(),
  { deep: true },
);

onBeforeUnmount(() => {
  chart?.destroy();
  chart = null;
});
</script>

<template>
  <div class="h-36 w-full">
    <canvas ref="canvasRef" />
  </div>
</template>
