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
      title: "Fabrik Sonntag Management"
    }
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@nuxt/ui"],
  css: ['~/assets/css/main.css'],
  ui: {
    fonts: false,
    colorMode: false,
    theme: {
      colors: ['primary', 'error']
    }
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
