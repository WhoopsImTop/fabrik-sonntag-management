export type AppRole = "admin" | "sachbearbeiter" | "user";

export type AuthUser = {
  id?: number;
  username?: string;
  email?: string;
  role?: AppRole | string;
};

const AUTH_USER_KEY = "auth_user";

export const BOOKING_STAFF_ROLES = new Set(["admin", "sachbearbeiter"]);

export const ADMIN_ONLY_PATH_PREFIXES = [
  "/meters",
  "/haus-5",
] as const;

/** Exact paths that are admin-only (campusplan / map). */
export const ADMIN_ONLY_EXACT_PATHS = ["/", "/settings"] as const;

export const BOOKING_HOME_PATH = "/booking-system";

export function isBookingStaff(role?: string | null): boolean {
  return !!role && BOOKING_STAFF_ROLES.has(role);
}

export function isAdmin(role?: string | null): boolean {
  return role === "admin";
}

export function decodeJwtPayload(token: string | null): AuthUser | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) return JSON.parse(raw) as AuthUser;
  } catch {
    // ignore
  }
  return decodeJwtPayload(localStorage.getItem("jwt"));
}

export function setStoredAuthUser(user: AuthUser | null) {
  if (typeof localStorage === "undefined") return;
  if (!user) {
    localStorage.removeItem(AUTH_USER_KEY);
    return;
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem("jwt");
  localStorage.removeItem(AUTH_USER_KEY);
}

export function getDefaultHomePath(role?: string | null): string {
  if (isAdmin(role)) return "/";
  if (isBookingStaff(role)) return BOOKING_HOME_PATH;
  return BOOKING_HOME_PATH;
}

/**
 * Returns true when the path is outside the booking system and
 * therefore restricted for non-admin roles.
 */
export function isAdminOnlyPath(path: string): boolean {
  if (ADMIN_ONLY_EXACT_PATHS.includes(path as (typeof ADMIN_ONLY_EXACT_PATHS)[number])) {
    return true;
  }
  return ADMIN_ONLY_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export const AUTH_PUBLIC_PATHS = [
  "/login",
  "/request-password-reset",
  "/reset-password",
] as const;

/**
 * Returns a redirect path when navigation should be blocked.
 * Returns null when navigation should proceed.
 */
export function getAuthRedirect(
  path: string,
  token: string | null,
  role?: string | null,
  publicPaths: readonly string[] = AUTH_PUBLIC_PATHS,
): string | null {
  if (publicPaths.includes(path)) return null;
  if (!token) return "/login";

  const resolvedRole = role ?? decodeJwtPayload(token)?.role ?? null;

  // Non-admins may not access meters, campusplan, haus-5, etc.
  if (!isAdmin(resolvedRole) && isAdminOnlyPath(path)) {
    return getDefaultHomePath(resolvedRole);
  }

  return null;
}
