import {
  normalizeHeatingLastState,
  normalizeHeatingSchema,
  type CapabilitySchema,
  type HeatingEntity,
} from "~/composables/useHeatingApi";

export function roomsOfBuilding(building: any): any[] {
  if (Array.isArray(building?.rooms)) return building.rooms;
  return (building?.units || []).flatMap((unit: any) => unit.rooms || []);
}

export function unitsOfBuilding(building: any): any[] {
  const units = building?.units || [];
  const sortedUnits = units.sort((a, b) => {
    return a.unit_number - b.unit_number;
  });
  return sortedUnits;
}

export function unitOfRoom(building: any, room: any): any | null {
  if (room?.unit) return room.unit;
  return (
    (building?.units || []).find((unit: any) =>
      (unit.rooms || []).some((r: any) => r.id === room?.id),
    ) || null
  );
}

export function roomsOfUnit(unit: any): any[] {
  return unit?.rooms || [];
}

export function unitLabel(unit: any): string {
  if (!unit) return "";
  if (unit.unit_number && unit.name) {
    return `${unit.unit_number} · ${unit.name}`;
  }
  return unit.unit_number || unit.name || "";
}

function isLegacyDefaultName(value: unknown) {
  const name = String(value || "")
    .trim()
    .toLowerCase();
  return name === "standard" || name === "unzugeordnet";
}

export function isLegacyDefaultBuilding(building: any) {
  if (!building) return false;
  if (String(building.number || "").trim()) return false;
  return isLegacyDefaultName(building.name);
}

export function isLegacyDefaultRoom(room: any) {
  if (!room) return false;
  if (String(room.room_number || "").trim()) return false;
  return isLegacyDefaultName(room.name);
}

export function visibleRoomsOfBuilding(building: any): any[] {
  return roomsOfBuilding(building).filter((room) => !isLegacyDefaultRoom(room));
}

export function entityIsUnassigned(
  entity: Pick<HeatingEntity, "room_id" | "room">,
) {
  if (!entity?.room_id) return true;
  return isLegacyDefaultRoom(entity.room);
}

export function buildingLabel(building: any): string {
  if (!building) return "";
  if (building.number && building.name) {
    return `${building.number} · ${building.name}`;
  }
  return building.number || building.name || "";
}

export function roomLabel(room: any): string {
  if (!room) return "";
  if (room.room_number && room.name) {
    return room.room_number + " · " + room.name;
  } else if (room.room_number) {
    return room.room_number;
  } else {
    return "";
  }
}

export function roomWithUnitLabel(building: any, room: any): string {
  return [unitLabel(unitOfRoom(building, room)), roomLabel(room)]
    .filter(Boolean)
    .join(" / ");
}

const compareNatural = (a: unknown, b: unknown) =>
  String(a ?? "").localeCompare(String(b ?? ""), "de", {
    numeric: true,
    sensitivity: "base",
  });

// Sortiert nach Einheitsnummer, dann nach Raumnummer (bzw. Name als Fallback)
export function sortRoomsByUnit(building: any, rooms: any[]): any[] {
  return [...rooms].sort((a, b) => {
    const unitA = unitOfRoom(building, a);
    const unitB = unitOfRoom(building, b);
    return (
      compareNatural(unitA?.unit_number || unitA?.name, unitB?.unit_number || unitB?.name) ||
      compareNatural(a.room_number || a.name, b.room_number || b.name)
    );
  });
}

export function locationLabel(building: any, room: any): string {
  return [buildingLabel(building), roomLabel(room)].filter(Boolean).join(" / ");
}

export function entityLocationLabel(entity: Pick<HeatingEntity, "room">) {
  const room = entity.room;
  if (!room || isLegacyDefaultRoom(room)) return "";
  const building = room.unit?.building || room.building;
  if (isLegacyDefaultBuilding(building)) return "";
  return locationLabel(building, room);
}

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isHeating(state: Record<string, unknown>): boolean {
  const mode = String(state.system_mode || "");
  if (mode === "off") return false;
  const running = String(state.running_state || "").toLowerCase();
  if (running === "heat" || running === "heating") return true;
  const valve = asNumber(state.valve_position);
  if (valve != null && valve > 5) return true;
  const current = asNumber(state.current_temperature);
  const target = asNumber(state.target_temperature);
  if (current != null && target != null && current < target - 0.3) return true;
  return false;
}

const WRITEABLE = new Set(["readwrite", "write"]);

export function intersectWritableSchema(
  entities: Array<
    Pick<HeatingEntity, "schema"> & {
      deviceModel?: { capability_schema?: unknown };
    }
  >,
): CapabilitySchema[] {
  const list = entities || [];
  if (!list.length) return [];
  const schemas = list.map((entity) =>
    normalizeHeatingSchema(
      entity.schema?.length
        ? entity.schema
        : entity.deviceModel?.capability_schema,
    ),
  );
  const writableSets = schemas.map(
    (schema) =>
      new Set(
        schema.filter((cap) => WRITEABLE.has(cap.access)).map((cap) => cap.key),
      ),
  );
  let common = [...writableSets[0]];
  for (const set of writableSets.slice(1)) {
    common = common.filter((key) => set.has(key));
  }
  const anyTarget = schemas.some((schema) =>
    schema.some(
      (cap) => cap.key === "target_temperature" && WRITEABLE.has(cap.access),
    ),
  );
  if (anyTarget && !common.includes("target_temperature")) {
    common.unshift("target_temperature");
  }

  return common
    .map((key) => {
      const caps = schemas
        .map((schema) => schema.find((cap) => cap.key === key))
        .filter((cap): cap is CapabilitySchema => !!cap);
      if (!caps.length) return null;
      const base: CapabilitySchema = { ...caps[0] };
      if (base.type === "number" || base.type === "percent") {
        const mins = caps
          .map((cap) => cap.min)
          .filter((n): n is number => n != null);
        const maxs = caps
          .map((cap) => cap.max)
          .filter((n): n is number => n != null);
        const steps = caps
          .map((cap) => cap.step)
          .filter((n): n is number => n != null);
        if (mins.length) base.min = Math.max(...mins);
        if (maxs.length) base.max = Math.min(...maxs);
        if (steps.length) base.step = Math.max(...steps);
      }
      if (base.type === "enum") {
        let values = caps[0].enumValues || [];
        for (const cap of caps.slice(1)) {
          const allowed = new Set(cap.enumValues || []);
          values = values.filter((value) => allowed.has(value));
        }
        base.enumValues = values;
        if (!values.length) return null;
      }
      return base;
    })
    .filter((cap): cap is CapabilitySchema => !!cap);
}

export function aggregateRoomState(entities: HeatingEntity[]) {
  const list = entities || [];
  const currents: number[] = [];
  const targets: number[] = [];
  const batteries: number[] = [];
  const modes: string[] = [];
  let windowOpen = false;
  let heating = false;
  let offlineCount = 0;

  for (const entity of list) {
    const state = normalizeHeatingLastState(entity.last_state);
    const current = asNumber(state.current_temperature);
    const target = asNumber(state.target_temperature);
    const battery = asNumber(state.battery ?? entity.battery);
    if (current != null) currents.push(current);
    if (target != null) targets.push(target);
    if (battery != null) batteries.push(battery);
    if (state.system_mode) modes.push(String(state.system_mode));
    if (state.window_open) windowOpen = true;
    if (isHeating(state)) heating = true;
    if (entity.offline) offlineCount += 1;
  }

  const mixedTarget =
    targets.length >= 2 &&
    targets.some((value) => Math.abs(value - targets[0]) >= 0.05);
  const avg = (values: number[]) =>
    values.length
      ? Math.round(
          (values.reduce((sum, n) => sum + n, 0) / values.length) * 10,
        ) / 10
      : null;
  const sameMode = modes.length > 0 && modes.every((mode) => mode === modes[0]);

  return {
    lastState: {
      current_temperature: avg(currents),
      target_temperature: avg(targets),
      window_open: windowOpen,
      battery: batteries.length ? Math.min(...batteries) : null,
      system_mode: sameMode ? modes[0] : "",
      running_state: heating ? "heat" : "",
    } as Record<string, unknown>,
    mixedTarget,
    offline: list.length > 0 && offlineCount === list.length,
    schema: intersectWritableSchema(list),
  };
}

export function entityBatteries(entities: HeatingEntity[]) {
  return (entities || []).map((entity) => {
    const state = normalizeHeatingLastState(entity.last_state);
    const n = Number(state.battery ?? entity.battery);
    return {
      label: entity.name,
      battery: Number.isFinite(n) ? n : null,
    };
  });
}
