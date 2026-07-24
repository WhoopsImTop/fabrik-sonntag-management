import { describe, it, expect } from "vitest";
import { getAuthRedirect, AUTH_PUBLIC_PATHS } from "../../utils/authGuard";

describe("getAuthRedirect", () => {
  it.each([...AUTH_PUBLIC_PATHS])(
    "lässt öffentlichen Pfad %s ohne Token zu",
    (path) => {
      expect(getAuthRedirect(path, null)).toBeNull();
    },
  );

  it("leitet geschützte Routen ohne Token auf /login um", () => {
    expect(getAuthRedirect("/booking-system", null)).toBe("/login");
    expect(getAuthRedirect("/", null)).toBe("/login");
    expect(getAuthRedirect("/meters", null)).toBe("/login");
  });

  it("lässt geschützte Routen mit Token zu", () => {
    expect(getAuthRedirect("/booking-system", "jwt-token")).toBeNull();
    expect(getAuthRedirect("/", "jwt-token")).toBeNull();
  });
});
