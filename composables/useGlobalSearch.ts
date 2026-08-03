export type SearchResultType =
  | "booking"
  | "resource"
  | "invoice"
  | "user"
  | "nav";

export type SearchResult = {
  type: SearchResultType;
  id: string | number;
  title: string;
  subtitle?: string;
  to: string;
};

export type SearchResultGroup = {
  type: SearchResultType;
  label: string;
  items: SearchResult[];
};

const LIMIT_PER_TYPE = 5;

const TYPE_LABELS: Record<SearchResultType, string> = {
  booking: "Buchungen",
  resource: "Ressourcen",
  invoice: "Rechnungen",
  user: "Nutzer",
  nav: "Navigation",
};

const includes = (value: unknown, q: string) =>
  String(value ?? "")
    .toLowerCase()
    .includes(q);

const userDisplayName = (user: any) => {
  const first = user?.details?.first_name || user?.UserDetail?.first_name;
  const last = user?.details?.last_name || user?.UserDetail?.last_name;
  const company = user?.details?.company || user?.UserDetail?.company;
  const name = [first, last].filter(Boolean).join(" ").trim();
  return company || name || user?.username || user?.email || "Unbekannt";
};

const formatBookingDate = (value?: string) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const statusLabel: Record<string, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  CANCELLED: "Storniert",
  DRAFT: "Entwurf",
  SENT: "Gesendet",
  PAID: "Bezahlt",
  OVERDUE: "Überfällig",
  DELETED: "Gelöscht",
};

const CACHE_TTL_MS = 60_000;

const searchCache = {
  users: null as any[] | null,
  resources: null as any[] | null,
  invoices: null as any[] | null,
  bookings: null as any[] | null,
  loadedAt: 0,
};

let loadingPromise: Promise<void> | null = null;

export const useGlobalSearch = () => {
  const api = useBookingApi();

  const ensureData = async () => {
    const now = Date.now();
    if (
      searchCache.users &&
      searchCache.resources &&
      searchCache.invoices &&
      searchCache.bookings &&
      now - searchCache.loadedAt < CACHE_TTL_MS
    ) {
      return;
    }

    if (loadingPromise) {
      await loadingPromise;
      return;
    }

    loadingPromise = (async () => {
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      const end = new Date();
      end.setMonth(end.getMonth() + 6);

      const [users, resources, invoices, bookings] = await Promise.all([
        api.users.getAll(),
        api.resources.getAll(),
        api.sales.getAll(),
        api.bookings.getAll({
          start: start.toISOString(),
          end: end.toISOString(),
        }),
      ]);

      searchCache.users = Array.isArray(users) ? users : [];
      searchCache.resources = Array.isArray(resources) ? resources : [];
      searchCache.invoices = Array.isArray(invoices) ? invoices : [];
      searchCache.bookings = Array.isArray(bookings) ? bookings : [];
      searchCache.loadedAt = Date.now();
    })();

    try {
      await loadingPromise;
    } finally {
      loadingPromise = null;
    }
  };

  const searchUsers = (q: string): SearchResult[] => {
    return (searchCache.users || [])
      .filter(
        (user) =>
          includes(user.username, q) ||
          includes(user.email, q) ||
          includes(user.details?.first_name, q) ||
          includes(user.details?.last_name, q) ||
          includes(user.details?.company, q) ||
          includes(
            `${user.details?.first_name || ""} ${user.details?.last_name || ""}`,
            q,
          ),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((user) => ({
        type: "user" as const,
        id: user.id,
        title: userDisplayName(user),
        subtitle: user.email || user.username,
        to: `/booking-system/users/${user.id}`,
      }));
  };

  const searchResources = (q: string): SearchResult[] => {
    return (searchCache.resources || [])
      .filter(
        (resource) =>
          includes(resource.name, q) ||
          includes(resource.description, q) ||
          includes(resource.id, q),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((resource) => ({
        type: "resource" as const,
        id: resource.id,
        title: resource.name || `Ressource #${resource.id}`,
        subtitle: resource.description
          ? String(resource.description).slice(0, 80)
          : undefined,
        to: `/booking-system/resources?id=${resource.id}`,
      }));
  };

  const searchInvoices = (q: string): SearchResult[] => {
    return (searchCache.invoices || [])
      .filter(
        (inv) =>
          includes(inv.invoice_number, q) ||
          includes(inv.User?.username, q) ||
          includes(inv.User?.email, q) ||
          includes(inv.recipient_company, q) ||
          includes(inv.recipient_email, q) ||
          includes(inv.recipient_first_name, q) ||
          includes(inv.recipient_last_name, q) ||
          includes(
            `${inv.recipient_first_name || ""} ${inv.recipient_last_name || ""}`,
            q,
          ),
      )
      .slice(0, LIMIT_PER_TYPE)
      .map((inv) => {
        const recipient =
          inv.recipient_company ||
          [inv.recipient_first_name, inv.recipient_last_name]
            .filter(Boolean)
            .join(" ") ||
          inv.User?.username ||
          inv.recipient_email;
        const status = statusLabel[inv.status] || inv.status;
        return {
          type: "invoice" as const,
          id: inv.id,
          title: inv.invoice_number || `Rechnung #${inv.id}`,
          subtitle: [recipient, status].filter(Boolean).join(" · "),
          to: `/booking-system/invoices/${inv.id}`,
        };
      });
  };

  const searchBookings = (q: string): SearchResult[] => {
    return (searchCache.bookings || [])
      .filter((booking) => {
        const user = booking.User;
        const details = user?.details || user?.UserDetail;
        return (
          includes(booking.id, q) ||
          includes(booking.resource_name, q) ||
          includes(booking.Resource?.name, q) ||
          includes(booking.user_name, q) ||
          includes(user?.username, q) ||
          includes(user?.email, q) ||
          includes(details?.first_name, q) ||
          includes(details?.last_name, q) ||
          includes(details?.company, q) ||
          includes(booking.status, q) ||
          includes(statusLabel[booking.status], q)
        );
      })
      .slice(0, LIMIT_PER_TYPE)
      .map((booking) => {
        const resourceName =
          booking.resource_name ||
          booking.Resource?.name ||
          `Buchung #${booking.id}`;
        const userName = userDisplayName(booking.User) || booking.user_name;
        const when = formatBookingDate(booking.start_at);
        const status = statusLabel[booking.status] || booking.status;
        return {
          type: "booking" as const,
          id: booking.id,
          title: resourceName,
          subtitle: [userName, when, status].filter(Boolean).join(" · "),
          to: `/booking-system/calendar?id=${booking.id}`,
        };
      });
  };

  const search = async (query: string): Promise<SearchResultGroup[]> => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    await ensureData();

    const groups: SearchResultGroup[] = [];
    const add = (type: SearchResultType, items: SearchResult[]) => {
      if (items.length) {
        groups.push({ type, label: TYPE_LABELS[type], items });
      }
    };

    add("user", searchUsers(q));
    add("booking", searchBookings(q));
    add("resource", searchResources(q));
    add("invoice", searchInvoices(q));

    return groups;
  };

  const invalidate = () => {
    searchCache.users = null;
    searchCache.resources = null;
    searchCache.invoices = null;
    searchCache.bookings = null;
    searchCache.loadedAt = 0;
  };

  return { search, invalidate, TYPE_LABELS };
};
