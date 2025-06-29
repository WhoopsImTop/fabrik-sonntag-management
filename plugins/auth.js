export default defineNuxtPlugin((nuxtApp) => {
  // Interceptiere alle Fetch-Requests
  nuxtApp.hook('app:rendered', () => {
    // Nur einmal patchen
    if (window.__jwtFetchPatched) return;
    window.__jwtFetchPatched = true;
    const origFetch = window.fetch;
    window.fetch = async (input, init = {}) => {
      const token = localStorage.getItem('jwt');
      if (token) {
        init.headers = init.headers || {};
        if (init.headers instanceof Headers) {
          init.headers.set('Authorization', `Bearer ${token}`);
        } else {
          init.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      // Führe Request aus
      const response = await origFetch(input, init);
      
      // Wenn 401 (Unauthorized) zurückkommt, Token entfernen und zur Login-Seite
      if (response.status === 401) {
        localStorage.removeItem('jwt');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      return response;
    };
  });
});
