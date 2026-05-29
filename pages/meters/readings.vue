<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

const meterApi = useMeterApi();

const readings = ref<any[]>([]);
const loading = ref(false);
const maxHistoryIndex = 11;

const columns = [
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
      const [category, unit] = key.split("|");
      const hasValidCategory = !!category && category !== "Unbekannt";
      const hasValidUnit = unit !== "Bitmaske" && unit !== "Datum/Zeit" && unit !== "Datum";
      if (!hasValidCategory || !hasValidUnit) {
        return;
      }
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

    const [kategorie = "Messwert", einheit = ""] = (preferredKey || "").split(
      "|",
    );

    return {
      meter_id: meterId,
      label: sortedReadings[0]?.meter?.label || meterId,
      group: sortedReadings[0]?.meter?.group || null,
      count: sortedReadings.length,
      points: normalizedPoints,
      minValue,
      maxValue,
      kategorie,
      einheit,
      sourceDate: chartReading?.createdAt || "",
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
        </UCard>
      </div>
    </div>

    <div
      class="flex-1 flex flex-col min-h-0 bg-white ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-800 shadow sm:rounded-lg overflow-hidden relative">
      <UTable :data="readings" :columns="columns" :loading="loading" class="h-full">
        <template #createdAt-cell="{ row }">
          {{ formatDate(row.original.createdAt) }}
        </template>

        <template #label-cell="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ row.original.meter?.label || "-" }}
          </span>
        </template>

        <template #processing_status-cell="{ row }">
          <UBadge :color="row.original.processing_status === 'parsed'
            ? 'primary'
            : row.original.processing_status === 'error'
              ? 'error'
              : 'neutral'
            ">
            {{ row.original.processing_status }}
          </UBadge>
        </template>

        <template #recordsData-cell="{ row }">
          <div class="flex flex-col gap-1 text-xs">
            <div v-if="!row.original.records || row.original.records.length === 0" class="text-gray-400 italic">
              Keine Daten
            </div>
            <div v-else v-for="(rec, i) in row.original.records" :key="i" class="flex gap-2">
              <span class="font-semibold">{{ rec.kategorie }}:</span>
              <span>{{ rec.wert_formatiert || rec.wert_roh }}
                {{ rec.einheit || "" }}</span>
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
