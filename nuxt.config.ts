// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  ssr: false,
  experimental: {
    // SPA (ssr: false): ohne SSR-Vite-Server wird sonst kein Vite-Node-IPC-Socket gesetzt
    viteEnvironmentApi: true,
  },
  app: {
    head: {
      title: "Fabrik Sonntag Management",
      link: [
        {
          rel: "stylesheet",
          href: "https://use.typekit.net/gqu3pfc.css",
        },
      ],
    },
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
});
