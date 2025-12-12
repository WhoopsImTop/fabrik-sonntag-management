<script setup lang="ts">
const items = ref([
  [
    {
      label: "Buchungssystem",
      icon: "i-lucide-calendar-heart",
      defaultOpen: false,
      children: [
        {
          label: "Dashboard",
          icon: "i-lucide-layout-dashboard",
          to: "/booking-system",
        },
        {
          label: "Buchungen",
          icon: "i-lucide-calendar-check",
          to: "/booking-system/bookings",
        },
        {
          label: "Kalender",
          icon: "i-lucide-calendar",
          to: "/booking-system/calendar",
        },
        {
          label: "Nutzer",
          icon: "i-lucide-users",
          to: "/booking-system/users",
        },
        {
          label: "Email-Vorlagen",
          icon: "i-lucide-mail",
          to: "/booking-system/email-templates",
        },
        {
          label: "Resourcen",
          icon: "i-lucide-table-properties",
          to: "/booking-system/resources",
        },
        {
          label: "Mitgliedschaften",
          icon: "i-lucide-award",
          to: "/booking-system/memberships",
        },
        {
          label: "Services",
          to: "/booking-system/services",
          icon: "i-lucide-coffee",
        },
        {
          label: "Rechnungen",
          icon: "i-lucide-file-text",
          to: "/booking-system/invoices",
        },
      ],
    },
    {
      label: "Campus",
      icon: "i-lucide-map-pin-house",
      to: "/",
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
      label: "Einstellungen",
      icon: "i-lucide-settings",
      to: "/settings",
    },
    {
      label: "Mietpreisanalyse",
      icon: "i-lucide-chart-candlestick",
      to: "/mietpreisanalyse",
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
