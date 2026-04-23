<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const meterApi = useMeterApi();

const readings = ref<any[]>([]);
const loading = ref(false);
const chartWidth = 420;
const chartHeight = 140;
const maxHistoryIndex = 11;
const axisLeft = 46;
const axisRight = 8;
const axisTop = 8;
const axisBottom = 26;

const columns = [
  { accessorKey: "createdAt", header: "Empfangen am" },
  { accessorKey: "label", header: "Name" },
  { accessorKey: "meter_id", header: "Meter ID" },
  { accessorKey: "processing_status", header: "Status" },
  { id: "recordsData", header: "Werte" },
  { id: "actions" },
];

const loadReadings = async () => {
  loading.value = true;
  readings.value = await meterApi.getAllReadings();
  loading.value = false;
};

const getNumericValue = (input: any): number | null => {
  const parsed = Number.parseFloat(String(input));
  return Number.isFinite(parsed) ? parsed : null;
};

const activeHover = ref<{
  meterId: string;
  pointIndex: number;
} | null>(null);

const parseDateFromLabel = (value: string): Date | null => {
  if (!value) {
    return null;
  }

  const normalized = value.split(" ")[0];
  const parts = normalized.split(".");
  if (parts.length !== 3) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const [day, month, year] = parts;
  const parsed = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getMonthOffset = (record: any): number | null => {
  const storage = Number(record.storage_number);
  if (Number.isInteger(storage) && storage >= 0 && storage <= maxHistoryIndex) {
    return storage;
  }

  const index = Number(record.record_index);
  if (Number.isInteger(index) && index >= 0 && index <= maxHistoryIndex) {
    return index;
  }

  return null;
};

const getMonthLabel = (record: any): string => {
  const index = getMonthOffset(record) ?? 0;
  const baseDate = new Date();
  baseDate.setDate(1);

  if (index === 0) {
    return baseDate.toLocaleDateString("de-DE", {
      month: "short",
      year: "2-digit",
    });
  }

  if (record.historisches_datum) {
    const parsed = parseDateFromLabel(record.historisches_datum);
    if (parsed) {
      return parsed.toLocaleDateString("de-DE", {
        month: "short",
        year: "2-digit",
      });
    }
  }

  baseDate.setMonth(baseDate.getMonth() - index);

  return baseDate.toLocaleDateString("de-DE", {
    month: "short",
    year: "2-digit",
  });
};

const getPointDate = (record: any): Date => {
  const index = getMonthOffset(record) ?? 0;
  const baseDate = new Date();
  baseDate.setDate(1);

  if (index === 0) {
    return baseDate;
  }

  if (record.historisches_datum) {
    const parsed = parseDateFromLabel(record.historisches_datum);
    if (parsed) {
      return parsed;
    }
  }

  baseDate.setMonth(baseDate.getMonth() - index);
  return baseDate;
};

const meterCharts = computed(() => {
  const grouped = new Map<string, any[]>();

  readings.value?.forEach((reading) => {
    if (!reading.meter_id) {
      return;
    }

    if (!grouped.has(reading.meter_id)) {
      grouped.set(reading.meter_id, []);
    }

    grouped.get(reading.meter_id)?.push(reading);
  });

  return Array.from(grouped.entries()).map(([meterId, meterReadings]) => {
    const sortedReadings = [...meterReadings].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const chartReading =
      sortedReadings.find((reading) => reading.processing_status === "parsed") ||
      sortedReadings[0];

    const records = [...(chartReading?.records || [])];
    const frequencyByKey = new Map<string, number>();

    records.forEach((record: any) => {
      const numericValue = getNumericValue(record.wert_roh);
      if (numericValue === null) {
        return;
      }

      const key = `${record.kategorie || "Wert"}|${record.einheit || ""}`;
      frequencyByKey.set(key, (frequencyByKey.get(key) || 0) + 1);
    });

    const preferredKey = [...frequencyByKey.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    const points = records
      .filter((record: any) => {
        const numericValue = getNumericValue(record.wert_roh);
        if (numericValue === null) {
          return false;
        }
        const index = getMonthOffset(record);
        if (index === null) {
          return false;
        }
        if (!preferredKey) {
          return true;
        }
        const key = `${record.kategorie || "Wert"}|${record.einheit || ""}`;
        return key === preferredKey;
      })
      .map((record: any) => {
        const value = getNumericValue(record.wert_roh);
        if (value === null) {
          return null;
        }
        const index = getMonthOffset(record) ?? 0;
        const pointDate = getPointDate(record);

        return {
          index,
          timestamp: record.historisches_datum || chartReading?.createdAt || "",
          pointDate,
          monthLabel: getMonthLabel(record),
          label:
            record.historisches_datum ||
            (index > 0
              ? `Monat -${index}`
              : "Aktuell"),
          value,
          formatted: record.wert_formatiert || String(record.wert_roh),
        };
      })
      .filter(
        (
          point,
        ): point is {
          index: number;
          timestamp: string;
          pointDate: Date;
          monthLabel: string;
          label: string;
          value: number;
          formatted: string;
        } => !!point,
      )
      .sort((a, b) => a.pointDate.getTime() - b.pointDate.getTime());

    // Pro Monat nur einen Punkt zeigen (verhindert doppelte Monatslabels).
    const uniquePointsByMonth = new Map<number, (typeof points)[number]>();
    points.forEach((point) => {
      const existing = uniquePointsByMonth.get(point.index);
      if (!existing || point.pointDate.getTime() > existing.pointDate.getTime()) {
        uniquePointsByMonth.set(point.index, point);
      }
    });
    const normalizedPoints = [...uniquePointsByMonth.values()].sort(
      (a, b) => a.pointDate.getTime() - b.pointDate.getTime(),
    );

    const values = normalizedPoints.map((point) => point.value);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 0;
    const valueRange = Math.max(maxValue - minValue, 1);

    const plotWidth = chartWidth - axisLeft - axisRight;
    const plotHeight = chartHeight - axisTop - axisBottom;

    const plottedPoints = normalizedPoints.map((point, index) => {
      const x =
        normalizedPoints.length === 1
          ? axisLeft + plotWidth / 2
          : axisLeft + (index / (normalizedPoints.length - 1)) * plotWidth;
      const y =
        axisTop + plotHeight - ((point.value - minValue) / valueRange) * plotHeight;
      return { ...point, x, y };
    });
    const path = plottedPoints
      .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(" ");

    const [kategorie = "Messwert", einheit = ""] = (preferredKey || "").split(
      "|",
    );

    return {
      meter_id: meterId,
      label: sortedReadings[0]?.meter?.label || meterId,
      count: sortedReadings.length,
      points: normalizedPoints,
      plottedPoints,
      path,
      minValue,
      maxValue,
      midValue: minValue + valueRange / 2,
      kategorie,
      einheit,
      sourceDate: chartReading?.createdAt || "",
    };
  });
});

onMounted(() => {
  loadReadings();
});

const deleteReading = async (id: number) => {
  const confirmed = window.confirm(
    "Möchten Sie diesen Zählerstand wirklich löschen?",
  );
  if (confirmed) {
    await meterApi.deleteReading(id);
    loadReadings();
  }
};

const deleteAllReadings = async () => {
  const confirmed = window.confirm(
    "ACHTUNG: Möchten Sie wirklich ALLE Zählerstände unwiderruflich löschen?",
  );
  if (confirmed) {
    await meterApi.deleteAllReadings();
    loadReadings();
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("de-DE");
};

const setHoverPoint = (meterId: string, pointIndex: number) => {
  activeHover.value = { meterId, pointIndex };
};

const clearHoverPoint = (meterId: string) => {
  if (activeHover.value?.meterId === meterId) {
    activeHover.value = null;
  }
};

const updateHoverFromMouse = (event: MouseEvent, meter: any) => {
  if (!meter?.plottedPoints?.length) {
    return;
  }

  const target = event.currentTarget as SVGElement | null;
  if (!target) {
    return;
  }

  const rect = target.getBoundingClientRect();
  if (!rect.width) {
    return;
  }

  const relativeX = ((event.clientX - rect.left) / rect.width) * chartWidth;
  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  meter.plottedPoints.forEach((point: any, index: number) => {
    const distance = Math.abs(point.x - relativeX);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  setHoverPoint(meter.meter_id, nearestIndex);
};
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Zählerstände (Readings)</h1>
      <div class="flex gap-2">
        <UButton
          color="error"
          variant="outline"
          icon="i-lucide-trash-2"
          @click="deleteAllReadings"
          :disabled="readings.length === 0"
        >
          Alle Löschen
        </UButton>
        <UButton
          color="neutral"
          variant="solid"
          icon="i-lucide-refresh-cw"
          @click="loadReadings"
        >
          Aktualisieren
        </UButton>
      </div>
    </div>

    <div class="flex flex-col">
      <div
        v-if="meterCharts.length"
        class="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6"
      >
        <UCard v-for="meter in meterCharts" :key="meter.meter_id">
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="font-semibold">{{ meter.label }}</div>
                <div class="text-xs text-gray-500">
                  {{ meter.meter_id }} | {{ meter.count }} Readings
                </div>
              </div>
              <UBadge color="neutral">
                {{ meter.kategorie }} {{ meter.einheit }}
              </UBadge>
            </div>
          </template>

          <div v-if="meter.points.length >= 2" class="space-y-2">
            <div class="relative">
              <svg
                :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
                class="w-full h-36 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
                preserveAspectRatio="none"
                @mousemove="updateHoverFromMouse($event, meter)"
                @mouseleave="clearHoverPoint(meter.meter_id)"
              >
                <line
                  :x1="axisLeft"
                  :y1="chartHeight - axisBottom"
                  :x2="chartWidth - axisRight"
                  :y2="chartHeight - axisBottom"
                  class="text-gray-300 dark:text-gray-600"
                  stroke="currentColor"
                  stroke-width="1"
                />
                <line
                  :x1="axisLeft"
                  :y1="axisTop"
                  :x2="axisLeft"
                  :y2="chartHeight - axisBottom"
                  class="text-gray-300 dark:text-gray-600"
                  stroke="currentColor"
                  stroke-width="1"
                />
                <text
                  :x="axisLeft - 4"
                  :y="axisTop + 4"
                  text-anchor="end"
                  class="fill-gray-500 dark:fill-gray-400 text-[9px]"
                >
                  {{ meter.maxValue.toFixed(2) }}
                </text>
                <text
                  :x="axisLeft - 4"
                  :y="(axisTop + (chartHeight - axisBottom)) / 2 + 3"
                  text-anchor="end"
                  class="fill-gray-500 dark:fill-gray-400 text-[9px]"
                >
                  {{ meter.midValue.toFixed(2) }}
                </text>
                <text
                  :x="axisLeft - 4"
                  :y="chartHeight - axisBottom + 3"
                  text-anchor="end"
                  class="fill-gray-500 dark:fill-gray-400 text-[9px]"
                >
                  {{ meter.minValue.toFixed(2) }}
                </text>
                <polyline
                  :points="meter.path"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  class="text-primary"
                />
                <line
                  v-if="activeHover?.meterId === meter.meter_id"
                  :x1="
                    meter.plottedPoints[activeHover.pointIndex]?.x?.toFixed(2) || 0
                  "
                  :y1="axisTop"
                  :x2="
                    meter.plottedPoints[activeHover.pointIndex]?.x?.toFixed(2) || 0
                  "
                  :y2="chartHeight - axisBottom"
                  class="text-gray-300 dark:text-gray-600"
                  stroke="currentColor"
                  stroke-width="1"
                  stroke-dasharray="4 3"
                />
                <circle
                  v-for="(point, pointIndex) in meter.plottedPoints"
                  :key="`${meter.meter_id}-${pointIndex}`"
                  :cx="point.x.toFixed(2)"
                  :cy="point.y.toFixed(2)"
                  r="2.5"
                  class="text-primary"
                  fill="currentColor"
                  @mouseenter="setHoverPoint(meter.meter_id, pointIndex)"
                />
                <text
                  v-for="(point, pointIndex) in meter.plottedPoints"
                  :key="`label-${meter.meter_id}-${pointIndex}`"
                  :x="point.x.toFixed(2)"
                  :y="chartHeight - 8"
                  text-anchor="middle"
                  class="fill-gray-500 dark:fill-gray-400 text-[9px]"
                >
                  {{ point.monthLabel }}
                </text>
              </svg>
              <div
                v-if="activeHover?.meterId === meter.meter_id"
                class="absolute top-2 right-2 bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-[11px] leading-tight shadow"
              >
                <div class="font-medium">
                  {{
                    meter.plottedPoints[activeHover.pointIndex]?.monthLabel ||
                    meter.plottedPoints[activeHover.pointIndex]?.label
                  }}
                </div>
                <div class="text-gray-600 dark:text-gray-300">
                  {{ meter.plottedPoints[activeHover.pointIndex]?.formatted }}
                  {{ meter.einheit }}
                </div>
              </div>
            </div>
            <div class="text-xs text-gray-500 flex justify-between">
              <span>Min: {{ meter.minValue.toFixed(3) }}</span>
              <span>Max: {{ meter.maxValue.toFixed(3) }}</span>
              <span>
                Letzter:
                {{ meter.points[meter.points.length - 1]?.formatted }}
                {{ meter.einheit }}
              </span>
            </div>
            <div class="text-[11px] text-gray-400 flex justify-between">
              <span>{{ meter.points[0]?.monthLabel || meter.points[0]?.label }}</span>
              <span>
                {{
                  meter.points[meter.points.length - 1]?.monthLabel ||
                  meter.points[meter.points.length - 1]?.label
                }}
              </span>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500">
            Für diesen Zähler liegen noch nicht genug historische Werte für eine
            Kurve vor.
          </div>
        </UCard>
      </div>
    </div>

    <div
      class="flex-1 flex flex-col min-h-0 bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 shadow sm:rounded-lg overflow-hidden relative"
    >
      <UTable
        :data="readings"
        :columns="columns"
        :loading="loading"
        class="h-full"
      >
        <template #createdAt-cell="{ row }">
          {{ formatDate(row.original.createdAt) }}
        </template>

        <template #label-cell="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ row.original.meter?.label || "-" }}
          </span>
        </template>

        <template #processing_status-cell="{ row }">
          <UBadge
            :color="
              row.original.processing_status === 'parsed'
                ? 'primary'
                : row.original.processing_status === 'error'
                  ? 'error'
                  : 'neutral'
            "
          >
            {{ row.original.processing_status }}
          </UBadge>
        </template>

        <template #recordsData-cell="{ row }">
          <div class="flex flex-col gap-1 text-xs">
            <div
              v-if="!row.original.records || row.original.records.length === 0"
              class="text-gray-400 italic"
            >
              Keine Daten
            </div>
            <div
              v-else
              v-for="(rec, i) in row.original.records"
              :key="i"
              class="flex gap-2"
            >
              <span class="font-semibold">{{ rec.kategorie }}:</span>
              <span
                >{{ rec.wert_formatiert || rec.wert_roh }}
                {{ rec.einheit || "" }}</span
              >
            </div>
          </div>
        </template>

        <template #actions-cell="{ row }">
          <UButton
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            size="xs"
            @click="deleteReading(row.original.id)"
          />
        </template>
      </UTable>
    </div>
  </div>
</template>
