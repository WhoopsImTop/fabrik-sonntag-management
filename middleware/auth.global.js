import { getAuthRedirect } from "~/utils/authGuard";

export default defineNuxtRouteMiddleware((to) => {
  // Nur im Browser ausführen, nicht beim Server-Side Rendering
  if (import.meta.server) return;

  const token = localStorage.getItem("jwt");
  const redirect = getAuthRedirect(to.path, token);
  if (redirect) {
    return navigateTo(redirect);
  }
});
