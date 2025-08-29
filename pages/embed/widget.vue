<template>
  <EmbedWidget :title="title" :apiUrl="apiUrl" :origin="allowedOrigin" />
</template>

<script setup>
import { onMounted } from 'vue';
import EmbedWidget from '@/components/embed/EmbedWidget.vue';

// use the minimal embed layout
definePageMeta({
  layout: "embed",
});

const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const title = search.get('title') || 'Anfrage senden';
const apiUrl = search.get('apiUrl') || '';
const allowedOrigin = search.get('origin') || '*';

onMounted(() => {
  // listen for host updates if needed
  window.addEventListener('message', (ev) => {
    const data = ev.data || {};
    if (data && data.type === 'fs-embed-update') {
      // can implement dynamic updates here; simple approach: reload
      window.location.reload();
    }
  });
});
</script>

<style>
html, body { margin: 0; padding: 0; background: transparent; }
/* center the widget by default inside the iframe */
body { display:flex; align-items:flex-start; justify-content:center; }
</style>
