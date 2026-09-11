import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

const LG_QUERY = "(min-width: 1024px)";

export function useSidebarDrawer() {
  const open = ref(false);
  const isDesktop = ref(false);
  const sidebarRef = ref<{ focusSearch?: () => void } | null>(null);

  const close = () => {
    open.value = false;
  };

  const toggle = () => {
    open.value = !open.value;
  };

  const openSearch = async () => {
    open.value = true;
    await nextTick();
    sidebarRef.value?.focusSearch?.();
  };

  const route = useRoute();
  watch(
    () => route.fullPath,
    () => {
      if (!isDesktop.value) close();
    },
  );

  watch(open, (val) => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = !isDesktop.value && val ? "hidden" : "";
  });

  let mq: MediaQueryList | null = null;
  const onMedia = () => {
    if (!mq) return;
    isDesktop.value = mq.matches;
    if (mq.matches) close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open.value && !isDesktop.value) close();
  };

  onMounted(() => {
    mq = window.matchMedia(LG_QUERY);
    onMedia();
    mq.addEventListener("change", onMedia);
    window.addEventListener("keydown", onKey);
  });

  onBeforeUnmount(() => {
    mq?.removeEventListener("change", onMedia);
    window.removeEventListener("keydown", onKey);
    if (typeof document !== "undefined") document.body.style.overflow = "";
  });

  return {
    open,
    isDesktop,
    sidebarRef,
    close,
    toggle,
    openSearch,
  };
}
