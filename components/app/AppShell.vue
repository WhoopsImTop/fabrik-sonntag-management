<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean;
  }>(),
  { padded: true },
);

const { open, sidebarRef, close, toggle, openSearch } = useSidebarDrawer();
</script>

<template>
  <div class="flex h-dvh overflow-hidden bg-white">
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-neutral-900/40 lg:hidden"
      aria-hidden="true"
      @click="close"
    />
    <Sidebar
      id="app-sidebar"
      ref="sidebarRef"
      class="fixed inset-y-0 left-0 z-50 w-60 shrink-0 transition-transform duration-200 lg:static lg:translate-x-0"
      :class="open ? 'translate-x-0' : '-translate-x-full pointer-events-none lg:translate-x-0 lg:pointer-events-auto'"
    />
    <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header
        class="flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 px-4 lg:hidden"
      >
        <button
          type="button"
          class="rounded-none p-1.5 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
          :aria-expanded="open"
          aria-controls="app-sidebar"
          aria-label="Menü öffnen"
          @click="toggle"
        >
          <UiIcon name="i-lucide-menu" class="size-5" />
        </button>
        <IconFabrikSonntagLogo class="h-7 w-auto" />
        <button
          type="button"
          class="ml-auto rounded-none p-1.5 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Suche"
          @click="openSearch"
        >
          <UiIcon name="i-lucide-search" class="size-5" />
        </button>
      </header>
      <div
        :class="
          padded
            ? 'min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-4 lg:px-8 lg:py-8 flex flex-col'
            : 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
        "
      >
        <slot />
      </div>
    </div>
  </div>
</template>
