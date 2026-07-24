import { describe, it, expect } from "vitest";
import {
  getBookingTodoSummary,
  getBookingUserName,
  formatBookingZeitraum,
} from "../../utils/bookingOverview";

describe("getBookingTodoSummary", () => {
  it("leitet Fortschritt aus BookingTasks ab", () => {
    const summary = getBookingTodoSummary({
      BookingTasks: [
        { is_completed: true },
        { is_completed: false },
        { is_completed: false },
      ],
    });

    expect(summary).toEqual({
      done: 1,
      total: 3,
      open: 2,
      allDone: false,
      hasTodos: true,
      label: "2/3 offen",
    });
  });

  it("zeigt Alles erledigt wenn alle Tasks fertig sind", () => {
    const summary = getBookingTodoSummary({
      bookingTasks: [{ is_completed: true }, { is_completed: true }],
    });

    expect(summary.allDone).toBe(true);
    expect(summary.hasTodos).toBe(true);
    expect(summary.label).toBe("Alles erledigt!");
  });

  it("liefert leere Summary wenn keine Tasks vorhanden", () => {
    const summary = getBookingTodoSummary({
      status: "CONFIRMED",
      invoice_id: 12,
    });

    expect(summary).toEqual({
      done: 0,
      total: 0,
      open: 0,
      allDone: false,
      hasTodos: false,
      label: "",
    });
  });
});

describe("getBookingUserName", () => {
  it("bevorzugt Firmenname", () => {
    expect(
      getBookingUserName({
        User: { details: { company: "Fabrik GmbH", first_name: "A" } },
      }),
    ).toBe("Fabrik GmbH");
  });

  it("nutzt Vor- und Nachname wenn keine Firma", () => {
    expect(
      getBookingUserName({
        User: { details: { first_name: "Elias", last_name: "Englen" } },
      }),
    ).toBe("Elias Englen");
  });

  it("fällt auf Unbekannt zurück", () => {
    expect(getBookingUserName({})).toBe("Unbekannt");
  });
});

describe("formatBookingZeitraum", () => {
  it("formatiert Start und Ende auf Deutsch", () => {
    const label = formatBookingZeitraum(
      "2026-03-15T10:00:00",
      "2026-03-15T12:30:00",
    );
    expect(label).toMatch(/15\.03\./);
    expect(label).toMatch(/Uhr$/);
  });
});
