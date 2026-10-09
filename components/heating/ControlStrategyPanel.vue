<template>
  <div class="border border-neutral-200 px-3 py-2 space-y-2">
    <label class="block space-y-1">
      <span class="text-sm font-medium text-neutral-800">Ventilregelung</span>
      <select
        class="dialog-input"
        :value="entity.control_strategy_setting ?? ''"
        :disabled="disabled"
        @change="onChange"
      >
        <option value="">Automatisch ({{ LABELS[resolved] }})</option>
        <option v-if="entity.supports_smart_control" value="device_pid">
          {{ LABELS.device_pid }}
        </option>
        <option v-if="entity.supports_valve_control" value="backend_pi">
          {{ LABELS.backend_pi }}
        </option>
        <option value="device_native">{{ LABELS.device_native }}</option>
      </select>
    </label>
    <p class="text-xs text-neutral-600">{{ status }}</p>
    <p v-if="firmwareLine" class="text-xs text-neutral-500">{{ firmwareLine }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ControlStrategy, HeatingEntity } from "~/composables/useHeatingApi";

const props = defineProps<{
  entity: HeatingEntity;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  change: [value: ControlStrategy | null];
}>();

const LABELS: Record<ControlStrategy, string> = {
  device_pid: "Firmware-PID im Thermostat",
  backend_pi: "Backend-PI-Regler",
  device_native: "Thermostat ohne PID (Auf/Zu)",
};

const resolved = computed<ControlStrategy>(
  () => props.entity.control_strategy ?? "device_native",
);

function formatTime(iso: string | null | undefined) {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const status = computed(() => {
  if (resolved.value === "device_pid") {
    return props.entity.last_state?.smart_temperature_control === true
      ? "Das Thermostat regelt die Ventilöffnung selbst."
      : "Firmware-PID wird am Thermostat eingeschaltet …";
  }
  if (resolved.value === "device_native") {
    return "Das Thermostat öffnet das Ventil ganz oder schließt es ganz.";
  }
  const vc = props.entity.valve_control;
  if (!vc) return "Wartet auf den ersten Regelzyklus (alle 5 Minuten).";
  if (vc.mode === "off") {
    return "Backend-Regler ist serverseitig ausgeschaltet (HEATING_BACKEND_PI_MODE=off).";
  }
  if (vc.mode === "shadow") {
    return `Schattenmodus: würde ${vc.target ?? "–"} % stellen, ${vc.sends_24h} Befehle in 24 h. An das Thermostat wird nichts gesendet.`;
  }
  if (vc.applied === "failsafe") {
    return `Keine aktuellen Messwerte. Das Thermostat regelt selbst, höchstens bis ${vc.last_sent ?? 100} %.`;
  }
  return `Ventil ${vc.last_sent ?? "–"} %, ${vc.sends_24h} Befehle in 24 h, zuletzt ${formatTime(vc.last_sent_at)}.`;
});

const firmwareLine = computed(() => {
  const state = props.entity.last_state || {};
  const version = state.firmware_version ? `Firmware ${state.firmware_version}` : "";
  if (state.firmware_update_available === true) {
    const hint = props.entity.supports_smart_control ? "" : " (bringt den Firmware-PID)";
    return `${version}${version ? " · " : ""}Update verfügbar${hint}.`;
  }
  return version;
});

const onChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  emit("change", (value || null) as ControlStrategy | null);
};
</script>
