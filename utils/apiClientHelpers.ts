export type ApiToast = {
  add: (toast: {
    title: string;
    description: string;
    color: string;
  }) => void;
};

export type ApiRouter = {
  push: (path: string) => unknown;
};

export function getAuthHeaders(
  storage: Storage = localStorage,
): Record<string, string> {
  const token = storage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  400: "Ungültige Anfrage. Bitte überprüfen Sie Ihre Eingaben.",
  403: "Sie haben keine Berechtigung für diese Aktion.",
  404: "Die angeforderte Ressource wurde nicht gefunden.",
  409: "Konflikt: Diese Aktion kann nicht ausgeführt werden.",
  422: "Die Daten konnten nicht verarbeitet werden.",
  500: "Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
  503: "Der Service ist vorübergehend nicht verfügbar.",
};

export type HandleApiErrorOptions = {
  statusMessages?: Record<number, string>;
  toastColor?: string;
  storage?: Storage;
};

/**
 * Shared API error handler for booking/meter clients.
 * On 401: clears JWT and redirects to login.
 */
export function handleApiError(
  error: any,
  context: string,
  toast: ApiToast,
  router: ApiRouter,
  options: HandleApiErrorOptions = {},
): void {
  console.error(`Error in ${context}:`, error);

  const storage = options.storage ?? localStorage;
  const toastColor = options.toastColor ?? "red";

  if (error.status === 401 || error.statusCode === 401) {
    storage.removeItem("jwt");
    toast.add({
      title: "Sitzung abgelaufen",
      description: "Bitte melden Sie sich erneut an.",
      color: toastColor,
    });
    router.push("/login");
    return;
  }

  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    const messages = {
      ...DEFAULT_STATUS_MESSAGES,
      ...options.statusMessages,
    };
    const message =
      messages[status] || `Ein Fehler ist aufgetreten (${status}).`;
    toast.add({ title: "Fehler", description: message, color: toastColor });
    return;
  }

  if (error.message?.includes("fetch")) {
    toast.add({
      title: "Netzwerkfehler",
      description: "Bitte überprüfen Sie Ihre Internetverbindung.",
      color: toastColor,
    });
  } else {
    toast.add({
      title: "Fehler",
      description: "Ein unerwarteter Fehler ist aufgetreten.",
      color: toastColor,
    });
  }
}

export async function apiCall<T>(
  fn: () => Promise<T>,
  context: string,
  toast: ApiToast,
  router: ApiRouter,
  options: HandleApiErrorOptions = {},
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    handleApiError(error, context, toast, router, options);
    return null;
  }
}
