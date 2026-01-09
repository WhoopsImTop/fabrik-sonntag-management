<template>
  <div class="flex flex-col h-full">
    <div class="px-6 py-4 border-b border-slate-100">
      <h3 class="font-semibold text-slate-900">Rechnungen</h3>
    </div>
    
    <div v-if="!invoices || invoices.length === 0" class="p-8 text-center text-slate-500">
      Keine Rechnungen vorhanden.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm text-left">
        <thead class="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
          <tr>
            <th class="px-6 py-3">Nummer</th>
            <th class="px-6 py-3">Datum</th>
            <th class="px-6 py-3">Betrag</th>
            <th class="px-6 py-3">Status</th>
            <th class="px-6 py-3 text-right">Aktion</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-slate-50/50 transition-colors">
            <td class="px-6 py-3 font-mono text-xs text-slate-600">{{ inv.invoice_number }}</td>
            <td class="px-6 py-3 text-slate-900">{{ formatDate(inv.createdAt) }}</td>
            <td class="px-6 py-3 font-medium text-slate-900">{{ inv.total_amount }} €</td>
            <td class="px-6 py-3">
               <span :class="['inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', inv.status === 'PAID' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700']">
                {{ getStatusTranslation(inv.status) }}
              </span>
            </td>
            <td class="px-6 py-3 text-right">
              <button @click="$emit('download', inv.id)" class="text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium">
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

const getStatusTranslation = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "ENTWURF";
    case "SENT":
      return "VERSENDET";
    case "PAID":
      return "BEZAHLT";
    case "OVERDUE":
      return "ÜBERFÄLLIG";
    case "DELETED":
      return "GELÖSCHT";
    default:
      return status;
  }
};
</script>