<template>
  <div class="space-y-6 pb-20">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">Mitgliedschaften</h1>
        <p class="text-slate-500 mt-1">Verwalten Sie Status-Level und automatische Rabattregeln.</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-none bg-brand-accent px-4 py-2 text-sm font-semibold text-neutral-900 transition-colors hover:brightness-95"
        @click="openTypeModal()"
      >
        <UiIcon name="i-lucide-plus" class="size-4" />
        Neuer Typ
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-200 text-neutral-500">
            <th class="pb-3 pr-4 font-medium">Name</th>
            <th class="pb-3 pr-4 font-medium">Beschreibung</th>
            <th class="pb-3 pr-4 font-medium">Rabatte</th>
            <th class="pb-3 font-medium text-right">Aktion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="py-12 text-center text-neutral-500">Lädt…</td>
          </tr>
          <tr v-else-if="types.length === 0">
            <td colspan="4" class="py-12 text-center text-neutral-500">
              Keine Mitgliedschaften. Legen Sie Status-Level an, um Kunden Rabatte zu gewähren.
            </td>
          </tr>
          <tr
            v-for="type in types"
            :key="type.id"
            class="group border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
          >
            <td class="py-4 pr-4 font-medium text-neutral-900">
              {{ type.name }}
            </td>
            <td class="max-w-xs truncate py-4 pr-4 text-neutral-600">
              {{ type.description || "—" }}
            </td>
            <td class="py-4 pr-4">
              <div
                v-if="type.DiscountRules?.length"
                class="flex flex-col gap-1"
              >
                <div
                  v-for="rule in type.DiscountRules"
                  :key="rule.id"
                  class="inline-flex items-center gap-2 text-neutral-700"
                >
                  <span>{{ getCategoryName(rule.target_resource_category_id) }}</span>
                  <span class="font-medium text-neutral-900">
                    {{
                      rule.discount_percent
                        ? `-${rule.discount_percent * 100}%`
                        : `-€${rule.discount_fixed}`
                    }}
                  </span>
                  <button
                    type="button"
                    class="text-neutral-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                    title="Regel entfernen"
                    @click="deleteRule(rule.id)"
                  >
                    <UiIcon name="i-lucide-x" class="size-3.5" />
                  </button>
                </div>
              </div>
              <span v-else class="text-neutral-400">Keine Regeln</span>
            </td>
            <td class="py-4 text-right">
              <div class="flex items-center justify-end gap-3">
                <button
                  type="button"
                  class="font-medium text-brand-accent hover:underline"
                  @click="openRuleModal(type)"
                >
                  Regel +
                </button>
                <button
                  type="button"
                  class="text-neutral-500 hover:text-neutral-900"
                  title="Bearbeiten"
                  @click="openTypeModal(type)"
                >
                  <IconEdit class="size-3" />
                </button>
                <button
                  type="button"
                  class="text-neutral-400 hover:text-red-600"
                  title="Löschen"
                  @click="deleteType(type)"
                >
                  <UiIcon name="i-lucide-trash-2" class="size-3.5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showTypeModal" class="dialog-overlay" role="dialog" aria-modal="true">
      <div class="absolute inset-0" @click="showTypeModal = false"></div>

      <div class="dialog-panel max-w-md">
        <div class="dialog-header">
          <h3 class="dialog-title">
            {{ isEditingType ? 'Mitgliedschaft bearbeiten' : 'Neuer Mitgliedschaftstyp' }}
          </h3>
          <button type="button" class="dialog-close" aria-label="Schließen" @click="showTypeModal = false">
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <form @submit.prevent="saveType">
          <div class="dialog-body space-y-4">
            <div>
              <label class="dialog-label">Bezeichnung</label>
              <input
                v-model="typeForm.name"
                type="text"
                placeholder="z.B. Premium Member"
                required
                class="dialog-input"
              />
            </div>
            <div>
              <label class="dialog-label">Beschreibung</label>
              <textarea
                v-model="typeForm.description"
                rows="3"
                placeholder="Vorteile dieser Mitgliedschaft..."
                class="dialog-input min-h-[80px]"
              ></textarea>
            </div>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn-dialog-cancel" @click="showTypeModal = false">
              Abbrechen
            </button>
            <button type="submit" class="btn-dialog-primary">
              {{ isEditingType ? 'Speichern' : 'Erstellen' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showRuleModal" class="dialog-overlay" role="dialog" aria-modal="true">
      <div class="absolute inset-0" @click="showRuleModal = false"></div>

      <div class="dialog-panel max-w-md">
        <div class="dialog-header">
          <div class="min-w-0 flex-1">
            <h3 class="dialog-title">Rabatt hinzufügen</h3>
            <p class="dialog-desc">
              Für Mitgliedschaft: <span class="font-semibold text-neutral-900">{{ selectedType?.name }}</span>
            </p>
          </div>
          <button type="button" class="dialog-close" aria-label="Schließen" @click="showRuleModal = false">
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <form @submit.prevent="createRule">
          <div class="dialog-body space-y-5">
            <div>
              <label class="dialog-label">Kategorie</label>
              <select
                v-model="newRule.target_resource_category_id"
                required
                class="dialog-input"
              >
                <option :value="null">Bitte wählen...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
              <p class="mt-1 text-xs text-neutral-500">Auf welche Ressourcen-Kategorie gilt der Rabatt?</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="dialog-label">Prozentual (%)</label>
                <div class="relative">
                  <input
                    v-model.number="newRule.discount_percent"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.10"
                    class="dialog-input"
                  />
                  <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span class="text-neutral-400 text-xs">%</span>
                  </div>
                </div>
                <p class="text-[10px] text-neutral-400 mt-1">z.B. 0.10 für 10%</p>
              </div>
              <div>
                <label class="dialog-label">Fixbetrag (€)</label>
                <input
                  v-model.number="newRule.discount_fixed"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5.00"
                  class="dialog-input"
                />
                <p class="text-[10px] text-neutral-400 mt-1">Absoluter Abzug</p>
              </div>
            </div>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn-dialog-cancel" @click="showRuleModal = false">
              Abbrechen
            </button>
            <button type="submit" class="btn-dialog-primary">
              Regel speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const api = useBookingApi()

const loading = ref(true)
const types = ref<any[]>([])
const categories = ref<any[]>([])

// Type Modal
const showTypeModal = ref(false)
const isEditingType = ref(false)
const typeForm = ref<any>({ id: null, name: '', description: '' })

// Rule Modal
const showRuleModal = ref(false)
const selectedType = ref<any>(null)
const newRule = ref({
  membership_type_id: 0,
  target_resource_category_id: null,
  discount_percent: null,
  discount_fixed: null
})

const getCategoryName = (id: number) => {
  const cat = categories.value.find(c => c.id === id)
  return cat ? cat.name : 'Alle Kategorien'
}

const loadData = async () => {
  loading.value = true
  try {
    const [typesData, catsData] = await Promise.all([
      api.memberships.getTypes(),
      api.resources.getCategories()
    ])
    
    if (typesData) types.value = Array.isArray(typesData) ? typesData : []
    if (catsData) categories.value = Array.isArray(catsData) ? catsData : []
  } finally {
    loading.value = false
  }
}

// --- TYPE Actions ---

const openTypeModal = (type?: any) => {
  if (type) {
    isEditingType.value = true
    typeForm.value = { ...type }
  } else {
    isEditingType.value = false
    typeForm.value = { id: null, name: '', description: '' }
  }
  showTypeModal.value = true
}

const saveType = async () => {
  if(!typeForm.value.name) return
  let result
  
  if (isEditingType.value && typeForm.value.id) {
    result = await api.memberships.updateType(typeForm.value.id, typeForm.value)
  } else {
    result = await api.memberships.createType(typeForm.value)
  }
  
  if (result) {
    showTypeModal.value = false
    await loadData()
  }
}

const deleteType = async (type: any) => {
  if(confirm(`Möchten Sie den Typ "${type.name}" wirklich löschen?`)) {
    const res = await api.memberships.deleteType(type.id)
    if (res) await loadData()
  }
}

// --- RULE Actions ---

const openRuleModal = (type: any) => {
  selectedType.value = type
  newRule.value = {
    membership_type_id: type.id,
    target_resource_category_id: categories.value[0]?.id || null,
    discount_percent: null,
    discount_fixed: null
  }
  showRuleModal.value = true
}

const createRule = async () => {
  if(!newRule.value.target_resource_category_id) return
  const percent = typeof newRule.value.discount_percent === 'number' ? newRule.value.discount_percent : null
  const fixed = typeof newRule.value.discount_fixed === 'number' ? newRule.value.discount_fixed : null
  if (percent && fixed) {
    alert('Bitte entweder Prozent oder Fixbetrag setzen, nicht beides.')
    return
  }
  if (percent != null) {
    newRule.value.discount_percent = Math.max(0, Math.min(1, percent))
  }
  const result = await api.memberships.createRule(newRule.value)
  if (result) {
    showRuleModal.value = false
    await loadData()
  }
}

const deleteRule = async (ruleId: number) => {
  if(confirm("Möchten Sie diese Rabattregel wirklich entfernen?")) {
    const res = await api.memberships.deleteRule(ruleId)
    if(res) await loadData()
  }
}

onMounted(() => {
  loadData()
})
</script>
