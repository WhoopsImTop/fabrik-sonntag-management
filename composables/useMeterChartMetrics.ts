export type MeterChartPoint = {
  index: number;
  timestamp: string;
  pointDate: Date;
  monthLabel: string;
  label: string;
  value: number;
  formatted: string;
};

export type MeterChartSeries = {
  id: "energy" | "volume";
  kategorie: string;
  einheit: string;
  totalKeys: string[];
  targetKeys: string[];
  historicalSuffix: "_kwh" | "_m3";
};

const ENERGY_SERIES: MeterChartSeries = {
  id: "energy",
  kategorie: "Energie",
  einheit: "kWh",
  totalKeys: [
    "total_kwh",
    "total_energy_kwh",
    "total_energy_consumption_kwh",
    "energy_kwh",
  ],
  targetKeys: ["target_kwh", "target_energy_kwh"],
  historicalSuffix: "_kwh",
};

const VOLUME_SERIES: MeterChartSeries = {
  id: "volume",
  kategorie: "Volumen",
  einheit: "m³",
  totalKeys: ["total_m3", "total_volume_m3", "total_water_m3", "volume_m3"],
  targetKeys: ["target_m3", "target_volume_m3"],
  historicalSuffix: "_m3",
};

const getNumericValue = (input: unknown): number | null => {
  const parsed = Number.parseFloat(String(input));
  return Number.isFinite(parsed) ? parsed : null;
};

const isPlausibleChartValue = (value: number) =>
  Number.isFinite(value) && value >= 0 && value <= 10_000_000;

const hasSeriesData = (
  parsed: Record<string, unknown>,
  series: MeterChartSeries,
): boolean => {
  if (series.totalKeys.some((key) => getNumericValue(parsed[key]) !== null)) {
    return true;
  }
  if (series.targetKeys.some((key) => getNumericValue(parsed[key]) !== null)) {
    return true;
  }
  const historicalPattern = new RegExp(
    `^target_\\d+${series.historicalSuffix}$`,
  );
  return Object.keys(parsed).some((key) => historicalPattern.test(key));
};

const mediaPrefersVolume = (media: unknown): boolean => {
  const value = String(media || "").toLowerCase();
  return (
    value.includes("water") ||
    value.includes("gas") ||
    value.includes("wasser") ||
    value === "cold water" ||
    value === "hot water" ||
    value === "warm water"
  );
};

const mediaPrefersEnergy = (media: unknown): boolean => {
  const value = String(media || "").toLowerCase();
  return (
    value.includes("heat") ||
    value.includes("cooling") ||
    value.includes("energy") ||
    value.includes("waerme") ||
    value.includes("wärme")
  );
};

export const resolveMeterChartSeries = (
  parsed: Record<string, unknown> | null | undefined,
  reading?: { value_kwh?: unknown; value_m3?: unknown; meter_type?: string },
): MeterChartSeries | null => {
  const data = parsed || {};
  const hasEnergy = hasSeriesData(data, ENERGY_SERIES);
  const hasVolume = hasSeriesData(data, VOLUME_SERIES);
  const media = data.media || data.meter || reading?.meter_type;

  if (hasEnergy && hasVolume) {
    if (mediaPrefersVolume(media)) return VOLUME_SERIES;
    if (mediaPrefersEnergy(media)) return ENERGY_SERIES;
    return ENERGY_SERIES;
  }
  if (hasEnergy) return ENERGY_SERIES;
  if (hasVolume) return VOLUME_SERIES;

  if (reading?.value_kwh != null) return ENERGY_SERIES;
  if (reading?.value_m3 != null) return VOLUME_SERIES;

  return null;
};

const parseBasisDate = (
  parsed: Record<string, unknown>,
  reading: { timestamp?: string; createdAt?: string },
): Date => {
  const meterDatetime = parsed.meter_datetime;
  if (typeof meterDatetime === "string" && meterDatetime.trim()) {
    const normalized = meterDatetime.includes("T")
      ? meterDatetime
      : meterDatetime.replace(" ", "T");
    const parsedDate = new Date(normalized);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
  }

  const fallback = new Date(reading.timestamp || reading.createdAt || "");
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
};

const monthEndBefore = (basisDate: Date, monthsBack: number): Date => {
  const date = new Date(basisDate);
  date.setDate(1);
  date.setMonth(date.getMonth() - monthsBack);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const formatChartPoint = (
  pointDate: Date,
  value: number,
  index: number,
  timestamp: string,
): MeterChartPoint => ({
  index,
  timestamp,
  pointDate,
  monthLabel: pointDate.toLocaleDateString("de-DE", {
    month: "short",
    year: "2-digit",
  }),
  label: pointDate.toLocaleDateString("de-DE"),
  value,
  formatted: value.toFixed(3),
});

const dedupePointsByMonth = (points: MeterChartPoint[]): MeterChartPoint[] => {
  const byMonth = new Map<string, MeterChartPoint>();
  points.forEach((point) => {
    const key = `${point.pointDate.getFullYear()}-${point.pointDate.getMonth()}`;
    const existing = byMonth.get(key);
    if (!existing || point.index > existing.index) {
      byMonth.set(key, point);
    }
  });
  return [...byMonth.values()].sort(
    (a, b) => a.pointDate.getTime() - b.pointDate.getTime(),
  );
};

const pickFirstValue = (
  parsed: Record<string, unknown>,
  keys: string[],
): number | null => {
  for (const key of keys) {
    const value = getNumericValue(parsed[key]);
    if (value !== null && isPlausibleChartValue(value)) return value;
  }
  return null;
};

export const extractHistoricalPointsFromParsed = (
  reading: {
    parsed_json?: Record<string, unknown> | null;
    timestamp?: string;
    createdAt?: string;
    value_kwh?: unknown;
    value_m3?: unknown;
    meter_type?: string;
  },
): { points: MeterChartPoint[]; series: MeterChartSeries | null } => {
  const parsed = reading.parsed_json;
  if (!parsed || typeof parsed !== "object") {
    return { points: [], series: null };
  }

  const series = resolveMeterChartSeries(parsed, reading);
  if (!series) return { points: [], series: null };

  const basisDate = parseBasisDate(parsed, reading);
  const basisTimestamp = reading.timestamp || reading.createdAt || "";
  const points: MeterChartPoint[] = [];

  const totalValue = pickFirstValue(parsed, series.totalKeys);
  if (totalValue !== null) {
    points.push(formatChartPoint(basisDate, totalValue, 0, basisTimestamp));
  }

  if (parsed.target_date) {
    const targetDate = new Date(String(parsed.target_date));
    const targetValue = pickFirstValue(parsed, series.targetKeys);
    if (
      !Number.isNaN(targetDate.getTime()) &&
      targetValue !== null &&
      isPlausibleChartValue(targetValue)
    ) {
      points.push(
        formatChartPoint(
          targetDate,
          targetValue,
          1,
          String(parsed.target_date),
        ),
      );
    }
  }

  const historicalPattern = new RegExp(
    `^target_(\\d+)${series.historicalSuffix}$`,
  );

  Object.entries(parsed).forEach(([key, rawValue]) => {
    const match = key.match(historicalPattern);
    if (!match) return;

    const storageNumber = Number.parseInt(match[1], 10);
    const value = getNumericValue(rawValue);
    if (value === null || !isPlausibleChartValue(value)) return;

    const monthsBack = Math.max(0, storageNumber / 2 - 1);
    const pointDate = monthEndBefore(basisDate, monthsBack);
    points.push(
      formatChartPoint(pointDate, value, storageNumber, basisTimestamp),
    );
  });

  return {
    points: dedupePointsByMonth(points),
    series,
  };
};

export const extractTimeSeriesPoints = (
  meterReadings: Array<{
    timestamp?: string;
    createdAt?: string;
    value_kwh?: unknown;
    value_m3?: unknown;
    parsed_json?: Record<string, unknown> | null;
    meter_type?: string;
  }>,
  series: MeterChartSeries,
): MeterChartPoint[] => {
  const sortedReadings = [...meterReadings].sort(
    (a, b) =>
      new Date(a.timestamp || a.createdAt || "").getTime() -
      new Date(b.timestamp || b.createdAt || "").getTime(),
  );

  const valueKey = series.id === "energy" ? "value_kwh" : "value_m3";

  return sortedReadings
    .map((reading) => {
      const value = getNumericValue(reading[valueKey]);
      if (value === null || !isPlausibleChartValue(value)) return null;
      const pointDate = new Date(reading.timestamp || reading.createdAt || "");
      if (Number.isNaN(pointDate.getTime())) return null;
      return formatChartPoint(
        pointDate,
        value,
        pointDate.getTime(),
        reading.timestamp || reading.createdAt || "",
      );
    })
    .filter((point): point is MeterChartPoint => !!point);
};
