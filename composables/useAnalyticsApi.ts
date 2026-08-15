import { getAuthHeaders } from "~/utils/apiClientHelpers";

export type AnalyticsSite = {
  id: number;
  name: string;
  domain: string;
  publicId: string;
  isActive: boolean;
  retentionDays: number;
};

export type AnalyticsQuery = {
  siteId: number;
  from: string;
  to: string;
  path?: string;
};

const baseURL = () => import.meta.env.VITE_INTERNAL_API_URL || "/api";

async function getJson<T>(path: string): Promise<T> {
  return await $fetch<T>(`${baseURL()}${path}`, {
    headers: getAuthHeaders(),
  });
}

export function useAnalyticsApi() {
  const listSites = () =>
    getJson<{ sites: AnalyticsSite[]; scriptUrl: string }>("/analytics/sites");

  const createSite = (body: {
    name: string;
    domain: string;
    retentionDays?: number;
  }) =>
    $fetch<AnalyticsSite>(`${baseURL()}/analytics/sites`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body,
    });

  const updateSite = (id: number, body: Partial<AnalyticsSite>) =>
    $fetch<AnalyticsSite>(`${baseURL()}/analytics/sites/${id}`, {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body,
    });

  const deleteSite = (id: number) =>
    $fetch(`${baseURL()}/analytics/sites/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

  const qs = (query: AnalyticsQuery) => {
    const params = new URLSearchParams({
      siteId: String(query.siteId),
      from: query.from,
      to: query.to,
    });
    if (query.path) params.set("path", query.path);
    return params.toString();
  };

  const overview = (query: AnalyticsQuery) =>
    getJson<{
      pageviews: number;
      visitors: number;
      avgDurationMs: number;
      bounceRate: number;
      conversions: number;
    }>(`/analytics/overview?${qs(query)}`);

  const timeseries = (query: AnalyticsQuery) =>
    getJson<{
      points: { date: string; pageviews: number; visitors: number }[];
    }>(`/analytics/timeseries?${qs(query)}`);

  const pages = (query: AnalyticsQuery) =>
    getJson<{
      pages: {
        path: string;
        title: string | null;
        pageviews: number;
        visitors: number;
      }[];
    }>(`/analytics/pages?${qs(query)}`);

  const referrers = (query: AnalyticsQuery) =>
    getJson<{
      referrers: { referrer: string; pageviews: number; visitors: number }[];
    }>(`/analytics/referrers?${qs(query)}`);

  const events = (query: AnalyticsQuery) =>
    getJson<{
      events: {
        name: string;
        count: number;
        visitors: number;
        isConversion: boolean;
      }[];
      livemap: {
        pois: { value: string; count: number }[];
        renters: { value: string; count: number }[];
        contacts: { value: string; count: number }[];
        spaces: { value: string; count: number }[];
      };
    }>(`/analytics/events?${qs(query)}`);

  const paths = (query: AnalyticsQuery) =>
    getJson<{ paths: { journey: string; count: number }[] }>(
      `/analytics/paths?${qs(query)}`,
    );

  return {
    listSites,
    createSite,
    updateSite,
    deleteSite,
    overview,
    timeseries,
    pages,
    referrers,
    events,
    paths,
  };
}
