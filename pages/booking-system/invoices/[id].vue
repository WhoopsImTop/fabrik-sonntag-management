<template>
  <div class="p-4" v-if="invoice">
    <!-- Header Actions -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Rechnung erstellen</h1>
      <div class="flex items-center gap-2">
        <label class="flex items-center cursor-pointer select-none" @click="isNetto = !isNetto">
          <div class="relative">
             <div class="block w-14 h-8 rounded-full border border-gray-300" :class="isNetto ? 'bg-gray-200' : 'bg-white'"></div>
             <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition border border-gray-300 transform" :class="isNetto ? 'translate-x-full border-green-500' : 'translate-x-0'"></div>
          </div>
          <div class="ml-3 text-sm font-medium text-gray-700 flex gap-2">
              <span :class="!isNetto ? 'font-bold text-black' : 'text-gray-400'">Brutto</span>
              <span :class="isNetto ? 'font-bold text-black' : 'text-gray-400'">Netto</span>
          </div>
        </label>
        
        <button @click="saveChanges" class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded shadow-sm text-sm">
            Speichern
        </button>
      </div>
    </div>

    <!-- Main Form Area -->
    <div class="bg-white rounded-lg shadow-sm border border-black/5 p-6 mb-6">
        
        <!-- Top Section: Customer & Meta Data -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Left: Customer Address -->
            <div class="space-y-4">
                <div class="relative group">
                     <label class="text-xs text-gray-500 absolute -top-2 left-2 bg-white px-1">Kunde</label>
                     <input v-model="form.recipientData.firstName" placeholder="Vorname" class="w-1/2 p-3 border rounded-t text-sm focus:outline-none focus:border-blue-500 border-gray-300" />
                     <input v-model="form.recipientData.lastName" placeholder="Nachname" class="w-1/2 p-3 border rounded-t border-l-0 text-sm focus:outline-none focus:border-blue-500 border-gray-300" />
                </div>
                <!-- Company/Extra -->
                <input v-model="form.recipientData.company" placeholder="Adresszusatz / Firma" class="w-full p-3 border rounded text-sm focus:outline-none focus:border-blue-500 border-gray-300" />
                
                <!-- Street -->
                <input v-model="form.recipientData.street" placeholder="Straße" class="w-full p-3 border rounded text-sm focus:outline-none focus:border-blue-500 border-gray-300" />
                
                <!-- ZIP / City -->
                <div class="flex">
                    <input v-model="form.recipientData.zip" placeholder="PLZ" class="w-1/3 p-3 border rounded-l text-sm focus:outline-none focus:border-blue-500 border-gray-300" />
                    <input v-model="form.recipientData.city" placeholder="Ort" class="w-2/3 p-3 border rounded-r border-l-0 text-sm focus:outline-none focus:border-blue-500 border-gray-300" />
                </div>

                <!-- Country -->
                <div class="relative">
                    <UIcon name="i-lucide-globe" class="absolute left-3 top-3.5 text-gray-400" size="16" />
                    <input v-model="form.recipientData.country" placeholder="Land" class="w-full p-3 pl-10 border rounded text-sm focus:outline-none focus:border-blue-500 border-gray-300" />
                </div>
            </div>

            <!-- Right: Invoice Meta -->
            <div class="space-y-4">
                <!-- Invoice Number (Readonly likely) -->
                <div class="relative">
                    <label class="text-xs text-gray-400 absolute -top-2 left-2 bg-white px-1">Rechnungsnummer</label>
                    <input v-model="form.invoiceNumber" readonly class="w-full p-3 border rounded text-sm bg-gray-50 text-gray-500 border-gray-200" />
                </div>


                <!-- Date -->
                <div class="relative">
                    <label class="text-xs text-gray-400 absolute -top-2 left-2 bg-white px-1">Datum</label>
                    <input type="date" :value="formatDateInput(form.invoiceDate)" @input="e => form.invoiceDate = e.target.value" class="w-full p-3 border rounded text-sm focus:outline-none focus:border-blue-500 border-gray-300" />
                </div>

                <!-- Delivery Date -->
                <div class="flex gap-4">
                    <div class="w-1/3">
                         <select class="w-full p-3 border rounded text-sm bg-white border-gray-300">
                             <option>Leistungszeitraum</option>
                         </select>
                    </div>
                    <div class="flex-1 flex items-center gap-2">
                        <input type="date" :value="formatDateInput(form.deliveryDateStart)" @input="e => form.deliveryDateStart = e.target.value" class="w-1/2 p-3 border rounded text-sm border-gray-300" />
                        <span class="text-xs text-gray-500">bis</span>
                        <input type="date" :value="formatDateInput(form.deliveryDateEnd)" @input="e => form.deliveryDateEnd = e.target.value" class="w-1/2 p-3 border rounded text-sm border-gray-300" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Texts -->
        <div class="mb-8 space-y-4">
            <div class="relative">
                 <label class="text-xs text-gray-400 absolute -top-2 left-2 bg-white px-1">Belegtitel</label>
                 <input v-model="form.title" class="w-full p-3 border rounded text-sm font-bold border-gray-300" />
            </div>
             <div class="relative">
                 <label class="text-xs text-gray-400 absolute -top-2 left-2 bg-white px-1">Einleitungstext</label>
                 <textarea v-model="form.introText" class="w-full p-3 border rounded text-sm border-gray-300" rows="2"></textarea>
            </div>
        </div>

        <!-- Items Table -->
        <div class="border rounded-lg overflow-hidden mb-8">
            <div class="bg-gray-50 p-2 text-xs font-bold text-gray-500 flex gap-4 uppercase tracking-wider border-b">
                <div class="w-10 text-center">#</div>
                <div class="flex-1">Artikel</div>
                <div class="w-24 text-right">Menge</div>
                <div class="w-24">Einheit</div>
                <div class="w-32 text-right">VK ({{ isNetto ? 'Netto' : 'Brutto' }})</div>
                <div class="w-24 text-right">Rabatt %</div>
                <div class="w-32 text-right font-bold text-black border-l pl-2 bg-gray-100">Gesamt</div>
                <div class="w-10"></div>
            </div>
            
            <div class="divide-y">
                <div v-for="(item, idx) in form.items" :key="idx" class="p-2 flex gap-4 items-start hover:bg-gray-50 transition group">
                     <div class="w-10 text-center py-2 text-sm text-gray-400">{{ idx + 1 }}</div>
                     
                     <div class="flex-1">
                         <input v-model="item.title" class="w-full p-2 border rounded text-sm mb-1 border-gray-300" placeholder="Bezeichnung" />
                         <textarea v-model="item.description" class="w-full p-2 border rounded text-xs text-gray-500 border-gray-300" rows="1" placeholder="Beschreibung"></textarea>
                     </div>
                     
                     <div class="w-24">
                         <input v-model.number="item.quantity" type="number" class="w-full p-2 border rounded text-sm text-right border-gray-300" />
                     </div>
                     
                     <div class="w-24">
                         <input v-model="item.unit" class="w-full p-2 border rounded text-sm border-gray-300" placeholder="Stk" />
                     </div>
                     
                     <div class="w-32">
                         <input v-model.number="item.unitPrice" type="number" step="0.01" class="w-full p-2 border rounded text-sm text-right border-gray-300" />
                     </div>

                     <div class="w-24">
                         <input v-model.number="item.discount" type="number" step="0.1" class="w-full p-2 border rounded text-sm text-right border-gray-300" />
                     </div>
                     
                     <div class="w-32 text-right py-2 font-bold text-sm bg-gray-50 border-l border-gray-100">
                         {{ getDisplayPrice(calculateItemTotal(item)).toFixed(2) }} €
                     </div>
                     
                     <div class="w-10 text-right py-2 opacity-0 group-hover:opacity-100 cursor-pointer text-red-400 hover:text-red-600" @click="removeItem(idx)">
                         <UIcon name="i-lucide-trash-2" size="16" />
                     </div>
                </div>
            </div>
            <div class="p-4 bg-gray-50 border-t flex justify-center gap-4">
                <button @click="addItem" class="text-green-600 hover:text-green-700 font-bold text-sm flex items-center gap-2 border border-green-200 bg-white px-4 py-2 rounded shadow-sm hover:shadow">
                    <UIcon name="i-lucide-plus" size="16" /> ARTIKEL
                </button>
                <select @change="addServiceItem" v-model="selectedService" class="text-sm border border-gray-300 rounded px-3 py-2 bg-white">
                    <option value="">+ Service hinzufügen</option>
                    <option v-for="svc in availableServices" :key="svc.id" :value="svc.id">{{ svc.name }} ({{ svc.price }} €)</option>
                </select>
            </div>
        </div>

        <!-- Totals Footer -->
        <div class="bg-neutral-800 text-white p-6 rounded-lg flex justify-between items-center shadow-lg">
             <div class="text-sm text-gray-400">
                 <p>Alle Preise zzgl. gesetzlicher MwSt.</p>
             </div>
             <div class="text-right">
                 <div class="text-sm text-gray-400 mb-1">Gesamtbetrag {{ isNetto ? '(Netto)' : '(Brutto)' }}</div>
                 <div class="text-4xl font-bold">{{ getDisplayPrice(calculateNetTotal()).toFixed(2) }} €</div>
                 <div class="text-xs text-gray-500 mt-1" v-if="!isNetto">davon MwSt (19%): {{ (calculateNetTotal() * 0.19).toFixed(2) }} €</div>
                 <div class="text-xs text-gray-500 mt-1" v-else>zzgl. MwSt (19%): {{ (calculateNetTotal() * 0.19).toFixed(2) }} €</div>
             </div>
        </div>

        <!-- Footer Texts -->
        <div class="mt-8 space-y-4">
             <div class="relative">
                 <label class="text-xs text-gray-400 absolute -top-2 left-2 bg-white px-1">Zahlungsbedingung</label>
                 <textarea v-model="form.paymentTerms" class="w-full p-3 border rounded text-sm border-gray-300" rows="2"></textarea>
            </div>
            <div class="relative">
                 <label class="text-xs text-gray-400 absolute -top-2 left-2 bg-white px-1">Nachbemerkung</label>
                 <textarea v-model="form.outroText" class="w-full p-3 border rounded text-sm border-gray-300" rows="2"></textarea>
            </div>
        </div>

    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const isNetto = ref(true); // Default to Net logic (all prices stored as Netto)
const hasChanges = ref(false);

// Services
const availableServices = ref([]);
const selectedService = ref('');

const form = ref({
    invoiceNumber: '',
    title: 'Rechnung',
    introText: 'Unsere Leistungen stellen wir Ihnen wie folgt in Rechnung.',
    outroText: 'Vielen Dank für die gute Zusammenarbeit.',
    paymentTerms: 'Die Rechnung ist sofort fällig. Zahlbar innerhalb von 7 Tagen ab Rechnungsdatum.',
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryDateStart: '',
    deliveryDateEnd: '',
    recipientData: {
        firstName: '', lastName: '', street: '', zip: '', city: '', country: '', company: ''
    },
    items: []
});

const invoice = ref(null);

const fetchServices = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/services`);
        if (res.ok) {
            availableServices.value = await res.json();
        }
    } catch (e) {
        console.error('Failed to fetch services', e);
    }
};

const fetchInvoice = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/invoices/${route.params.id}`, {
             headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` }
        });
        if (res.ok) {
            const data = await res.json();
            invoice.value = data;
            
            // Map data to form
            form.value.invoiceNumber = data.invoiceNumber;
            form.value.title = data.title || 'Rechnung';
            form.value.introText = data.introText || form.value.introText;
            form.value.outroText = data.outroText || form.value.outroText;
            form.value.paymentTerms = data.paymentTerms || form.value.paymentTerms;
            form.value.invoiceDate = data.invoiceDate ? data.invoiceDate.split('T')[0] : form.value.invoiceDate;
            form.value.deliveryDateStart = data.deliveryDateStart ? data.deliveryDateStart.split('T')[0] : '';
            form.value.deliveryDateEnd = data.deliveryDateEnd ? data.deliveryDateEnd.split('T')[0] : '';
            
            if (data.recipientData) {
                const parsed = typeof data.recipientData === 'string' ? JSON.parse(data.recipientData) : data.recipientData;
                form.value.recipientData = { ...form.value.recipientData, ...parsed };
            }

            form.value.items = data.items.map(i => ({
                ...i,
                discount: i.discount || 0,
                unit: i.unit || 'Stk',
                quantity: parseFloat(i.quantity),
                unitPrice: parseFloat(i.unitPrice)
            }));
        }
    } catch (e) {
        console.error(e);
        alert('Fehler beim Laden');
    }
};

const addItem = () => {
    form.value.items.push({
        title: '',
        description: '',
        quantity: 1,
        unit: 'Stk',
        unitPrice: 0,
        discount: 0,
        taxRate: 19
    });
};

const addServiceItem = () => {
    if (!selectedService.value) return;
    
    const svc = availableServices.value.find(s => s.id == selectedService.value);
    if (svc) {
        form.value.items.push({
            title: svc.name,
            description: svc.description || '',
            quantity: 1,
            unit: 'Stk',
            unitPrice: parseFloat(svc.price), // Prices are Netto
            discount: 0,
            taxRate: 19
        });
    }
    
    selectedService.value = ''; // Reset dropdown
};

const removeItem = (idx) => {
    form.value.items.splice(idx, 1);
};

// Brutto/Netto Display Logic
// All prices in DB are Netto. If isNetto=false (Brutto mode), display with +19%
const getDisplayPrice = (nettoPrice) => {
    if (isNetto.value) {
        return nettoPrice;
    } else {
        return nettoPrice * 1.19;
    }
};

// Calculations (always work with Netto internally)
const calculateItemTotal = (item) => {
    const qty = item.quantity || 0;
    const price = item.unitPrice || 0; // Netto
    const discount = item.discount || 0;
    return qty * price * (1 - discount / 100);
};

const calculateNetTotal = () => {
    return form.value.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
};

const calculateGrandTotal = () => {
    const net = calculateNetTotal();
    return net * 1.19; // Always Brutto for saving
};

const saveChanges = async () => {
    try {
        const payload = {
            ...form.value,
            totalAmount: calculateGrandTotal(), // Brutto
            taxAmount: calculateNetTotal() * 0.19
        };
        
        const res = await fetch(`${import.meta.env.VITE_INTERNAL_API_URL}/invoices/${invoice.value.id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt')}` 
            },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            alert('Gespeichert');
            hasChanges.value = false;
        } else {
            alert('Fehler beim Speichern');
        }
    } catch (e) {
        console.error(e);
        alert('Fehler beim Speichern');
    }
};

const formatDateInput = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
};

onMounted(async () => {
    await fetchServices();
    await fetchInvoice();
    nextTick(() => hasChanges.value = false);
});

watch(form, () => hasChanges.value = true, { deep: true });
</script>

<style scoped>
/* Custom Switch Style */
.dot {
    transition: all 0.3s;
}
</style>
