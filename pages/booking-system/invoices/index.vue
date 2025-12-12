<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">Rechnungen</h1>
      <!-- Maybe a manual create button later -->
    </div>

    <!-- Invoices Table -->
    <table class="w-full rounded-lg overflow-hidden border border-black/10 shadow-sm bg-white">
      <thead class="bg-neutral-50">
        <tr class="text-left">
          <th class="px-3 py-1.5 text-sm">Nr.</th>
          <th class="px-3 py-1.5 text-sm">Empfänger</th>
          <th class="px-3 py-1.5 text-sm">Datum</th>
          <th class="px-3 py-1.5 text-sm">Status</th>
          <th class="px-3 py-1.5 text-sm text-right">Betrag</th>
          <th class="px-3 py-1.5 text-sm text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="invoice in invoices" :key="invoice.id" class="border-t border-black/10">
          <td class="px-3 py-2 text-sm font-mono">{{ invoice.invoiceNumber }}</td>
          <td class="px-3 py-2 text-sm">{{ getRecipientName(invoice) }}</td>
          <td class="px-3 py-2 text-sm">{{ formatDate(invoice.createdAt) }}</td>
          <td class="px-3 py-2 text-sm">
            <span :class="getStatusClass(invoice.status)" class="px-2 py-1 rounded text-xs border border-black/10">
              {{ getStatusLabel(invoice.status) }}
            </span>
          </td>
          <td class="px-3 py-2 text-sm text-right font-medium">{{ invoice.totalAmount }} €</td>
          <td class="px-3 py-2 text-sm flex items-center gap-1 justify-end">
            <NuxtLink
              :to="`/booking-system/invoices/${invoice.id}`"
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              title="Details & Bearbeiten"
            >
              <UIcon name="i-lucide-pencil" size="16" />
            </NuxtLink>
            <!-- Inline Send Action for Drafts -->
            <button
              v-if="invoice.status === 'draft'"
              @click="sendInvoice(invoice)"
              class="p-1 rounded-lg bg-neutral-50 hover:bg-green-100 text-green-700 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              title="Versenden"
            >
              <UIcon name="i-lucide-send" size="16" />
            </button>
          </td>
        </tr>
        <tr v-if="invoices.length === 0">
          <td colspan="6" class="px-3 py-4 text-sm text-center text-neutral-500">
            Keine Rechnungen gefunden
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const invoices = ref([]);

const fetchInvoices = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/invoices`, {
       headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      }
    });
    if (res.ok) {
      invoices.value = await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
  }
};

const sendInvoice = async (invoice) => {
  if (!confirm(`Rechnung ${invoice.invoiceNumber} jetzt versenden?`)) return;
  
  try {
    const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/invoices/${invoice.id}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      }
    });
    
    if (res.ok) {
        alert('Rechnung versendet');
        fetchInvoices();
    } else {
        alert('Fehler beim Versenden');
    }
  } catch (error) {
      console.error(error);
      alert('Fehler beim Versenden');
  }
}

const getRecipientName = (invoice) => {
  if (invoice.recipientData) {
      // Assuming recipientData is JSON object
      const data = typeof invoice.recipientData === 'string' ? JSON.parse(invoice.recipientData) : invoice.recipientData;
      return `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email;
  }
  return 'Unbekannt';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('de-DE');
};

const getStatusClass = (status) => {
  const map = {
      draft: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
  };
  return map[status] || 'bg-gray-100';
};

const getStatusLabel = (status) => {
    const map = {
        draft: 'Entwurf',
        sent: 'Versendet',
        paid: 'Bezahlt',
        cancelled: 'Storniert'
    };
    return map[status] || status;
};

onMounted(() => {
  fetchInvoices();
});
</script>
