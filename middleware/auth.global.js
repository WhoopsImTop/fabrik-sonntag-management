export default defineNuxtRouteMiddleware((to, from) => {
  // Nur im Browser ausführen, nicht beim Server-Side Rendering
  if (process.server) return

  // Login-Seite ist immer erlaubt
  if (to.path === '/login') return

  // Prüfe ob JWT Token vorhanden ist
  const token = localStorage.getItem('jwt')
  
  if (!token) {
    // Kein Token vorhanden, zur Login-Seite weiterleiten
    return navigateTo('/login')
  }
  
  // Optional: Token-Gültigkeit prüfen (falls die API das unterstützt)
  // Hier könntest du eine schnelle API-Anfrage machen um zu prüfen ob der Token noch gültig ist
})
