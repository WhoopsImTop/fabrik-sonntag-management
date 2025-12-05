<template>
  <div
    :class="[
      'bg-white rounded-lg p-4 border border-black/10 shadow-sm',
      colorClasses[color] || colorClasses.blue
    ]"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-neutral-600 mb-1">{{ title }}</p>
        <p class="text-2xl font-bold">{{ value }}</p>
      </div>
      <div class="p-3 rounded-lg bg-neutral-50">
        <UIcon :name="icon" size="24" />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: String,
    default: 'i-lucide-activity'
  },
  color: {
    type: String,
    default: 'blue'
  }
});

const colorClasses = {
  blue: 'border-l-4 border-l-blue-400',
  green: 'border-l-4 border-l-green-400',
  yellow: 'border-l-4 border-l-yellow-400',
  purple: 'border-l-4 border-l-purple-400',
  red: 'border-l-4 border-l-red-400'
};
</script>

<style scoped></style>
