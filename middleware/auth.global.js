import { getAuthRedirect, getStoredAuthUser } from "~/utils/authGuard";

export default defineNuxtRouteMiddleware((to) => {
  // Nur im Browser ausführen, nicht beim Server-Side Rendering
  if (import.meta.server) return;

  const token = localStorage.getItem("jwt");
  const role = getStoredAuthUser()?.role ?? null;
  const redirect = getAuthRedirect(to.path, token, role);
  if (redirect) {
    return navigateTo(redirect);
  }
});
