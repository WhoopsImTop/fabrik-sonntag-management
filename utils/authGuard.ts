export const AUTH_PUBLIC_PATHS = [
  "/login",
  "/request-password-reset",
  "/reset-password",
] as const;

/**
 * Returns a redirect path when the route requires auth and no token is present.
 * Returns null when navigation should proceed.
 */
export function getAuthRedirect(
  path: string,
  token: string | null,
  publicPaths: readonly string[] = AUTH_PUBLIC_PATHS,
): string | null {
  if (publicPaths.includes(path)) return null;
  if (!token) return "/login";
  return null;
}
