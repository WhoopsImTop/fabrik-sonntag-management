<template>
  <div class="relative w-full overflow-auto" :class="$attrs.class">
    <div
      v-if="loading"
      class="absolute inset-0 z-10 flex items-center justify-center bg-white/60"
    >
      <UiIcon
        name="i-lucide-loader-2"
        class="size-6 animate-spin text-neutral-400"
      />
    </div>
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-neutral-200 text-neutral-500">
          <th
            v-for="col in normalizedColumns"
            :key="col.id"
            class="pb-3 pr-4 font-medium last:pr-0"
          >
            {{ col.header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!loading && (!data || data.length === 0)">
          <td
            :colspan="normalizedColumns.length"
            class="py-12 text-center text-neutral-500"
          >
            Keine Einträge
          </td>
        </tr>
        <tr
          v-for="(row, rowIndex) in data"
          :key="rowIndex"
          class="border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
        >
          <td
            v-for="col in normalizedColumns"
            :key="col.id"
            class="py-4 pr-4 align-middle last:pr-0"
          >
            <slot
              :name="`${col.id}-cell`"
              :row="{ original: row, index: rowIndex }"
            >
              {{ resolveValue(row, col) }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

export interface TableColumn {
  id?: string;
  accessorKey?: string;
  header?: string;
}

const props = withDefaults(
  defineProps<{
    data?: any[];
    columns?: TableColumn[];
    loading?: boolean;
  }>(),
  {
    data: () => [],
    columns: () => [],
    loading: false,
  },
);

defineOptions({ inheritAttrs: false });

const normalizedColumns = computed(() =>
  (props.columns || []).map((col) => ({
    id: col.id || col.accessorKey || "col",
    header: col.header ?? col.id ?? col.accessorKey ?? "",
    accessorKey: col.accessorKey,
  })),
);

const resolveValue = (row: any, col: { accessorKey?: string }) => {
  if (!col.accessorKey) return "";
  return col.accessorKey.split(".").reduce((acc: any, key: string) => {
    if (acc == null) return undefined;
    return acc[key];
  }, row);
};
</script>
