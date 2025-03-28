<script setup lang="ts">
const items = ref([
  [
    {
      label: "Campus",
      icon: "i-lucide-map-pin-house",
      to: "/"
    },
    {
      label: "Gebäude",
      icon: "i-lucide-house",
      to: "/",
      defaultOpen: true,
      children: [
        {
          label: "Haus 5",
          icon: "i-lucide-house",
          to: "/haus-5",
          children: [
            {
              label: "Zähler",
              icon: "i-lucide-image",
              to: "/haus-5/haustechnik",
            },
          ],
        },
      ],
    },
    {
      label: "Mietpreisanalyse",
      icon: "i-lucide-chart-candlestick",
      to: "/mietpreisanalyse"
    },
  ],
  [
    {
      label: "Fabrik Sonntag",
      icon: "i-lucide-earth",
      to: "https://fabrik-sonntag.de",
      target: "_blank",
    },
    {
      label: "Ideenlabor Sonntag",
      icon: "i-lucide-earth",
      to: "https://ideenlabor-sonntag.de",
      target: "_blank",
    },
  ],
]);
</script>

<template>
  <UNavigationMenu
    orientation="vertical"
    :items="items"
    class="data-[orientation=vertical]:w-56 h-full"
  >
  </UNavigationMenu>
</template>
