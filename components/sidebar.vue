<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, type Component } from "vue";
import IconCalendar from "~/components/icon/Calendar.vue";
import IconContact from "~/components/icon/Contact.vue";
import IconDashboard from "~/components/icon/Dashboard.vue";
import IconInvoice from "~/components/icon/Invoice.vue";
import IconMail from "~/components/icon/Mail.vue";
import IconMap from "~/components/icon/Map.vue";
import IconMeter from "~/components/icon/Meter.vue";
import IconMeterOverview from "~/components/icon/MeterOverview.vue";
import IconResource from "~/components/icon/Resource.vue";
import IconSettings from "~/components/icon/Settings.vue";
import IconImage from "~/components/icon/Image.vue";
import type { SearchResult, SearchResultGroup } from "~/composables/useGlobalSearch";

type NavItem = {
  label: string;
  icon?: Component;
  to?: string;
  defaultOpen?: boolean;
  children?: NavItem[];
};

const searchQuery = ref("");
const searchFocused = ref(false);
const searchLoading = ref(false);
const entityGroups = ref<SearchResultGroup[]>([]);
const openSections = ref<Record<string, boolean>>({});
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const { search: runGlobalSearch } = useGlobalSearch();
const router = useRouter();

const { hydrateFromStorage, role } = useAuth();
if (import.meta.client) {
  hydrateFromStorage();
}

const mainGroups = ref<NavItem[][]>([
  [
    { label: "Dashboard", icon: IconDashboard, to: "/booking-system" },
    { label: "Kalender", icon: IconCalendar, to: "/booking-system/calendar" },
    {
      label: "Abrechnung",
      icon: IconInvoice,
      defaultOpen: false,
      children: [
        { label: "Rechnungen", to: "/booking-system/invoices" },
        { label: "Abos", to: "/booking-system/subscriptions" },
      ],
    },
    {
      label: "Ressourcen",
      icon: IconResource,
      defaultOpen: false,
      children: [
        { label: "Übersicht", to: "/booking-system/resources" },
        { label: "Services", to: "/booking-system/services" },
        { label: "Tasks", to: "/booking-system/tasks" },
        { label: "Preise", to: "/booking-system/pricing" },
        { label: "Mitgliedschaften", to: "/booking-system/memberships" },
      ],
    },
    {
      label: "Kontakte",
      icon: IconContact,
      defaultOpen: false,
      children: [
        { label: "Benutzer", to: "/booking-system/users" },
        { label: "Profil", to: "/booking-system/profile" },
      ],
    },
    {
      label: "Kommunikation",
      icon: IconMail,
      to: "/booking-system/email-templates",
    },
  ],
  [
    { label: "Campusplan", icon: IconMap, to: "/" },
    {
      label: "Gebäude",
      icon: IconMeter,
    },
  ],
  [
    {
      label: "Zählerstände",
      icon: IconMeterOverview,
      to: "/meters/readings",
    },
    { label: "Zählerverwaltung", icon: IconMeter, to: "/meters" },
    { label: "Zählerbilder", icon: IconImage, to: "/haus-5/haustechnik" },
  ],
]);

const visibleMainGroups = computed(() => {
  // Sachbearbeiter: nur Buchungssystem (erste Gruppe)
  if (role.value === "sachbearbeiter") {
    return [mainGroups.value[0]];
  }
  return mainGroups.value;
});
const settingsItem = ref<NavItem>({
  label: "Einstellungen",
  icon: IconSettings,
  to: "/booking-system/settings",
  defaultOpen: false,
  children: [
    { label: "Unternehmen", to: "/booking-system/settings" },
    { label: "Passwort ändern", to: "/change-password" },
  ],
});

const sectionKey = (prefix: string, index: number, label: string) =>
  `${prefix}${index}-${label}`;

const initOpen = () => {
  const walk = (list: NavItem[], prefix = "") => {
    list.forEach((item, i) => {
      const key = sectionKey(prefix, i, item.label);
      if (item.children?.length) {
        openSections.value[key] = !!item.defaultOpen;
        walk(item.children, `${key}/`);
      }
    });
  };
  mainGroups.value.forEach((group, gi) => walk(group, `g${gi}/`));
  walk([settingsItem.value], "settings/");
};
initOpen();

const route = useRoute();

const isActive = (to?: string) => {
  if (!to) return false;
  if (to === "/booking-system") {
    return route.path === "/booking-system";
  }
  if (to === "/") {
    return route.path === "/";
  }
  if (to === "/meters") {
    return route.path === "/meters";
  }
  if (to === "/haus-5") {
    return route.path === "/haus-5";
  }
  if (to === "/booking-system/settings") {
    return route.path === "/booking-system/settings";
  }
  if (to === "/booking-system/resources") {
    return (
      route.path === "/booking-system/resources" ||
      route.path.startsWith("/booking-system/resources/")
    );
  }
  return route.path === to || route.path.startsWith(to + "/");
};

const itemOrChildActive = (item: NavItem): boolean => {
  if (item.to && isActive(item.to)) return true;
  return !!item.children?.some((c) => itemOrChildActive(c));
};

const openActiveSections = () => {
  mainGroups.value.forEach((group, gi) => {
    group.forEach((item, ii) => {
      if (item.children?.length && itemOrChildActive(item)) {
        openSections.value[sectionKey(`g${gi}/`, ii, item.label)] = true;
      }
    });
  });
  if (itemOrChildActive(settingsItem.value)) {
    openSections.value[
      sectionKey("settings/", 0, settingsItem.value.label)
    ] = true;
  }
};

watch(
  () => route.path,
  () => openActiveSections(),
  { immediate: true },
);

watch(
  visibleMainGroups,
  () => {
    initOpen();
    openActiveSections();
  },
  { deep: true },
);

const matchesSearch = (item: NavItem): boolean => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return true;
  if (item.label.toLowerCase().includes(q)) return true;
  return !!item.children?.some((c) => matchesSearch(c));
};

const filteredGroups = computed(() =>
  visibleMainGroups.value
    .map((group) => group.filter(matchesSearch))
    .filter((group) => group.length > 0),
);

const settingsVisible = computed(() => matchesSearch(settingsItem.value));

const showEntityResults = computed(
  () => searchFocused.value && searchQuery.value.trim().length >= 2,
);

const hasEntityResults = computed(() =>
  entityGroups.value.some((g) => g.items.length > 0),
);

const typeIcon: Record<string, string> = {
  user: "i-lucide-user",
  booking: "i-lucide-calendar",
  resource: "i-lucide-box",
  invoice: "i-lucide-file-text",
  nav: "i-lucide-compass",
};

const runSearch = async () => {
  const q = searchQuery.value.trim();
  if (q.length < 2) {
    entityGroups.value = [];
    searchLoading.value = false;
    return;
  }

  searchLoading.value = true;
  try {
    entityGroups.value = await runGlobalSearch(q);
  } finally {
    searchLoading.value = false;
  }
};

watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (searchQuery.value.trim().length < 2) {
    entityGroups.value = [];
    searchLoading.value = false;
    return;
  }
  searchLoading.value = true;
  searchTimeout = setTimeout(runSearch, 280);
});

const clearSearch = () => {
  searchQuery.value = "";
  entityGroups.value = [];
  searchFocused.value = false;
};

const selectResult = async (item: SearchResult) => {
  clearSearch();
  await router.push(item.to);
};

const onSearchBlur = () => {
  // Delay so click on result can register
  setTimeout(() => {
    searchFocused.value = false;
  }, 150);
};

const linkClass = (to?: string, nested = false) => [
  "relative flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
  nested ? "pl-9 font-normal" : "",
  isActive(to)
    ? "font-semibold text-neutral-900"
    : "font-normal text-neutral-600 hover:text-neutral-900",
];

const toggleSection = (key: string) => {
  openSections.value[key] = !openSections.value[key];
};

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
});
</script>

<template>
  <nav
    class="flex h-dvh w-60 flex-col border-r border-neutral-200 bg-neutral-50"
  >
    <div class="relative flex flex-col gap-4 p-4 pb-2">
      <IconFabrikSonntagLogo class="h-10 w-auto" />
      <div class="relative">
        <UiIcon
          name="i-lucide-search"
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400"
        />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Buchung, Nutzer, …"
          class="w-full rounded-md border-0 bg-neutral-200/70 py-2 pl-8 pr-3 text-sm text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          @focus="searchFocused = true"
          @blur="onSearchBlur"
        />

        <div
          v-if="showEntityResults"
          class="absolute left-0 right-0 top-full z-50 mt-1 max-h-[min(28rem,70vh)] overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-lg"
        >
          <div
            v-if="searchLoading && !hasEntityResults"
            class="px-3 py-3 text-xs text-neutral-500"
          >
            Suche…
          </div>
          <div
            v-else-if="!searchLoading && !hasEntityResults"
            class="px-3 py-3 text-xs text-neutral-500"
          >
            Keine Treffer
          </div>
          <template v-else>
            <div
              v-for="group in entityGroups"
              :key="group.type"
              class="border-b border-neutral-100 last:border-b-0"
            >
              <div
                class="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400"
              >
                {{ group.label }}
              </div>
              <button
                v-for="item in group.items"
                :key="`${item.type}-${item.id}`"
                type="button"
                class="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-neutral-50"
                @mousedown.prevent="selectResult(item)"
              >
                <UiIcon
                  :name="typeIcon[item.type] || 'i-lucide-search'"
                  class="mt-0.5 size-3.5 shrink-0 text-neutral-400"
                />
                <span class="min-w-0 flex-1">
                  <span
                    class="block truncate text-sm font-medium text-neutral-900"
                  >
                    {{ item.title }}
                  </span>
                  <span
                    v-if="item.subtitle"
                    class="mt-0.5 block truncate text-xs text-neutral-500"
                  >
                    {{ item.subtitle }}
                  </span>
                </span>
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-2 py-2">
      <div
        v-for="(group, gi) in filteredGroups"
        :key="gi"
        class="flex flex-col"
      >
        <div v-if="gi > 0" class="mx-2 my-3 border-t border-neutral-200" />
        <template v-for="(item, ii) in group" :key="ii">
          <template v-if="item.children?.length">
            <button
              type="button"
              class="relative flex w-full items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 hover:text-neutral-900"
              @click="toggleSection(sectionKey(`g${gi}/`, ii, item.label))"
            >
              <component
                :is="item.icon"
                v-if="item.icon"
                class="size-4 shrink-0"
              />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <UiIcon
                :name="
                  openSections[sectionKey(`g${gi}/`, ii, item.label)]
                    ? 'i-lucide-chevron-down'
                    : 'i-lucide-chevron-right'
                "
                class="size-3.5 text-neutral-400"
              />
            </button>
            <div
              v-if="openSections[sectionKey(`g${gi}/`, ii, item.label)]"
              class="flex flex-col"
            >
              <NuxtLink
                v-for="(child, ci) in item.children"
                :key="ci"
                :to="child.to"
                :class="linkClass(child.to, true)"
              >
                <span
                  v-if="isActive(child.to)"
                  class="absolute bottom-1 left-0 top-1 w-0.5 bg-neutral-900"
                />
                {{ child.label }}
              </NuxtLink>
            </div>
          </template>
          <NuxtLink
            v-else-if="item.to"
            :to="item.to"
            :class="linkClass(item.to)"
          >
            <span
              v-if="isActive(item.to)"
              class="absolute bottom-1 left-0 top-1 w-0.5 bg-neutral-900"
            />
            <component
              :is="item.icon"
              v-if="item.icon"
              class="size-4 shrink-0"
            />
            {{ item.label }}
          </NuxtLink>
        </template>
      </div>
    </div>

    <div v-if="settingsVisible" class="mt-auto border-t border-neutral-200 p-2">
      <div class="relative flex w-full items-center">
        <NuxtLink
          :to="settingsItem.to"
          :class="linkClass(settingsItem.to)"
          class="flex-1"
        >
          <span
            v-if="isActive(settingsItem.to)"
            class="absolute bottom-1 left-0 top-1 w-0.5 bg-neutral-900"
          />
          <component
            :is="settingsItem.icon"
            v-if="settingsItem.icon"
            class="size-4 shrink-0"
          />
          {{ settingsItem.label }}
        </NuxtLink>
        <button
          type="button"
          class="px-2 py-2 text-neutral-400 hover:text-neutral-700"
          aria-label="Unterpunkte umschalten"
          @click="toggleSection(sectionKey('settings/', 0, settingsItem.label))"
        >
          <UiIcon
            :name="
              openSections[sectionKey('settings/', 0, settingsItem.label)]
                ? 'i-lucide-chevron-down'
                : 'i-lucide-chevron-right'
            "
            class="size-3.5"
          />
        </button>
      </div>
      <div
        v-if="openSections[sectionKey('settings/', 0, settingsItem.label)]"
        class="flex flex-col pb-2"
      >
        <NuxtLink
          v-for="(child, ci) in settingsItem.children"
          :key="ci"
          :to="child.to"
          :class="linkClass(child.to, true)"
        >
          <span
            v-if="isActive(child.to)"
            class="absolute bottom-1 left-0 top-1 w-0.5 bg-neutral-900"
          />
          {{ child.label }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>
