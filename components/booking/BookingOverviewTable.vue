<script setup lang="ts">
import {
  formatBookingZeitraum,
  getBookingTodoSummary,
  getBookingUserName,
} from "~/utils/bookingOverview";

withDefaults(
  defineProps<{
    bookings: any[];
    loading?: boolean;
    emptyText?: string;
  }>(),
  {
    loading: false,
    emptyText: "Keine Buchungen gefunden.",
  },
);

const emit = defineEmits<{
  select: [booking: any];
  cancel: [booking: any];
  edit: [booking: any];
}>();

const onRowClick = (booking: any) => {
  emit("select", booking);
};

const onCancel = (booking: any, event: Event) => {
  event.stopPropagation();
  emit("cancel", booking);
};

const onEdit = (booking: any, event: Event) => {
  event.stopPropagation();
  emit("edit", booking);
};

const canCancel = (booking: any) =>
  booking.status === "PENDING" || booking.status === "CONFIRMED";

const canEdit = (booking: any) => booking.status !== "CANCELLED";
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table class="w-full text-left text-sm">
      <thead>
        <tr class="border-b border-neutral-200 text-neutral-500">
          <th class="pb-3 pr-4 font-medium">
            <span class="inline-flex items-center gap-1.5">
              <IconContact class="size-3.5" />
              Benutzer
            </span>
          </th>
          <th class="pb-3 pr-4 font-medium">
            <span class="inline-flex items-center gap-1.5">
              <IconResource class="size-3.5" />
              Ressource
            </span>
          </th>
          <th class="pb-3 pr-4 font-medium">
            <span class="inline-flex items-center gap-1.5">
              <IconTimeSpan class="size-3.5" />
              Zeitraum
            </span>
          </th>
          <th class="pb-3 pr-4 font-medium">
            <span class="inline-flex items-center gap-1.5">
              <IconTodo class="size-3.5" />
              Todos
            </span>
          </th>
          <th class="pb-3 font-medium text-right">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="5" class="py-12 text-center text-neutral-500">
            Lädt…
          </td>
        </tr>
        <tr v-else-if="!bookings.length">
          <td colspan="5" class="py-12 text-center text-neutral-500">
            {{ emptyText }}
          </td>
        </tr>
        <tr
          v-for="booking in bookings"
          :key="booking.id"
          class="group cursor-pointer border-b border-neutral-100 transition-colors hover:bg-neutral-50/80"
          @click="onRowClick(booking)"
        >
          <td class="py-4 pr-4 font-medium text-neutral-900">
            {{ getBookingUserName(booking) }}
          </td>
          <td class="py-4 pr-4">
            <NuxtLink
              :to="`/booking-system/calendar?id=${booking.id}`"
              class="font-medium text-brand-accent hover:underline"
              @click.stop
            >
              {{ booking.resource_name || "—" }}
            </NuxtLink>
          </td>
          <td class="py-4 pr-4 text-neutral-700">
            <span class="inline-flex items-center gap-2">
              {{ formatBookingZeitraum(booking.start_at, booking.end_at) }}
              <button
                v-if="canEdit(booking)"
                type="button"
                class="shrink-0 text-neutral-400 opacity-0 transition-opacity hover:text-neutral-700 group-hover:opacity-100"
                title="Zeitraum bearbeiten"
                @click="onEdit(booking, $event)"
              >
                <IconEdit class="size-3" />
              </button>
            </span>
          </td>
          <td class="py-4 pr-4">
            <template v-if="!getBookingTodoSummary(booking).hasTodos">
              <span class="text-neutral-400">—</span>
            </template>
            <template v-else-if="getBookingTodoSummary(booking).allDone">
              <span class="text-neutral-900">Alles erledigt!</span>
            </template>
            <NuxtLink
              v-else
              :to="`/booking-system/calendar?id=${booking.id}`"
              class="font-medium text-brand-accent underline-offset-2 hover:underline"
              @click.stop
            >
              {{ getBookingTodoSummary(booking).label }}
            </NuxtLink>
          </td>
          <td class="py-4 text-right">
            <div class="relative flex min-h-6 items-center justify-end">
              <!-- Default status -->
              <span
                v-if="booking.status === 'CONFIRMED'"
                class="inline-flex items-center gap-1.5 text-emerald-600 transition-opacity group-hover:opacity-0"
                :class="canCancel(booking) ? 'group-hover:invisible' : ''"
              >
                <UiIcon name="i-lucide-check" class="size-4" />
                Bestätigt
              </span>
              <span
                v-else-if="booking.status === 'PENDING'"
                class="text-amber-600 transition-opacity group-hover:opacity-0"
                :class="canCancel(booking) ? 'group-hover:invisible' : ''"
              >
                Ausstehend
              </span>
              <span
                v-else-if="booking.status === 'CANCELLED'"
                class="text-neutral-400"
              >
                Storniert
              </span>
              <span v-else class="text-neutral-500">{{ booking.status }}</span>

              <!-- Hover: cancel action -->
              <button
                v-if="canCancel(booking)"
                type="button"
                class="absolute right-0 inline-flex items-center gap-1.5 text-red-600 opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100"
                @click="onCancel(booking, $event)"
              >
                <IconCancelAppointment class="text-red-600" />
                Termin stornieren
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
