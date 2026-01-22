<template>
  <div class="rounded-md border border-slate-200 bg-white shadow-sm flex flex-col h-full select-none">
    <div class="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 flex-shrink-0">
      <div v-for="day in ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']" :key="day" class="py-3 text-center text-[0.8rem] font-medium text-slate-500 uppercase tracking-wide">
        {{ day }}
      </div>
    </div>
    
    <div class="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px flex-1 overflow-y-auto font-sans">
      <div 
        v-for="(day, idx) in calendarDays" 
        :key="idx"
        @dragover.prevent
        @drop="$emit('drop-booking', { date: day.date, event: $event })"
        :class="[
          'bg-white min-h-[110px] p-2 transition-colors relative group flex flex-col',
          !day.isCurrentMonth ? 'bg-slate-50/30 text-slate-400' : 'text-slate-900',
          day.isToday ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
        ]"
      >
        <div class="flex justify-between items-start mb-1">
          <span :class="['text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all', day.isToday ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500']">
            {{ day.date.getDate() }}
          </span>
          <button 
            @click.stop="$emit('create', day.date)" 
            class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all"
            title="Neu"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>

        <div class="flex-1 space-y-1 overflow-hidden">
          <div 
            v-for="booking in day.bookings" 
            :key="booking.id"
            draggable="true"
            @dragstart="$emit('drag-start', { booking, event: $event })"
            @click.stop="$emit('select', booking)"
            v-show="booking.status != 'CANCELLED'"
            :class="[
              'text-[11px] px-2 py-1 rounded-sm border cursor-pointer transition-all active:cursor-grabbing truncate flex items-center gap-1.5 shadow-sm hover:shadow-md hover:z-10 relative',
              getBookingStyles(booking)
            ]"
          >
            <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="getDotColor(booking)"></div>
            
            <div class="flex-1 truncate font-medium flex items-center">
               <span v-if="isStartDay(booking, day.date)" class="mr-1 font-normal opacity-70">
                {{ formatTime(booking.start_at) }}
              </span>
              <span v-else class="mr-1 text-[9px] opacity-40">↳</span>
              
              {{ booking.resource_name }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  bookings: any[]
  currentDate: Date
}>()

const emit = defineEmits(['select', 'create', 'drop-booking', 'drag-start'])

// Modernere, subtilere Palette für Shadcn-Look
const styles = [
  { bg: 'bg-white', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-500' }, // Default
  { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
]

const getStyleConfig = (id: any) => {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id
  if (!numId || isNaN(numId)) return styles[0]
  return styles[numId % styles.length]
}

const getBookingStyles = (b: any) => {
  if (b.status === 'CANCELLED') {
    return 'bg-slate-50 text-slate-400 border-slate-100 line-through decoration-slate-400'
  }
  const style = getStyleConfig(b.resource_id)
  return `${style.bg} ${style.border} ${style.text}`
}

const getDotColor = (b: any) => {
  if (b.status === 'CANCELLED') return 'bg-slate-300'
  const style = getStyleConfig(b.resource_id)
  return style.dot
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute:'2-digit' })

const isStartDay = (booking: any, dayDate: Date) => {
  const start = new Date(booking.start_at)
  return start.getDate() === dayDate.getDate() && start.getMonth() === dayDate.getMonth()
}

// Kalender-Logik (unverändert, da sie funktioniert)
const calendarDays = computed(() => {
  const year = props.currentDate.getFullYear()
  const month = props.currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const startingDayOfWeek = firstDay.getDay()
  const diff = startingDayOfWeek === 0 ? -6 : 1 - startingDayOfWeek
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() + diff)

  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999)

    const dayBookings = props.bookings.filter(b => {
      const bStart = new Date(b.start_at)
      const bEnd = b.end_at ? new Date(b.end_at) : new Date(b.start_at)
      return bStart <= dayEnd && bEnd >= dayStart
    })

    days.push({
      date: new Date(d),
      isCurrentMonth: d.getMonth() === month,
      isToday: d.toDateString() === new Date().toDateString(),
      bookings: dayBookings
    })
  }
  return days
})
</script>
