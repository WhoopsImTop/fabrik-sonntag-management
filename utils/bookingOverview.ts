export type BookingTodoSummary = {
  done: number;
  total: number;
  open: number;
  label: string;
  allDone: boolean;
  hasTodos: boolean;
};

function getBookingTasks(booking: any): any[] {
  return booking?.BookingTasks || booking?.bookingTasks || [];
}

/** Checklist progress from booking tasks only — empty when the booking has no todos. */
export function getBookingTodoSummary(booking: any): BookingTodoSummary {
  const tasks = getBookingTasks(booking);

  if (tasks.length === 0) {
    return {
      done: 0,
      total: 0,
      open: 0,
      allDone: false,
      hasTodos: false,
      label: "",
    };
  }

  const total = tasks.length;
  const done = tasks.filter((t: any) => !!t.is_completed).length;
  const open = total - done;
  const allDone = open === 0;

  return {
    done,
    total,
    open,
    allDone,
    hasTodos: true,
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
