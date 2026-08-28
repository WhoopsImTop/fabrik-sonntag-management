import {
  clearAuthSession,
  decodeJwtPayload,
  getDefaultHomePath,
  getStoredAuthUser,
  isAdmin,
  isBookingStaff,
  isTenant,
  canAccessHeating,
  setStoredAuthUser,
  type AuthUser,
} from "~/utils/authGuard";

export function useAuth() {
  const user = useState<AuthUser | null>("auth-user", () => null);

  const role = computed(() => user.value?.role ?? null);
  const isLoggedIn = computed(() => !!user.value || !!getToken());
  const canAccessBooking = computed(() => isBookingStaff(role.value));
  const canAccessAdminAreas = computed(() => isAdmin(role.value));
  const canAccessHeatingAreas = computed(() => canAccessHeating(role.value));

  function getToken(): string | null {
    if (import.meta.server) return null;
    return localStorage.getItem("jwt");
  }

  function hydrateFromStorage() {
    if (import.meta.server) return;
    const stored = getStoredAuthUser();
    if (stored) {
      user.value = stored;
      return;
    }
    const fromJwt = decodeJwtPayload(getToken());
    if (fromJwt) {
      user.value = fromJwt;
      setStoredAuthUser(fromJwt);
    }
  }

  function setSession(token: string, authUser?: AuthUser | null) {
    if (import.meta.server) return;
    localStorage.setItem("jwt", token);
    const nextUser = authUser || decodeJwtPayload(token);
    user.value = nextUser;
    setStoredAuthUser(nextUser);
  }

  function logout() {
    clearAuthSession();
    user.value = null;
  }

  async function fetchCurrentUser() {
    const token = getToken();
    if (!token) {
      user.value = null;
      return null;
    }
    try {
      const data = await $fetch<{ user: AuthUser }>(
        `${import.meta.env.VITE_INTERNAL_API_URL}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      user.value = data.user;
      setStoredAuthUser(data.user);
      return data.user;
    } catch {
      return getStoredAuthUser();
    }
  }

  function homePathForCurrentUser() {
    return getDefaultHomePath(role.value);
  }

  return {
    user,
    role,
    isLoggedIn,
    canAccessBooking,
    canAccessAdminAreas,
    canAccessHeatingAreas,
    getToken,
    hydrateFromStorage,
    setSession,
    logout,
    fetchCurrentUser,
    homePathForCurrentUser,
    isAdmin,
    isBookingStaff,
    isTenant,
    canAccessHeating,
  };
}
