<template>
  <div class="relative inline-flex" ref="rootRef">
    <div @click.stop="open = !open">
      <slot />
    </div>
    <div
      v-if="open"
      class="absolute right-0 top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
      :class="contentClass"
    >
      <template v-for="(group, gi) in normalizedGroups" :key="gi">
        <div v-if="gi > 0" class="my-1 border-t border-gray-100" />
        <button
          v-for="(item, ii) in group"
          :key="ii"
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
          :class="item.color === 'error' ? 'text-red-600' : 'text-gray-700'"
          @click="onSelect(item)"
        >
          <UiIcon v-if="item.icon" :name="item.icon" class="size-4" />
          <span>{{ item.label }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

export interface DropdownItem {
  label: string;
  icon?: string;
  to?: string;
  target?: string;
  color?: string;
  onSelect?: (e?: Event) => void;
}

const props = defineProps<{
  items?: DropdownItem[][] | DropdownItem[];
  ui?: { content?: string };
}>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const router = useRouter();

const contentClass = computed(() => props.ui?.content || "w-48");

const normalizedGroups = computed(() => {
  if (!props.items) return [];
  if (Array.isArray(props.items[0])) return props.items as DropdownItem[][];
  return [props.items as DropdownItem[]];
});

const onSelect = (item: DropdownItem) => {
  open.value = false;
  if (item.onSelect) {
    item.onSelect();
    return;
  }
  if (item.to) {
    if (item.target === "_blank" || item.to.startsWith("http")) {
      window.open(item.to, item.target || "_self");
    } else {
      router.push(item.to);
    }
  }
};

const onDocClick = (e: MouseEvent) => {
  if (!rootRef.value?.contains(e.target as Node)) open.value = false;
};

onMounted(() => document.addEventListener("click", onDocClick));
onUnmounted(() => document.removeEventListener("click", onDocClick));
</script>
