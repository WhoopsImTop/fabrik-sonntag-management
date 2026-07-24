import {
  getAuthHeaders,
  handleApiError,
  apiCall as runApiCall,
} from "~/utils/apiClientHelpers";

export const useMeterApi = () => {
  const baseURL = import.meta.env.VITE_INTERNAL_API_URL || "/api";
  const router = useRouter();
  const toast = useToast();

  const meterErrorOptions = {
    toastColor: "error",
    statusMessages: {
      409: "Diese Meter ID existiert bereits.",
    },
  };

  const handleError = (error: any, context: string) => {
    handleApiError(error, context, toast, router, meterErrorOptions);
  };

  const apiCall = async <T>(
    fn: () => Promise<T>,
    context: string,
  ): Promise<T | null> => {
    return runApiCall(fn, context, toast, router, meterErrorOptions);
  };

  return {
    getMeters: async () => {
      const res = await apiCall(
        () => $fetch(`${baseURL}/meters`, { headers: getAuthHeaders() }),
        "getMeters",
      );
      return res?.data || [];
    },

    getMeterGroups: async () => {
      const res = await apiCall(
        () => $fetch(`${baseURL}/meters/groups`, { headers: getAuthHeaders() }),
        "getMeterGroups",
      );
      return res?.data || [];
    },

    createMeterGroup: async (data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/groups`, {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "createMeterGroup",
      );
      if (res && res.success) {
        toast.add({ title: "Gruppe angelegt", color: "primary" });
      }
      return res;
    },

    updateMeterGroup: async (id: number, data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/groups/${id}`, {
            method: "PUT",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "updateMeterGroup",
      );
      if (res && res.success) {
        toast.add({ title: "Gruppe aktualisiert", color: "primary" });
      }
      return res;
    },

    deleteMeterGroup: async (id: number) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/groups/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteMeterGroup",
      );
      if (res && res.success) {
        toast.add({ title: "Gruppe gelöscht", color: "primary" });
      }
      return res;
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

    downloadCSV: async (meter_id: string) => {
      try {
        const response = await fetch(
          `${baseURL}/mbus/export/csv/${meter_id}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          },
        );

        if (!response.ok) {
          throw new Error("Download fehlgeschlagen");
        }

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${meter_id}_ablesung.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
      }
    },

    massImportMeters: async (metersArray: any[]) => {
      let successCount = 0;
      let errorCount = 0;

      for (const meter of metersArray) {
        try {
          const res = await $fetch(`${baseURL}/meters`, {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: meter,
          });
          if (res && (res as any).success) successCount++;
          else errorCount++;
        } catch (e) {
          console.error("Mass import failed for meter", meter, e);
          errorCount++;
        }
      }
      toast.add({
        title: "Import beendet",
        description: `${successCount} erfolgreich, ${errorCount} fehlerhaft`,
        color: errorCount === 0 ? "primary" : "neutral",
      });
      return { successCount, errorCount };
    },

    getAllReadings: async () => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/readings`, { headers: getAuthHeaders() }),
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
    },

    getCameraDevices: async () => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/camera-devices`, {
            headers: getAuthHeaders(),
          }),
        "getCameraDevices",
      );
      return res?.data || [];
    },

    createCameraDevice: async (data: any) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/meters/camera-devices`, {
            method: "POST",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: data,
          }),
        "createCameraDevice",
      );
      if (res && (res as any).success) {
        toast.add({ title: "Kamera-Gerät angelegt", color: "primary" });
      }
      return res;
    },

    updateCameraDevice: async (device_id: string, data: any) => {
      const res = await apiCall(
        () =>
          $fetch(
            `${baseURL}/meters/camera-devices/${encodeURIComponent(device_id)}`,
            {
              method: "PUT",
              headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json",
              },
              body: data,
            },
          ),
        "updateCameraDevice",
      );
      if (res && (res as any).success) {
        toast.add({ title: "Kamera-Gerät aktualisiert", color: "primary" });
      }
      return res;
    },

    deleteCameraDevice: async (device_id: string) => {
      const res = await apiCall(
        () =>
          $fetch(
            `${baseURL}/meters/camera-devices/${encodeURIComponent(device_id)}`,
            {
              method: "DELETE",
              headers: getAuthHeaders(),
            },
          ),
        "deleteCameraDevice",
      );
      if (res && (res as any).success) {
        toast.add({ title: "Kamera-Gerät gelöscht", color: "primary" });
      }
      return res;
    },

    getDeviceStatuses: async () => {
      try {
        const res = await $fetch(`${baseURL}/devices`, {
          headers: getAuthHeaders(),
        });
        return (res as Record<string, any>) || {};
      } catch (error) {
        console.error("Error in getDeviceStatuses:", error);
        return {};
      }
    },
  };
};
