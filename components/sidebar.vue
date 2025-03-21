<script setup lang="ts">
const items = ref([
  [
    {
      label: "Campus",
      icon: "i-lucide-map-pin-house",
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
              label: "Übersicht",
              icon: "i-lucide-map",
              to: "/haus-5/overview",
            },
            {
              label: "Stromzähler",
              icon: "i-lucide-image",
              to: "/haus-5/haustechnik?query=strom",
            },
            {
              label: "Gaszähler",
              icon: "i-lucide-image",
              to: "/haus-5/haustechnik?query=gas",
            },
          ],
        },
      ],
    },
    {
      label: "Mieter",
      icon: "i-lucide-circle-user-round",
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
