<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dialog-overlay dialog-overlay-top"
      role="dialog"
      aria-modal="true"
      aria-label="Konvertierung nach AVIF"
    >
      <div class="absolute inset-0" @click="onOverlayClick" />
      <div class="dialog-panel max-w-md">
        <div class="dialog-header">
          <div class="min-w-0 flex-1">
            <h3 class="dialog-title">Konvertierung nach AVIF</h3>
            <p class="dialog-desc">
              {{
                done
                  ? summary
                  : `Bild ${Math.min(current, total)} von ${total}`
              }}
            </p>
          </div>
        </div>

        <div class="dialog-body space-y-4">
          <div>
            <div class="mb-1.5 flex items-center justify-between text-xs text-neutral-500">
              <span>{{ done ? "Abgeschlossen" : currentName || "…" }}</span>
              <span>{{ percent }}%</span>
            </div>
            <div class="h-2 overflow-hidden bg-neutral-100">
              <div
                class="h-full bg-brand-accent transition-[width] duration-300"
                :style="{ width: `${percent}%` }"
              />
            </div>
          </div>

          <ul class="max-h-56 space-y-1.5 overflow-y-auto text-sm">
            <li
              v-for="item in items"
              :key="item.id"
              class="flex items-start gap-2"
            >
              <UiIcon
                :name="statusIcon(item.status)"
                class="mt-0.5 size-3.5 shrink-0"
                :class="statusClass(item.status)"
              />
              <span class="min-w-0 flex-1 truncate text-neutral-700">
                {{ item.name }}
                <span
                  v-if="item.error"
                  class="mt-0.5 block truncate text-xs text-red-600"
                >
                  {{ item.error }}
                </span>
              </span>
            </li>
          </ul>
        </div>

        <div class="dialog-footer">
          <button
            v-if="done"
            type="button"
            class="btn-dialog-primary"
            @click="$emit('close')"
          >
            Fertig
          </button>
          <p v-else class="text-xs text-neutral-500">
            Bitte warten, das kann bei großen Panoramen dauern…
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  current: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currentName: { type: String, default: "" },
  done: { type: Boolean, default: false },
});

const emit = defineEmits(["close"]);

const percent = computed(() => {
  if (!props.total) return 0;
  if (props.done) return 100;
  const completed = props.items.filter(
    (item) => item.status !== "pending" && item.status !== "running",
  ).length;
  return Math.round((completed / props.total) * 100);
});

const summary = computed(() => {
  const converted = props.items.filter((i) => i.status === "converted").length;
  const skipped = props.items.filter((i) => i.status === "skipped").length;
  const failed = props.items.filter((i) => i.status === "failed").length;
  const parts = [];
  if (converted) parts.push(`${converted} konvertiert`);
  if (skipped) parts.push(`${skipped} übersprungen`);
  if (failed) parts.push(`${failed} fehlgeschlagen`);
  return parts.join(" · ") || "Keine Änderungen";
});

function onOverlayClick() {
  if (props.done) {
    emit("close");
  }
}

function statusIcon(status) {
  if (status === "running") return "i-lucide-loader-2";
  if (status === "converted") return "i-lucide-check";
  if (status === "skipped") return "i-lucide-minus";
  if (status === "failed") return "i-lucide-x";
  return "i-lucide-circle";
}

function statusClass(status) {
  if (status === "running") return "animate-spin text-brand-accent";
  if (status === "converted") return "text-emerald-600";
  if (status === "skipped") return "text-neutral-400";
  if (status === "failed") return "text-red-600";
  return "text-neutral-300";
}
</script>
