<template>
  <div class="flex min-h-0 flex-col gap-6 pb-12">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-neutral-900">
        Mediathek
      </h1>
      <p class="mt-1 text-sm text-neutral-500">
        Bilder hochladen, löschen oder nach AVIF konvertieren.
      </p>
    </div>

    <MediaLibrary manage-only :is-multi-select="true" />
  </div>
</template>

<script setup>
import MediaLibrary from "@/components/app/MediaLibrary.vue";
</script>
