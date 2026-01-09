export const useBookingApi = () => {
  const config = useRuntimeConfig();
  const baseURL = import.meta.env.VITE_INTERNAL_API_URL || "/api";
  const router = useRouter();
  const toast = useToast();

  // Helper function to get auth token
  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("jwt");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Central error handler
  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);

    // Check if it's a 401 Unauthorized error
    if (error.status === 401 || error.statusCode === 401) {
      localStorage.removeItem("jwt");
      toast.add({
        title: "Sitzung abgelaufen",
        description: "Bitte melden Sie sich erneut an.",
        color: "red",
      });
      router.push("/login");
      return;
    }

    // Handle other HTTP errors
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      const errorMessages: Record<number, string> = {
        400: "Ungültige Anfrage. Bitte überprüfen Sie Ihre Eingaben.",
        403: "Sie haben keine Berechtigung für diese Aktion.",
        404: "Die angeforderte Ressource wurde nicht gefunden.",
        409: "Konflikt: Diese Aktion kann nicht ausgeführt werden.",
        422: "Die Daten konnten nicht verarbeitet werden.",
        500: "Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
        503: "Der Service ist vorübergehend nicht verfügbar.",
      };

      const message =
        errorMessages[status] || `Ein Fehler ist aufgetreten (${status}).`;
      toast.add({ title: "Fehler", description: message, color: "red" });
      return;
    }

    // Network or unknown errors
    if (error.message?.includes("fetch")) {
      toast.add({
        title: "Netzwerkfehler",
        description: "Bitte überprüfen Sie Ihre Internetverbindung.",
        color: "red",
      });
    } else {
      toast.add({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        color: "red",
      });
    }
  };

  // Wrapper for API calls with error handling
  const apiCall = async <T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };

  // 1. User Management
  const users = {
    getProfile: async () => {
      return await apiCall(
        () => $fetch(`${baseURL}/users/profile`, { headers: getAuthHeaders() }),
        "getProfile"
      );
    },

    updateProfile: async (data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/users/profile`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "updateProfile"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    getAll: async () => {
      return await apiCall(
        () => $fetch(`${baseURL}/users`, { headers: getAuthHeaders() }),
        "getUsers"
      );
    },
    // NEU: User erstellen
    create: async (data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/users`, {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "users.create"
      );
      if (result) toast.add({ title: "Benutzer erstellt", color: "green" });
      return result;
    },

    updateStatus: async (id: number, status: string) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/users/${id}/status`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: { status },
          }),
        "updateUserStatus"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    getOne: async (id: string | number) => {
      const res = await fetch(`${baseURL}/users/${id}`, {
        headers: getAuthHeaders(),
      });
      return await res.json();
    },

    update: async (id: string | number, data: any) => {
      const res = await fetch(`${baseURL}/users/${id}`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      return await res.json();
    },
  };

  // 2. Resources
  const resources = {
    getAll: async () => {
      return await apiCall(
        () => $fetch(`${baseURL}/resources`, { headers: getAuthHeaders() }),
        "getResources"
      );
    },

    getCategories: async () => {
      return await apiCall(
        () =>
          $fetch(`${baseURL}/resources/categories`, {
            headers: getAuthHeaders(),
          }),
        "getCategories"
      );
    },

    create: async (data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/resources`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: data,
          }),
        "createResource"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    update: async (id: number, data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/resources/${id}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "updateResource"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    delete: async (id: number) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/resources/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteResource"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    createCategory: async (data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/resources/categories`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: data,
          }),
        "createCategory"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },
  };

  // 3. Services
  const services = {
    getAll: async () => {
      return await apiCall(
        () => $fetch(`${baseURL}/services`, { headers: getAuthHeaders() }),
        "getServices"
      );
    },

    create: async (data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/services`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: data,
          }),
        "createService"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    update: async (id: number, data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/services/${id}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "updateService"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    delete: async (id: number) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/services/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteService"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    attachToResource: async (resourceId: number, serviceId: number) => {
      return await apiCall(
        () =>
          $fetch(`${baseURL}/services/attach`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: { resourceId, serviceId },
          }),
        "attachService"
      );
    },

    detach: async (resourceId: number, serviceId: number) => {
      return await apiCall(
        () =>
          $fetch(`${baseURL}/resources/${resourceId}/services/${serviceId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "detachService"
      );
    },

    updateResourceServices: async (
      resourceId: number,
      serviceIds: number[]
    ) => {
      return await apiCall(
        () =>
          $fetch(`${baseURL}/resources/${resourceId}/services`, {
            method: "PATCH", // Backend Route müsste das unterstützen!
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: { service_ids: serviceIds },
          }),
        "updateResourceServices"
      );
    },
  };

  // 4. Pricing
  const pricing = {
    getAll: async (resourceId?: number) => {
      const query = resourceId ? `?resource_id=${resourceId}` : "";
      return await apiCall(
        () =>
          $fetch(`${baseURL}/pricing${query}`, { headers: getAuthHeaders() }),
        "getPricing"
      );
    },

    create: async (data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/pricing`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: data,
          }),
        "createPricing"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    update: async (id: number, data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/pricing/${id}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "updatePricing"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    delete: async (id: number) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/pricing/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deletePricing"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },
  };

  // 5. Memberships
  const memberships = {
    getTypes: async () => {
      return await apiCall(
        () =>
          $fetch(`${baseURL}/memberships/types`, { headers: getAuthHeaders() }),
        "getMembershipTypes"
      );
    },

    getMy: async () => {
      return await apiCall(
        () =>
          $fetch(`${baseURL}/memberships/my`, { headers: getAuthHeaders() }),
        "getMyMembership"
      );
    },

    createType: async (data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/memberships/types`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: data,
          }),
        "createMembershipType"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    updateType: async (id: number, data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/memberships/types/${id}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "mem.updateType"
      );
      if (res)
        toast.add({ title: "Mitgliedschaft aktualisiert", color: "green" });
      return res;
    },

    deleteType: async (id: number) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/memberships/types/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "mem.deleteType"
      );
      if (res) toast.add({ title: "Mitgliedschaft gelöscht", color: "green" });
      return res;
    },

    createRule: async (data: any) => {
      return await apiCall(
        () =>
          $fetch(`${baseURL}/memberships/rules`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: data,
          }),
        "createMembershipRule"
      );
    },

    deleteRule: async (id: number) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/memberships/rules/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "mem.deleteRule"
      );
      if (res) toast.add({ title: "Regel entfernt", color: "green" });
      return res;
    },

    assign: async (data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/memberships/assign`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: data,
          }),
        "assignMembership"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    removeAssignment: async (id: number) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/memberships/assign/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "removeMembershipAssignment"
      );
      if (result)
        toast.add({ title: "Mitgliedschaft entfernt", color: "green" });
      return result;
    },
  };

  // 6. Bookings
  const bookings = {
    getAll: async (start?: string, end?: string, resourceId?: number) => {
      const params = new URLSearchParams();
      if (start) params.append("start", start);
      if (end) params.append("end", end);
      if (resourceId) params.append("resource_id", resourceId.toString());

      const data = await apiCall(
        () =>
          $fetch(`${baseURL}/bookings?${params.toString()}`, {
            headers: getAuthHeaders(),
          }),
        "getBookings"
      );

      // Flatten data for frontend
      if (Array.isArray(data)) {
        return data.map((booking: any) => ({
          ...booking,
          user_name: booking.User?.username || "Unbekannt",
          resource_name: booking.Resource?.name || "Unbekannt",
        }));
      }

      return [];
    },

    checkAvailability: async (
      resourceId: number,
      start: string,
      end: string
    ) => {
      return await apiCall(
        () =>
          $fetch(
            `${baseURL}/bookings/availabilities?resource_id=${resourceId}&start=${start}&end=${end}`,
            {
              headers: getAuthHeaders(),
            }
          ),
        "checkAvailability"
      );
    },

    getPrice: async (
      resourceId: number,
      pricingPlanId: number,
      start: string,
      end: string
    ) => {
      return await apiCall(
        () =>
          $fetch(
            `${baseURL}/bookings/price?resource_id=${resourceId}&pricing_plan_id=${pricingPlanId}&start=${start}&end=${end}`,
            {
              headers: getAuthHeaders(),
            }
          ),
        "getBookingPrice"
      );
    },

    create: async (data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/bookings/createBooking`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: data,
          }),
        "createBooking"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    delete: async (id: number) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/bookings/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteBooking"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    update: async (id: number, data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/bookings/${id}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "updateBooking"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },

    cancel: async (id: number, data: any) => {
      const result = await apiCall(
        () =>
          $fetch(`${baseURL}/bookings/cancel/${id}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
          }),
        "cancelBooking"
      );
      if (result)
        toast.add({ title: "Erfolg", description: "", color: "green" });
      return result;
    },
  };

  /**
   * SALES / INVOICES
   */
  const sales = {
    // Rechnungen laden (Optional gefiltert nach User)
    getAll: async (userId?: number | string) => {
      const query = userId ? `?user_id=${userId}` : "";
      return await apiCall(
        () =>
          $fetch(`${baseURL}/sales/invoices${query}`, {
            headers: getAuthHeaders(),
          }),
        "sales.getAll"
      );
    },

    getOne: async (id: number | string) => {
      return await apiCall(
        () =>
          $fetch(`${baseURL}/sales/invoices/${id}`, {
            headers: getAuthHeaders(),
          }),
        "sales.getOne"
      );
    },

    // Manuelle Rechnung erstellen
    create: async (data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/sales/invoices`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: data,
          }),
        "sales.create"
      );
      if (res) toast.add({ title: "Rechnung erstellt", color: "green" });
      return res;
    },

    // Rechnung bearbeiten (Status / Notiz)
    update: async (id: number, data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/sales/invoices/${id}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "sales.update"
      );
      if (res) toast.add({ title: "Rechnung aktualisiert", color: "green" });
      return res;
    },

    // Rechnung löschen (nur Draft)
    delete: async (id: number) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/sales/invoices/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "sales.delete"
      );
      if (res) toast.add({ title: "Rechnung gelöscht", color: "green" });
      return res;
    },

    // Email senden
    sendEmail: async (id: number) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/sales/invoices/${id}/send`, {
            method: "POST",
            headers: getAuthHeaders(),
          }),
        "sales.sendEmail"
      );
      if (res) toast.add({ title: "Email versendet", color: "green" });
      return res;
    },

    // PDF Download (Spezialfall: Return Blob)
    downloadInvoice: async (id: number | string) => {
      try {
        const response = await fetch(
          `${baseURL}/sales/invoices/${id}/download`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );

        if (!response.ok) throw new Error("Download fehlgeschlagen");
        return await response.blob();
      } catch (error) {
        handleError(error, "sales.downloadInvoice");
        throw error;
      }
    },
  };

  /**
   * COMPANY SETTINGS
   */
  const company = {
    get: async () => {
      return await apiCall(
        () =>
          $fetch(`${baseURL}/settings/company`, { headers: getAuthHeaders() }),
        "company.get"
      );
    },

    update: async (data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/settings/company`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data, // Achtung: Prüfen ob Body direkt data ist oder { form: data }
          }),
        "company.update"
      );
      if (res)
        toast.add({ title: "Einstellungen gespeichert", color: "green" });
      return res;
    },
  };

  const templates = {
    getAll: async () => {
      return await apiCall(
        () => $fetch(`${baseURL}/templates`, { headers: getAuthHeaders() }),
        "template.get"
      );
    },

    update: async (id, data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/templates/${id}`, {
            method: "PATCH",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data, // Achtung: Prüfen ob Body direkt data ist oder { form: data }
          }),
        "template.update"
      );
      if (res)
        toast.add({ title: "Einstellungen gespeichert", color: "green" });
      return res;
    },
  };

  return {
    users,
    resources,
    services,
    pricing,
    memberships,
    bookings,
    sales,
    company,
    templates,
  };
};
