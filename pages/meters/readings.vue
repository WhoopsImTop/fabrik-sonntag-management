<script setup lang="ts">
import { ref, onMounted } from "vue";

const meterApi = useMeterApi();

const readings = ref<any[]>([]);
const loading = ref(false);

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

const uniqueReadings = computed(() => {
  const map = new Map();

  readings.value?.forEach((r) => {
    if (!map.has(r.meter_id)) {
      map.set(r.meter_id, {
        meter_id: r.meter_id,
        label: r.meter?.label,
        count: 0,
      });
    }

    map.get(r.meter_id).count++;
  });

  return Array.from(map.values());
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
      <ul>
        <li v-for="reading in uniqueReadings" :key="reading.meter_id">
          {{ reading.label }} ({{ reading.meter_id }}) | {{ reading.count }}
        </li>
      </ul>
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
