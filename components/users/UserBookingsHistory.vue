<template>
  <div class="flex flex-col h-full">
    <div class="px-6 py-4 border-b border-slate-100">
      <h3 class="font-semibold text-slate-900">Buchungshistorie</h3>
    </div>

    <div
      v-if="!bookings || bookings.length === 0"
      class="p-8 text-center text-slate-500"
    >
      Keine Buchungen vorhanden.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead
          class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200"
        >
          <tr>
            <th class="px-6 py-3">Ressource</th>
            <th class="px-6 py-3">Datum</th>
            <th class="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="b in bookings"
            :key="b.id"
            class="hover:bg-slate-50/50 transition-colors"
          >
            <td class="px-6 py-3 font-medium text-slate-900">
              {{ b.Resource?.name || "Gelöscht" }}
            </td>
            <td class="px-6 py-3 text-slate-600">
              {{ formatDate(b.start_at) }}
              <span class="text-xs text-slate-400 block"
                >{{ formatTime(b.start_at) }} - {{ formatTime(b.end_at) }}</span
              >
            </td>
            <td class="px-6 py-3">
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  getStatusClasses(b.status),
                ]"
              >
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
  if (status === "CONFIRMED") return "bg-emerald-50 text-emerald-700";
  if (status === "PENDING") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-500";
};

const getStatusTranslation = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return "BESTÄTIGT";
    case "PENDING":
      return "ANGEFRAGT";
    case "CANCELLED":
      return "STORNIERT";
    default:
      return status;
  }
};
</script>