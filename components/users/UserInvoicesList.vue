<template>
  <div class="flex flex-col h-full">
    <div class="px-6 py-4 border-b border-neutral-100">
      <h3 class="font-semibold text-neutral-900">Rechnungen</h3>
    </div>

    <div class="w-full overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Nummer</th>
            <th class="pb-3 pr-4 font-medium">Datum</th>
            <th class="pb-3 pr-4 font-medium">Betrag</th>
            <th class="pb-3 pr-4 font-medium">Status</th>
            <th class="pb-3 font-medium text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!invoices || invoices.length === 0">
            <td colspan="5" class="py-12 text-center text-neutral-500">
              Keine Rechnungen vorhanden.
            </td>
          </tr>
          <tr
            v-for="inv in invoices"
            :key="inv.id"
            class="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
          >
            <td class="py-4 pr-4 font-mono text-xs text-neutral-600">{{ inv.invoice_number }}</td>
            <td class="py-4 pr-4 text-neutral-900">{{ formatDate(inv.createdAt) }}</td>
            <td class="py-4 pr-4 font-medium text-neutral-900">{{ inv.total_amount }} €</td>
            <td class="py-4 pr-4">
              <span :class="getStatusClass(inv.status)">
                {{ getStatusTranslation(inv.status) }}
              </span>
            </td>
            <td class="py-4 text-right">
              <button
                @click="$emit('download', inv.id)"
                class="text-brand-accent hover:underline text-xs font-medium"
              >
                Download PDF
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ invoices: any[] }>()
defineEmits(['download'])

const formatDate = (iso: string) => new Date(iso).toLocaleDateString('de-DE')

const getStatusClass = (status: string) => {
  if (status === "PAID") return "text-emerald-600";
  if (status === "OVERDUE") return "text-red-600";
  if (status === "PENDING" || status === "SENT") return "text-amber-600";
  return "text-neutral-500";
};

const getStatusTranslation = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "Entwurf";
    case "SENT":
      return "Versendet";
    case "PAID":
      return "Bezahlt";
    case "OVERDUE":
      return "Überfällig";
    case "DELETED":
      return "Gelöscht";
    default:
      return status;
  }
};
</script>
