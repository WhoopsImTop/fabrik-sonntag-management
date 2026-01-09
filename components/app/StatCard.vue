<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-start justify-between transition-shadow hover:shadow-md">
    <div>
      <p class="text-sm font-medium text-slate-500 mb-1">{{ title }}</p>
      <h4 class="text-2xl font-bold text-slate-900 tracking-tight">{{ value }}</h4>
    </div>
    <div :class="['p-2 rounded-lg', colorClasses[color] || 'bg-slate-100 text-slate-600']">
      <slot name="icon">
        <component :is="icon" v-if="typeof icon === 'object'" class="w-5 h-5" />
        <i v-else :class="[icon, 'text-lg']"></i>
      </slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  icon: [String, Object], // Erlaubt String-Klassennamen oder Komponenten
  color: {
    type: String,
    default: 'slate'
  }
});

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  yellow: 'bg-amber-50 text-amber-600',
  purple: 'bg-violet-50 text-violet-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600'
};
</script>