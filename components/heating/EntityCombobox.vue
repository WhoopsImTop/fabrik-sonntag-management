<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";

export type EntityPickerItem = {
  id: number;
  name: string;
  subtitle?: string;
};

const props = withDefaults(
  defineProps<{
    items: EntityPickerItem[];
    modelValue?: number[];
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: () => [],
    placeholder: "Thermostat suchen…",
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: number[]];
}>();

const query = ref("");
const open = ref(false);
const highlight = ref(0);
const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const selectedIds = computed(() => props.modelValue || []);

const selectedItems = computed(() =>
  selectedIds.value
    .map((id) => props.items.find((item) => item.id === id))
    .filter((item): item is EntityPickerItem => !!item),
);

const available = computed(() => {
  const selected = new Set(selectedIds.value);
  const q = query.value.trim().toLowerCase();
  return props.items.filter((item) => {
    if (selected.has(item.id)) return false;
    if (!q) return true;
    const hay = `${item.name} ${item.subtitle || ""}`.toLowerCase();
    return hay.includes(q);
  });
});

const setSelected = (ids: number[]) => {
  emit("update:modelValue", ids);
};

const add = (id: number) => {
  if (selectedIds.value.includes(id)) return;
  setSelected([...selectedIds.value, id]);
  query.value = "";
  highlight.value = 0;
  nextTick(() => inputRef.value?.focus());
};

const remove = (id: number) => {
  setSelected(selectedIds.value.filter((item) => item !== id));
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    open.value = true;
    highlight.value = Math.min(highlight.value + 1, Math.max(available.value.length - 1, 0));
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    highlight.value = Math.max(highlight.value - 1, 0);
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    const item = available.value[highlight.value] || available.value[0];
    if (item) add(item.id);
    return;
  }
  if (event.key === "Backspace" && !query.value && selectedIds.value.length) {
    remove(selectedIds.value[selectedIds.value.length - 1]);
    return;
  }
  if (event.key === "Escape") {
    open.value = false;
  }
};

const onDocumentClick = (event: MouseEvent) => {
  if (!rootRef.value?.contains(event.target as Node)) open.value = false;
};

onMounted(() => document.addEventListener("mousedown", onDocumentClick));
onUnmounted(() => document.removeEventListener("mousedown", onDocumentClick));
</script>

<template>
  <div ref="rootRef" class="relative">
    <div
      class="flex min-h-10 flex-wrap items-center gap-1 border border-neutral-200 bg-white px-2 py-1"
      :class="disabled ? 'opacity-50' : 'focus-within:border-neutral-400'"
      @click="inputRef?.focus()"
    >
      <span
        v-for="item in selectedItems"
        :key="item.id"
        class="inline-flex items-center gap-1 border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-xs text-neutral-800"
      >
        {{ item.name }}
        <button
          type="button"
          class="text-neutral-400 hover:text-neutral-800"
          :disabled="disabled"
          :aria-label="`${item.name} entfernen`"
          @click.stop="remove(item.id)"
        >
          ×
        </button>
      </span>
      <input
        ref="inputRef"
        v-model="query"
        class="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm outline-none"
        :placeholder="selectedItems.length ? '' : placeholder"
        :disabled="disabled"
        @focus="open = true"
        @input="open = true; highlight = 0"
        @keydown="onKeydown"
      />
    </div>
    <div
      v-if="open && !disabled"
      class="absolute z-20 mt-1 max-h-56 w-full overflow-auto border border-neutral-200 bg-white shadow-sm"
    >
      <p v-if="!available.length" class="px-3 py-2 text-sm text-neutral-500">
        {{ items.length && selectedItems.length === items.length ? "Alle ausgewählt" : "Kein Treffer" }}
      </p>
      <button
        v-for="(item, index) in available"
        :key="item.id"
        type="button"
        class="block w-full px-3 py-2 text-left text-sm"
        :class="index === highlight ? 'bg-neutral-100' : 'hover:bg-neutral-50'"
        @mousedown.prevent="add(item.id)"
        @mouseenter="highlight = index"
      >
        <span class="block font-medium text-neutral-900">{{ item.name }}</span>
        <span v-if="item.subtitle" class="block text-xs text-neutral-500">
          {{ item.subtitle }}
        </span>
      </button>
    </div>
  </div>
</template>
