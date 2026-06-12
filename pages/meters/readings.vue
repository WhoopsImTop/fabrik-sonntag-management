<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
  extractHistoricalPointsFromParsed,
  extractTimeSeriesPoints,
  resolveMeterChartSeries,
} from "~/composables/useMeterChartMetrics";

const meterApi = useMeterApi();

const readings = ref<any[]>([]);
const loading = ref(false);

const columns = [
  { accessorKey: "timestamp", header: "Zeitstempel" },
  { accessorKey: "createdAt", header: "Empfangen am" },
  { accessorKey: "label", header: "Name" },
  { accessorKey: "meter_id", header: "Meter ID" },
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

const expandedGroups = ref<Record<string, boolean>>({});

const formatParsedValue = (value: unknown): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const getDisplayRecords = (reading: any) => {
  const items: { label: string; value: string }[] = [];

  if (reading.value_kwh != null) {
    items.push({ label: "Energie", value: `${reading.value_kwh} kWh` });
  }
  if (reading.value_m3 != null) {
    items.push({ label: "Volumen", value: `${reading.value_m3} m³` });
  }

  const parsed = reading.parsed_json;
  if (parsed && typeof parsed === "object") {
    const skipKeys = new Set([
      "id",
      "meter_id",
      "media",
      "meter",
      "mfct",
      "manufacturer",
      "timestamp",
      "total_kwh",
      "total_m3",
    ]);
    Object.entries(parsed).forEach(([key, value]) => {
      if (skipKeys.has(key)) return;
      if (value === null || value === undefined || value === "") return;
      items.push({ label: key, value: formatParsedValue(value) });
    });
  }

  return items;
};

const meterCharts = computed(() => {
  const grouped = new Map<string, any[]>();

  readings.value?.forEach((reading) => {
    if (!reading.meter_id) return;
    if (!grouped.has(reading.meter_id)) {
      grouped.set(reading.meter_id, []);
    }
    grouped.get(reading.meter_id)?.push(reading);
  });

  return Array.from(grouped.entries()).map(([meterId, meterReadings]) => {
    const sortedReadings = [...meterReadings].sort(
      (a, b) =>
        new Date(b.timestamp || b.createdAt).getTime() -
        new Date(a.timestamp || a.createdAt).getTime(),
    );
    const latestReading = sortedReadings[0];

    const historical = extractHistoricalPointsFromParsed(latestReading);
    let points = historical.points;
    let series = historical.series;

    if (points.length < 2) {
      series =
        series ||
        resolveMeterChartSeries(latestReading?.parsed_json, latestReading);
      if (series) {
        points = extractTimeSeriesPoints(meterReadings, series);
      }
    }

    const values = points.map((point) => point.value);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 0;

    return {
      meter_id: meterId,
      label: latestReading?.meter?.label || meterId,
      group: latestReading?.meter?.group || null,
      count: sortedReadings.length,
      points,
      minValue,
      maxValue,
      kategorie: series?.kategorie || "Messwert",
      einheit: series?.einheit || "",
      sourceDate: latestReading?.timestamp || latestReading?.createdAt || "",
    };
  });
});

const groupedMeterCharts = computed(() => {
  const grouped = new Map<string, { id: string; code: string; name: string; meters: any[] }>();

  meterCharts.value.forEach((meter) => {
    const groupId = meter.group?.id ? String(meter.group.id) : "ungrouped";
    const groupCode = meter.group?.code || "Ohne Gruppe";
    const groupName = meter.group?.name || "";
    if (!grouped.has(groupId)) {
      grouped.set(groupId, {
        id: groupId,
        code: groupCode,
        name: groupName,
        meters: [],
      });
    }
    grouped.get(groupId)?.meters.push(meter);
  });

  return [...grouped.values()].sort((a, b) => a.code.localeCompare(b.code));
});

watch(groupedMeterCharts, (groups) => {
  groups.forEach((group) => {
    if (expandedGroups.value[group.id] === undefined) {
      expandedGroups.value[group.id] = true;
    }
  });
});

const toggleGroup = (groupId: string) => {
  expandedGroups.value[groupId] = !expandedGroups.value[groupId];
};

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
</script>

<template>
  <div class="h-auto flex flex-col">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Zählerstände (Readings)</h1>
      <div class="flex gap-2">
        <UButton color="error" variant="outline" icon="i-lucide-trash-2" @click="deleteAllReadings"
          :disabled="readings.length === 0">
          Alle Löschen
        </UButton>
        <UButton color="neutral" variant="solid" icon="i-lucide-refresh-cw" @click="loadReadings">
          Aktualisieren
        </UButton>
      </div>
    </div>

    <div class="flex flex-col">
      <div v-if="groupedMeterCharts.length" class="space-y-4 mb-6">
        <UCard v-for="group in groupedMeterCharts" :key="group.id">
          <template #header>
            <button class="w-full flex items-center justify-between text-left" @click="toggleGroup(String(group.id))">
              <div>
                <div class="font-semibold">{{ group.code }}</div>
                <div class="text-xs text-gray-500">
                  {{ group.name || "Ohne Bezeichnung" }} | {{ group.meters.length }} Meter
                </div>
              </div>
              <UIcon :name="expandedGroups[group.id] ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" />
            </button>
          </template>

          <div v-if="expandedGroups[group.id]" class="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <UCard v-for="meter in group.meters" :key="meter.meter_id">
              <template #header>
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <div class="font-semibold">{{ meter.label }}</div>
                    <div class="text-xs text-gray-500">
                      {{ meter.meter_id }} | {{ meter.count }} Readings
                    </div>
                  </div>
                  <UBadge color="neutral">
                    {{ meter.kategorie }} {{ meter.einheit || "-" }}
                  </UBadge>
                </div>
              </template>

              <div v-if="meter.points.length >= 2" class="space-y-2">
                <div
                  class="rounded border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800"
                >
                  <ClientOnly>
                    <MetersMeterReadingChart
                      :points="meter.points"
                      :einheit="meter.einheit"
                    />
                  </ClientOnly>
                </div>
                <div class="text-xs text-gray-500 flex justify-between">
                  <span>Min: {{ meter.minValue.toFixed(3) }}</span>
                  <span>Max: {{ meter.maxValue.toFixed(3) }}</span>
                  <span>
                    Letzter:
                    {{ meter.points[meter.points.length - 1]?.formatted }}
                    {{ meter.einheit || "-" }}
                  </span>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500">
                Für diesen Zähler liegen noch nicht genug Werte für eine Kurve vor.
              </div>
            </UCard>
          </div>
        </UCard>
      </div>
    </div>

    <div
      class="flex-1 flex flex-col min-h-0 bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 shadow sm:rounded-lg overflow-hidden relative">
      <UTable :data="readings" :columns="columns" :loading="loading" class="h-full">
        <template #timestamp-cell="{ row }">
          {{ formatDate(row.original.timestamp) }}
        </template>

        <template #createdAt-cell="{ row }">
          {{ formatDate(row.original.createdAt) }}
        </template>

        <template #label-cell="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ row.original.meter?.label || "-" }}
          </span>
        </template>

        <template #recordsData-cell="{ row }">
          <div class="flex flex-col gap-1 text-xs">
            <div v-if="getDisplayRecords(row.original).length === 0" class="text-gray-400 italic">
              Keine Daten
            </div>
            <div v-else v-for="(rec, i) in getDisplayRecords(row.original)" :key="i" class="flex gap-2">
              <span class="font-semibold">{{ rec.label }}:</span>
              <span>{{ rec.value }}</span>
            </div>
          </div>
        </template>

        <template #actions-cell="{ row }">
          <UButton color="error" variant="ghost" icon="i-lucide-trash-2" size="xs"
            @click="deleteReading(row.original.id)" />
        </template>
      </UTable>
    </div>
  </div>
</template>
