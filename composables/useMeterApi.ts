export const useMeterApi = () => {
  const baseURL = import.meta.env.VITE_INTERNAL_API_URL || "/api";
  const router = useRouter();
  const toast = useToast();

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("jwt");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleError = (error: any, context: string) => {
    console.error(`Error in ${context}:`, error);

    if (error.status === 401 || error.statusCode === 401) {
      localStorage.removeItem("jwt");
      toast.add({
        title: "Sitzung abgelaufen",
        description: "Bitte melden Sie sich erneut an.",
        color: "error",
      });
      router.push("/login");
      return;
    }

    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      let message = `Ein Fehler ist aufgetreten (${status}).`;
      if (status === 409) message = 'Diese Meter ID existiert bereits.';
      
      toast.add({ title: "Fehler", description: message, color: "error" });
      return;
    }

    toast.add({
      title: "Fehler",
      description: "Ein unerwarteter Fehler ist aufgetreten.",
      color: "error",
    });
  };

  const apiCall = async <T>(
    fn: () => Promise<T>,
    context: string,
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };

  return {
    getMeters: async () => {
      const res = await apiCall(
        () => $fetch(`${baseURL}/meters`, { headers: getAuthHeaders() }),
        "getMeters",
      );
      return res?.data || [];
    },

    createMeter: async (data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters`, {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "createMeter",
      );
      if (res && res.success) {
        toast.add({ title: "Zähler angelegt", color: "primary" });
      }
      return res;
    },

    updateMeter: async (meter_id: string, data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/${meter_id}`, {
            method: "PUT",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "updateMeter",
      );
      if (res && res.success) {
        toast.add({ title: "Zähler aktualisiert", color: "primary" });
      }
      return res;
    },

    deleteMeter: async (meter_id: string) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/${meter_id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteMeter",
      );
      if (res && res.success) {
        toast.add({ title: "Zähler gelöscht", color: "primary" });
      }
      return res;
    },
    
    massImportMeters: async (metersArray: any[]) => {
      let successCount = 0;
      let errorCount = 0;
      
      for(const meter of metersArray) {
          try {
              const res = await $fetch(`${baseURL}/meters`, {
                  method: "POST",
                  headers: {
                      ...getAuthHeaders(),
                      "Content-Type": "application/json",
                  },
                  body: meter,
              });
              if(res && (res as any).success) successCount++;
              else errorCount++;
          } catch(e) {
              console.error("Mass import failed for meter", meter, e);
              errorCount++;
          }
      }
      toast.add({ title: "Import beendet", description: `${successCount} erfolgreich, ${errorCount} fehlerhaft`, color: errorCount === 0 ? "primary" : "neutral" });
      return { successCount, errorCount };
    },

    getAllReadings: async () => {
      const res = await apiCall(
        () => $fetch(`${baseURL}/meters/readings`, { headers: getAuthHeaders() }),
        "getAllReadings",
      );
      return res?.data || [];
    },

    deleteReading: async (id: number) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/readings/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteReading",
      );
      if (res && (res as any).success) {
        toast.add({ title: "Zählerstand gelöscht", color: "primary" });
      }
      return res;
    },

    deleteAllReadings: async () => {
       const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/readings`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteAllReadings",
      );
      if (res && (res as any).success) {
        toast.add({ title: "Alle Zählerstände gelöscht", color: "primary" });
      }
      return res;
    }
  };
};
