import {
  getAuthHeaders,
  handleApiError,
  apiCall as runApiCall,
} from "~/utils/apiClientHelpers";

export type CapabilitySchema = {
  key: string;
  type: string;
  access: string;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  enumValues?: string[];
  enumLabels?: Record<string, string>;
};

export function normalizeHeatingLastState(
  value: unknown,
): Record<string, unknown> {
  let current: unknown = value;
  for (let i = 0; i < 3 && typeof current === "string"; i += 1) {
    const trimmed = current.trim();
    if (!trimmed || trimmed === "null") return {};
    try {
      current = JSON.parse(trimmed);
    } catch {
      return {};
    }
  }
  if (current && typeof current === "object" && !Array.isArray(current)) {
    return current as Record<string, unknown>;
  }
  return {};
}

export function normalizeHeatingSchema(value: unknown): CapabilitySchema[] {
  let current: unknown = value;
  for (let i = 0; i < 3 && typeof current === "string"; i += 1) {
    const trimmed = current.trim();
    if (!trimmed) return [];
    try {
      current = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(current)) return [];
  return current.filter(
    (item): item is CapabilitySchema =>
      !!item && typeof item === "object" && "key" in item,
  );
}

export type HeatingEntity = {
  id: number;
  name: string;
  room_id: number | null;
  device_model_id: number;
  mqtt_identifier: string;
  mqtt_topic_prefix?: string | null;
  last_state: Record<string, unknown>;
  last_seen_at?: string | null;
  manual_override?: {
    capabilityKey: string;
    value: unknown;
    setAt: string;
  } | null;
  offline?: boolean;
  battery?: number | null;
  eco_temperature?: number;
  entity_number?: string | null;
  notes?: string | null;
  supports_native_schedule?: boolean;
  schema: CapabilitySchema[];
  deviceModel?: {
    id: number;
    manufacturer: string;
    model: string;
    protocol: string;
    adapter_key: string;
  } | null;
  room?: any;
  next_schedule?: {
    at: string;
    target_temperature: number;
    weekday: number;
    time: string;
  } | null;
};

export const useHeatingApi = () => {
  const baseURL = import.meta.env.VITE_INTERNAL_API_URL || "/api";
  const router = useRouter();
  const toast = useToast();

  const handleError = (error: any, context: string) => {
    handleApiError(error, context, toast, router);
  };

  const apiCall = async <T>(
    fn: () => Promise<T>,
    context: string,
  ): Promise<T | null> => {
    return runApiCall(fn, context, toast, router);
  };

  const jsonHeaders = () => ({
    ...getAuthHeaders(),
    "Content-Type": "application/json",
  });

  return {
    getHierarchy: async () => {
      const res = await apiCall(
        () => $fetch(`${baseURL}/heating/hierarchy`, { headers: getAuthHeaders() }),
        "getHierarchy",
      );
      return res?.data || [];
    },

    getDeviceModels: async () => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/device-models`, {
            headers: getAuthHeaders(),
          }),
        "getDeviceModels",
      );
      return res?.data || [];
    },

    createBuilding: (data: {
      name: string;
      number?: string;
      address?: string;
      notes?: string;
    }) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/buildings`, {
            method: "POST",
            headers: jsonHeaders(),
            body: data,
          }),
        "createBuilding",
      ),

    updateBuilding: (id: number, data: Record<string, unknown>) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/buildings/${id}`, {
            method: "PATCH",
            headers: jsonHeaders(),
            body: data,
          }),
        "updateBuilding",
      ),

    deleteBuilding: (id: number) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/buildings/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteBuilding",
      ),

    createUnit: (data: {
      building_id: number;
      name: string;
      unit_number?: string;
      notes?: string;
    }) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/units`, {
            method: "POST",
            headers: jsonHeaders(),
            body: data,
          }),
        "createUnit",
      ),

    updateUnit: (id: number, data: Record<string, unknown>) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/units/${id}`, {
            method: "PATCH",
            headers: jsonHeaders(),
            body: data,
          }),
        "updateUnit",
      ),

    deleteUnit: (id: number) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/units/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteUnit",
      ),

    createRoom: (data: {
      building_id?: number;
      unit_id?: number;
      name?: string;
      room_number?: string;
      notes?: string;
    }) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/rooms`, {
            method: "POST",
            headers: jsonHeaders(),
            body: data,
          }),
        "createRoom",
      ),

    updateRoom: (id: number, data: Record<string, unknown>) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/rooms/${id}`, {
            method: "PATCH",
            headers: jsonHeaders(),
            body: data,
          }),
        "updateRoom",
      ),

    getRoom: async (id: number) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/rooms/${id}`, {
            headers: getAuthHeaders(),
          }),
        "getRoom",
      );
      return res?.data || null;
    },

    deleteRoom: (id: number) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/rooms/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteRoom",
      ),

    setRoomCapability: (id: number, key: string, value: unknown) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/rooms/${id}/capabilities/${key}`, {
            method: "POST",
            headers: jsonHeaders(),
            body: { value },
          }),
        "setRoomCapability",
      ),

    getEntities: async (): Promise<HeatingEntity[]> => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities`, {
            headers: getAuthHeaders(),
          }),
        "getEntities",
      );
      return res?.data || [];
    },

    getEntity: async (id: number): Promise<HeatingEntity | null> => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities/${id}`, {
            headers: getAuthHeaders(),
          }),
        "getEntity",
      );
      return res?.data || null;
    },

    createEntity: (data: Record<string, unknown>) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities`, {
            method: "POST",
            headers: jsonHeaders(),
            body: data,
          }),
        "createEntity",
      ),

    updateEntity: (id: number, data: Record<string, unknown>) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities/${id}`, {
            method: "PATCH",
            headers: jsonHeaders(),
            body: data,
          }),
        "updateEntity",
      ),

    deleteEntity: (id: number) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteEntity",
      ),

    setCapability: (id: number, key: string, value: unknown) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities/${id}/capabilities/${key}`, {
            method: "PATCH",
            headers: jsonHeaders(),
            body: { value },
          }),
        "setCapability",
      ),

    getLog: async (id: number) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities/${id}/log`, {
            headers: getAuthHeaders(),
          }),
        "getLog",
      );
      return res?.data || [];
    },

    getHistory: async (
      id: number,
      query: { hours?: number; from?: string; to?: string } = {},
    ) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities/${id}/history`, {
            headers: getAuthHeaders(),
            query,
          }),
        "getHistory",
      );
      return (
        res?.data || {
          from: null,
          to: null,
          series: {
            current_temperature: [],
            target_temperature: [],
            window_open: [],
          },
        }
      );
    },

    getRoomHistory: async (
      id: number,
      query: { hours?: number; from?: string; to?: string } = {},
    ) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/rooms/${id}/history`, {
            headers: getAuthHeaders(),
            query,
          }),
        "getRoomHistory",
      );
      return (
        res?.data || {
          from: null,
          to: null,
          series: {
            current_temperature: [],
            target_temperature: [],
            window_open: [],
          },
        }
      );
    },

    assignEntitiesToRoom: (
      id: number,
      entityIds: number[],
      options: { replace?: boolean } = {},
    ) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/rooms/${id}/entities`, {
            method: "POST",
            headers: jsonHeaders(),
            body: {
              entity_ids: entityIds,
              replace: !!options.replace,
            },
          }),
        "assignEntitiesToRoom",
      ),

    getSchedules: async (query: { entity_id?: number; room_id?: number } = {}) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/schedules`, {
            headers: getAuthHeaders(),
            query,
          }),
        "getSchedules",
      );
      return res?.data || [];
    },

    createSchedule: (data: Record<string, unknown>) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/schedules`, {
            method: "POST",
            headers: jsonHeaders(),
            body: data,
          }),
        "createSchedule",
      ),

    deleteSchedule: (id: number) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/schedules/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteSchedule",
      ),

    replaceEntitySchedule: (
      id: number,
      data: {
        eco_temperature: number;
        intervals: {
          weekday: number;
          start: string;
          end: string;
          target_temperature: number;
        }[];
      },
    ) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities/${id}/schedule`, {
            method: "PUT",
            headers: jsonHeaders(),
            body: data,
          }),
        "replaceEntitySchedule",
      ),

    replaceRoomSchedule: (
      id: number,
      data: {
        eco_temperature?: number;
        intervals: {
          weekday: number;
          start: string;
          end: string;
          target_temperature: number;
        }[];
      },
    ) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/rooms/${id}/schedule`, {
            method: "PUT",
            headers: jsonHeaders(),
            body: data,
          }),
        "replaceRoomSchedule",
      ),

    getDiscovery: async () => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/discovery`, {
            headers: getAuthHeaders(),
          }),
        "getDiscovery",
      );
      return {
        devices: res?.data || [],
        mqtt_connected: !!res?.mqtt_connected,
        zigbee: res?.zigbee || { permit_join: false, remaining_seconds: null },
      };
    },

    refreshDiscovery: async () => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/discovery/refresh`, {
            method: "POST",
            headers: jsonHeaders(),
          }),
        "refreshDiscovery",
      );
      return {
        devices: res?.data || [],
        mqtt_connected: !!res?.mqtt_connected,
        zigbee: res?.zigbee || { permit_join: false, remaining_seconds: null },
      };
    },

    setPermitJoin: (time: number) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/zigbee/permit-join`, {
            method: "POST",
            headers: jsonHeaders(),
            body: { time },
          }),
        "setPermitJoin",
      ),

    bulkCreateEntities: (data: {
      room_id?: number | null;
      devices: Record<string, unknown>[];
    }) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/entities/bulk`, {
            method: "POST",
            headers: jsonHeaders(),
            body: data,
          }),
        "bulkCreateEntities",
      ),

    getAdminOverview: async () => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/admin/overview`, {
            headers: getAuthHeaders(),
          }),
        "getAdminOverview",
      );
      return { entities: res?.data || [], mqtt_connected: !!res?.mqtt_connected };
    },

    getGrants: async (query: Record<string, unknown> = {}) => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/grants`, {
            headers: getAuthHeaders(),
            query,
          }),
        "getGrants",
      );
      return res?.data || [];
    },

    createGrant: (data: {
      user_id: number;
      scope_type: string;
      scope_id: number;
    }) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/grants`, {
            method: "POST",
            headers: jsonHeaders(),
            body: data,
          }),
        "createGrant",
      ),

    deleteGrant: (id: number) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/grants/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          }),
        "deleteGrant",
      ),

    getTenants: async () => {
      const res = await apiCall(
        () =>
          $fetch(`${baseURL}/heating/tenants`, { headers: getAuthHeaders() }),
        "getTenants",
      );
      return res?.data || [];
    },

    createTenant: (data: {
      name: string;
      email: string;
      grants?: { scope_type: string; scope_id: number }[];
    }) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/tenants`, {
            method: "POST",
            headers: jsonHeaders(),
            body: data,
          }),
        "createTenant",
      ),

    updateTenant: (id: number, data: { isActive?: boolean }) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/tenants/${id}`, {
            method: "PATCH",
            headers: jsonHeaders(),
            body: data,
          }),
        "updateTenant",
      ),

    inviteTenant: (id: number) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/tenants/${id}/invite`, {
            method: "POST",
            headers: getAuthHeaders(),
          }),
        "inviteTenant",
      ),

    replaceTenantGrants: (
      id: number,
      grants: { scope_type: string; scope_id: number }[],
    ) =>
      apiCall(
        () =>
          $fetch(`${baseURL}/heating/tenants/${id}/grants`, {
            method: "PUT",
            headers: jsonHeaders(),
            body: { grants },
          }),
        "replaceTenantGrants",
      ),

    handleError,
  };
};
