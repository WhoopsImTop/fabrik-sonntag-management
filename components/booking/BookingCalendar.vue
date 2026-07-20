<template>
  <div
    class="flex h-full select-none flex-col border border-neutral-200 bg-white"
  >
    <div
      class="grid flex-shrink-0 grid-cols-7 border-b border-neutral-200 bg-neutral-50/50"
    >
      <div
        v-for="day in ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']"
        :key="day"
        class="py-3 text-center text-[0.8rem] font-medium uppercase tracking-wide text-neutral-500"
      >
        {{ day }}
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-px overflow-y-auto bg-neutral-200">
      <div
        v-for="(week, wi) in weeks"
        :key="wi"
        class="relative grid min-h-[110px] flex-1 grid-cols-7 gap-px bg-neutral-200"
        :style="{
          minHeight: `${Math.max(110, 36 + week.maxLanes * LANE_HEIGHT + 8)}px`,
        }"
      >
        <!-- Day cells -->
        <div
          v-for="(day, di) in week.days"
          :key="di"
          class="group relative flex flex-col bg-white p-2 transition-colors"
          :class="[
            !day.isCurrentMonth
              ? 'bg-neutral-50/40 text-neutral-400'
              : 'text-neutral-900',
            day.isToday ? '' : 'hover:bg-neutral-50/50',
            day.isDropTarget
              ? 'bg-brand-accent/15 ring-2 ring-inset ring-brand-accent'
              : '',
            day.isInDropRange && !day.isDropTarget
              ? 'bg-brand-accent/8'
              : '',
          ]"
          @dragover="onDragOverDay(day, $event)"
          @dragenter.prevent="onDragOverDay(day, $event)"
          @drop="onDropDay(day, $event)"
        >
          <div class="relative z-10 mb-1 flex items-start justify-between">
            <span
              class="flex size-6 items-center justify-center text-xs font-medium transition-all"
              :class="
                day.isToday
                  ? 'bg-brand-accent text-neutral-900'
                  : 'text-neutral-500'
              "
            >
              {{ day.date.getDate() }}
            </span>
            <button
              type="button"
              class="rounded-none p-1 text-neutral-400 opacity-0 transition-all hover:bg-neutral-100 hover:text-neutral-900 group-hover:opacity-100"
              title="Neu"
              @click.stop="$emit('create', day.date)"
            >
              <svg
                class="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Spanning event bars (continuous across days in this week) -->
        <div
          class="pointer-events-none absolute inset-x-0 top-9 bottom-1 z-20"
          aria-hidden="false"
        >
          <div
            v-for="seg in week.segments"
            :key="`${seg.booking.id}-${wi}-${seg.startCol}`"
            class="pointer-events-auto absolute flex cursor-pointer items-center truncate border border-neutral-200 bg-neutral-100 px-2 text-[11px] font-medium text-neutral-700 transition-colors hover:bg-neutral-200/90 hover:z-30"
            :class="[
              seg.booking.status === 'CANCELLED'
                ? 'cursor-default opacity-60 line-through'
                : 'active:cursor-grabbing',
              seg.booking.status === 'PENDING' ? 'border-dashed' : '',
              seg.continuesBefore ? 'rounded-l-none border-l-0' : 'rounded-l-sm',
              seg.continuesAfter ? 'rounded-r-none border-r-0' : 'rounded-r-sm',
              draggingBooking?.id === seg.booking.id ? 'opacity-35' : '',
            ]"
            :style="segmentStyle(seg)"
            :draggable="seg.booking.status !== 'CANCELLED' && seg.isStart"
            :title="segmentTitle(seg)"
            @dragstart="onDragStart(seg, $event)"
            @dragend="onDragEnd"
            @click.stop="$emit('select', seg.booking)"
          >
            <span class="truncate">
              <template v-if="seg.isStart">
                <span class="mr-1 font-normal text-neutral-500">{{
                  formatTime(seg.booking.start_at)
                }}</span>
              </template>
              {{ seg.booking.resource_name }}
            </span>
          </div>

          <!-- Drop preview ghost -->
          <div
            v-for="ghost in week.ghostSegments"
            :key="`ghost-${wi}-${ghost.startCol}`"
            class="pointer-events-none absolute flex items-center truncate border-2 border-dashed border-brand-accent bg-brand-accent/25 px-2 text-[11px] font-medium text-neutral-800"
            :class="[
              ghost.continuesBefore
                ? 'rounded-l-none border-l-0'
                : 'rounded-l-sm',
              ghost.continuesAfter
                ? 'rounded-r-none border-r-0'
                : 'rounded-r-sm',
            ]"
            :style="segmentStyle(ghost)"
          >
            <span class="truncate">
              <template v-if="ghost.isStart">
                <span class="mr-1 font-normal text-neutral-600">{{
                  formatTime(ghost.booking.start_at)
                }}</span>
              </template>
              {{ ghost.booking.resource_name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const LANE_HEIGHT = 22;
const LANE_GAP = 2;

const props = defineProps<{
  bookings: any[];
  currentDate: Date;
}>();

const emit = defineEmits([
  "select",
  "create",
  "drop-booking",
  "drag-start",
  "drag-end",
]);

type DayCell = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isDropTarget: boolean;
  isInDropRange: boolean;
};

type Segment = {
  booking: any;
  startCol: number;
  span: number;
  lane: number;
  isStart: boolean;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

const draggingBooking = ref<any | null>(null);
const dropTargetDate = ref<Date | null>(null);
const dropOccurred = ref(false);

const formatTime = (iso: string | Date) =>
  new Date(iso).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const computeMovedRange = (booking: any, targetDate: Date) => {
  const originalStart = new Date(booking.start_at);
  const originalEnd = booking.end_at
    ? new Date(booking.end_at)
    : new Date(booking.start_at);
  const durationMs = originalEnd.getTime() - originalStart.getTime();
  const newStart = new Date(targetDate);
  newStart.setHours(
    originalStart.getHours(),
    originalStart.getMinutes(),
    0,
    0,
  );
  const newEnd = new Date(
    newStart.getTime() + Math.max(durationMs, 60 * 60 * 1000),
  );
  return { newStart, newEnd };
};

const dropPreview = computed(() => {
  if (!draggingBooking.value || !dropTargetDate.value) return null;
  const { newStart, newEnd } = computeMovedRange(
    draggingBooking.value,
    dropTargetDate.value,
  );
  const originalStart = new Date(draggingBooking.value.start_at);
  if (sameDay(originalStart, dropTargetDate.value)) return null;
  return {
    booking: draggingBooking.value,
    start: newStart,
    end: newEnd,
  };
});

const segmentStyle = (seg: Pick<Segment, "startCol" | "span" | "lane">) => {
  const leftPct = (seg.startCol / 7) * 100;
  const widthPct = (seg.span / 7) * 100;
  return {
    left: `calc(${leftPct}% + 2px)`,
    width: `calc(${widthPct}% - 4px)`,
    top: `${seg.lane * (LANE_HEIGHT + LANE_GAP)}px`,
    height: `${LANE_HEIGHT}px`,
  };
};

const segmentTitle = (seg: Segment) => {
  const name = seg.booking.resource_name || "Buchung";
  const start = formatTime(seg.booking.start_at);
  const end = seg.booking.end_at ? formatTime(seg.booking.end_at) : "";
  return end ? `${name} (${start} – ${end})` : `${name} (${start})`;
};

const assignLanes = (segments: Omit<Segment, "lane">[]): Segment[] => {
  const sorted = [...segments].sort(
    (a, b) => a.startCol - b.startCol || b.span - a.span,
  );
  const laneEnds: number[] = [];
  const result: Segment[] = [];

  for (const seg of sorted) {
    let lane = laneEnds.findIndex((end) => end < seg.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(-1);
    }
    laneEnds[lane] = seg.startCol + seg.span - 1;
    result.push({ ...seg, lane });
  }
  return result;
};

const buildSegmentsForRange = (
  weekDays: DayCell[],
  weekStart: Date,
  weekEnd: Date,
  bStart: Date,
  bEnd: Date,
  booking: any,
): Omit<Segment, "lane"> | null => {
  if (bEnd < weekStart || bStart > weekEnd) return null;

  let startCol = -1;
  let endCol = -1;
  for (let c = 0; c < 7; c++) {
    const dayStart = startOfDay(weekDays[c].date);
    const dayEnd = endOfDay(weekDays[c].date);
    if (bStart <= dayEnd && bEnd >= dayStart) {
      if (startCol === -1) startCol = c;
      endCol = c;
    }
  }
  if (startCol === -1 || endCol === -1) return null;

  const isStart = sameDay(bStart, weekDays[startCol].date);
  const continuesBefore = bStart < weekStart;
  const continuesAfter = bEnd > weekEnd;

  return {
    booking,
    startCol,
    span: endCol - startCol + 1,
    isStart: isStart && !continuesBefore,
    continuesBefore,
    continuesAfter,
  };
};

const weeks = computed(() => {
  const year = props.currentDate.getFullYear();
  const month = props.currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay();
  const diff = startingDayOfWeek === 0 ? -6 : 1 - startingDayOfWeek;
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() + diff);
  gridStart.setHours(0, 0, 0, 0);

  const preview = dropPreview.value;
  const previewStartDay = preview ? startOfDay(preview.start) : null;
  const previewEndDay = preview ? startOfDay(preview.end) : null;

  const allDays: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const dayStart = startOfDay(d);
    const isDropTarget = !!(
      dropTargetDate.value && sameDay(d, dropTargetDate.value)
    );
    const isInDropRange = !!(
      previewStartDay &&
      previewEndDay &&
      dayStart >= previewStartDay &&
      dayStart <= previewEndDay
    );
    allDays.push({
      date: d,
      isCurrentMonth: d.getMonth() === month,
      isToday: sameDay(d, new Date()),
      isDropTarget,
      isInDropRange,
    });
  }

  const result = [];
  for (let w = 0; w < 6; w++) {
    const weekDays = allDays.slice(w * 7, w * 7 + 7);
    const weekStart = startOfDay(weekDays[0].date);
    const weekEnd = endOfDay(weekDays[6].date);

    const rawSegments: Omit<Segment, "lane">[] = [];

    for (const booking of props.bookings) {
      const bStart = new Date(booking.start_at);
      const bEnd = booking.end_at ? new Date(booking.end_at) : new Date(bStart);
      const seg = buildSegmentsForRange(
        weekDays,
        weekStart,
        weekEnd,
        bStart,
        bEnd,
        booking,
      );
      if (seg) rawSegments.push(seg);
    }

    const segments = assignLanes(rawSegments);

    const ghostSegments: Segment[] = [];
    if (preview) {
      const ghostBooking = {
        ...preview.booking,
        start_at: preview.start.toISOString(),
        end_at: preview.end.toISOString(),
      };
      const ghost = buildSegmentsForRange(
        weekDays,
        weekStart,
        weekEnd,
        preview.start,
        preview.end,
        ghostBooking,
      );
      if (ghost) {
        const occupied = Math.max(
          0,
          ...segments.map((s) => s.lane),
          -1,
        );
        ghostSegments.push({
          ...ghost,
          lane: occupied + 1,
        });
      }
    }

    const maxLanes =
      Math.max(
        segments.reduce((m, s) => Math.max(m, s.lane + 1), 0),
        ghostSegments.reduce((m, s) => Math.max(m, s.lane + 1), 0),
        1,
      ) || 1;

    result.push({
      days: weekDays,
      segments,
      ghostSegments,
      maxLanes,
    });
  }

  return result;
});

const clearDrag = () => {
  draggingBooking.value = null;
  dropTargetDate.value = null;
};

const onDragStart = (seg: Segment, event: DragEvent) => {
  if (seg.booking.status === "CANCELLED" || !seg.isStart) return;
  draggingBooking.value = seg.booking;
  dropTargetDate.value = null;
  dropOccurred.value = false;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(seg.booking.id));
  }
  emit("drag-start", { booking: seg.booking, event });
};

const onDragOverDay = (day: DayCell, event: DragEvent) => {
  if (!draggingBooking.value) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  if (
    !dropTargetDate.value ||
    !sameDay(dropTargetDate.value, day.date)
  ) {
    dropTargetDate.value = day.date;
  }
};

const onDropDay = (day: DayCell, event: DragEvent) => {
  event.preventDefault();
  if (!draggingBooking.value) return;
  dropOccurred.value = true;
  emit("drop-booking", { date: day.date, event });
  clearDrag();
};

const onDragEnd = () => {
  const wasDropped = dropOccurred.value;
  clearDrag();
  dropOccurred.value = false;
  emit("drag-end", { dropped: wasDropped });
};
</script>
