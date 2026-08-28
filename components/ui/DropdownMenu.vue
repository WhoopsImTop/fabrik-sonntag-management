<template>
  <div class="relative inline-flex" ref="rootRef">
    <div ref="triggerRef" @click.stop="toggle">
      <slot />
    </div>
    <Teleport to="body">
      <div
        v-if="open"
        ref="menuRef"
        class="fixed z-[200] min-w-[12rem] overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        :class="contentClass"
        :style="menuStyle"
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
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

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
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuStyle = ref<Record<string, string>>({});
const router = useRouter();

const contentClass = computed(() => props.ui?.content || "w-48");

const normalizedGroups = computed(() => {
  if (!props.items) return [];
  if (Array.isArray(props.items[0])) return props.items as DropdownItem[][];
  return [props.items as DropdownItem[]];
});

const updatePosition = () => {
  const trigger = triggerRef.value;
  const menu = menuRef.value;
  if (!trigger) return;

  const rect = trigger.getBoundingClientRect();
  const gap = 4;
  const menuWidth = menu?.offsetWidth || 192;
  const menuHeight = menu?.offsetHeight || 80;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let left = rect.right - menuWidth;
  left = Math.max(8, Math.min(left, viewportW - menuWidth - 8));

  const spaceBelow = viewportH - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp =
    spaceBelow < menuHeight && spaceAbove > spaceBelow;

  let top: number;
  if (openUp) {
    top = rect.top - menuHeight - gap;
  } else {
    top = rect.bottom + gap;
  }
  top = Math.max(8, Math.min(top, viewportH - menuHeight - 8));

  menuStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  };
};

const toggle = async () => {
  open.value = !open.value;
  if (open.value) {
    await nextTick();
    updatePosition();
    await nextTick();
    updatePosition();
  }
};

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
  const target = e.target as Node;
  if (rootRef.value?.contains(target)) return;
  if (menuRef.value?.contains(target)) return;
  open.value = false;
};

const onReposition = () => {
  if (open.value) updatePosition();
};

watch(open, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    updatePosition();
  }
});

onMounted(() => {
  document.addEventListener("click", onDocClick);
  window.addEventListener("resize", onReposition);
  window.addEventListener("scroll", onReposition, true);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocClick);
  window.removeEventListener("resize", onReposition);
  window.removeEventListener("scroll", onReposition, true);
});
</script>
