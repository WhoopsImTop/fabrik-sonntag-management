<template>
  <div class="flex flex-col h-full">
    <div class="px-6 py-4 border-b border-neutral-100">
      <h3 class="font-semibold text-neutral-900">Buchungshistorie</h3>
    </div>

    <div class="w-full overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Ressource</th>
            <th class="pb-3 pr-4 font-medium">Datum</th>
            <th class="pb-3 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!bookings || bookings.length === 0">
            <td colspan="3" class="py-12 text-center text-neutral-500">
              Keine Buchungen vorhanden.
            </td>
          </tr>
          <tr
            v-for="b in bookings"
            :key="b.id"
            class="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
          >
            <td class="py-4 pr-4 font-medium text-neutral-900">
              {{ b.Resource?.name || "Gelöscht" }}
            </td>
            <td class="py-4 pr-4 text-neutral-700">
              {{ formatDate(b.start_at) }}
              <span class="text-xs text-neutral-400 block"
                >{{ formatTime(b.start_at) }} - {{ formatTime(b.end_at) }}</span
              >
            </td>
            <td class="py-4 text-right">
              <span :class="getStatusClasses(b.status)">
                {{ getStatusTranslation(b.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ bookings: any[] }>();

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("de-DE");
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatusClasses = (status: string) => {
  if (status === "CONFIRMED") return "text-emerald-600";
  if (status === "PENDING") return "text-amber-600";
  if (status === "CANCELLED") return "text-neutral-400";
  return "text-neutral-500";
};

const getStatusTranslation = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return "Bestätigt";
    case "PENDING":
      return "Angefragt";
    case "CANCELLED":
      return "Storniert";
    default:
      return status;
  }
};
</script>
