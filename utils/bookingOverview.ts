export type BookingTodoSummary = {
  done: number;
  total: number;
  open: number;
  label: string;
  allDone: boolean;
};

function getBookingTasks(booking: any): any[] {
  return booking?.BookingTasks || booking?.bookingTasks || [];
}

/** Derive checklist progress from booking tasks when present, else from legacy fields. */
export function getBookingTodoSummary(booking: any): BookingTodoSummary {
  const tasks = getBookingTasks(booking);

  if (tasks.length > 0) {
    const total = tasks.length;
    const done = tasks.filter((t: any) => !!t.is_completed).length;
    const open = total - done;
    const allDone = open === 0;

    return {
      done,
      total,
      open,
      allDone,
      label: allDone ? "Alles erledigt!" : `${open}/${total} offen`,
    };
  }

  const checks = [
    booking.status === "CONFIRMED" || booking.status === "CANCELLED",
    !!(booking.Invoice || booking.invoice_id || booking.invoice),
    ["PAID"].includes(
      booking.Invoice?.status || booking.invoice?.status || "",
    ),
    !!(
      booking.welcome_email_sent ||
      booking.has_communication ||
      booking.communications?.length
    ),
  ];

  const total = checks.length;
  const done = checks.filter(Boolean).length;
  const open = total - done;
  const allDone = open === 0;

  return {
    done,
    total,
    open,
    allDone,
    label: allDone ? "Alles erledigt!" : `${open}/${total} offen`,
  };
}

export function getBookingUserName(booking: any): string {
  return (
    booking.User?.details?.company ||
    `${booking.User?.details?.first_name ?? ""} ${booking.User?.details?.last_name ?? ""}`.trim() ||
    booking.user_name ||
    "Unbekannt"
  );
}

export function formatBookingZeitraum(start: string, end?: string): string {
  const s = new Date(start);
  const e = end ? new Date(end) : s;
  const dateOpts: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  const startDate = s.toLocaleDateString("de-DE", dateOpts);
  const endDate = e.toLocaleDateString("de-DE", dateOpts);
  const startTime = s.toLocaleTimeString("de-DE", timeOpts);
  const endTime = e.toLocaleTimeString("de-DE", timeOpts);

  return `${startDate} ${startTime} - ${endDate} ${endTime} Uhr`;
}
