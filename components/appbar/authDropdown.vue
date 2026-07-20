<script setup>
const items = [
  [
    {
      label: "Hilfe",
      icon: "i-lucide-message-circle-question",
    },
  ],
  [
    {
      label: "Passwort ändern",
      icon: "i-lucide-key-round",
      to: "/change-password",
    },
    {
      label: "Abmelden",
      color: "neutral",
      icon: "i-lucide-lock-open",
      onSelect() {
        localStorage.removeItem("jwt");
        window.location.reload();
      },
    },
  ],
];
</script>

<template>
  <UiDropdownMenu :items="items" :ui="{ content: 'w-48' }">
    <UiButton color="neutral" variant="none" icon="i-lucide-menu" />
  </UiDropdownMenu>
</template>
