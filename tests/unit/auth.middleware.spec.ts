import { describe, it, expect } from "vitest";
import {
  getAuthRedirect,
  AUTH_PUBLIC_PATHS,
  BOOKING_HOME_PATH,
} from "../../utils/authGuard";

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

  it("lässt Booking-Routen mit Token zu", () => {
    expect(getAuthRedirect("/booking-system", "jwt-token", "admin")).toBeNull();
    expect(
      getAuthRedirect("/booking-system/calendar", "jwt-token", "sachbearbeiter"),
    ).toBeNull();
  });

  it("lässt Admin-Routen für Admins zu", () => {
    expect(getAuthRedirect("/", "jwt-token", "admin")).toBeNull();
    expect(getAuthRedirect("/meters", "jwt-token", "admin")).toBeNull();
    expect(getAuthRedirect("/haus-5/haustechnik", "jwt-token", "admin")).toBeNull();
  });

  it("blockiert Admin-Routen für Sachbearbeiter", () => {
    expect(getAuthRedirect("/", "jwt-token", "sachbearbeiter")).toBe(
      BOOKING_HOME_PATH,
    );
    expect(getAuthRedirect("/meters", "jwt-token", "sachbearbeiter")).toBe(
      BOOKING_HOME_PATH,
    );
    expect(
      getAuthRedirect("/meters/readings", "jwt-token", "sachbearbeiter"),
    ).toBe(BOOKING_HOME_PATH);
    expect(
      getAuthRedirect("/haus-5/haustechnik", "jwt-token", "sachbearbeiter"),
    ).toBe(BOOKING_HOME_PATH);
  });
});
