<script setup lang="ts">
const items = ref([
  [
    {
      label: "Haus 5",
      icon: "i-lucide-house",
      active: true,
      defaultOpen: true,
      children: [
        {
          label: "Haustechnik",
          description: "Hier befinden sich die Screenshots der Zähler",
          icon: "i-lucide-settings",
          children: [
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
    class="data-[orientation=vertical]:w-56 h-screen"
  >
  </UNavigationMenu>
</template>
