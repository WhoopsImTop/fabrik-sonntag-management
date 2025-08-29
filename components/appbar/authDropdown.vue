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
      label: "Abmelden",
      color: "neutral",
      icon: "i-lucide-lock-open",
      onSelect(e) {
        localStorage.removeItem("jwt");
        window.location.reload();
      },
    },
  ],
];
</script>

<template>
  <UDropdownMenu :items="items" :ui="{ content: 'w-48' }">
    <UButton color="neutral" variant="none" icon="i-lucide-menu" />

    <template #profile-trailing>
      <UIcon
        name="i-lucide-badge-check"
        class="shrink-0 size-5 text-(--ui-primary)"
      />
    </template>
  </UDropdownMenu>
</template>
