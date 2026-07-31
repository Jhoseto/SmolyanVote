import { apiClient } from "@/lib/api/client";
import type {
  MonitorCompetition,
  MonitorCompanyDetail,
  MonitorConnections,
  MonitorContractDetail,
  MonitorCouncilStats,
  MonitorBudget,
  MonitorBriefing,
  MonitorEuFunds,
  MonitorCouncilorCard,
  MonitorDocumentDetail,
  MonitorFeedItem,
  MonitorFlows,
  MonitorMunicipality,
  MonitorOverview,
  MonitorPage,
  MonitorProcurementStats,
  MonitorRegionalComparison,
  MonitorRelatedSignal,
  MonitorSearchSuggestion,
} from "./types";

/**
 * The selected municipality, or null for the whole oblast. Every scoped endpoint takes it
 * as `authority=<EIK>`; the backend widens to the oblast when it is absent.
 */
export type MonitorAuthority = string | null | undefined;

function url(path: string, authority: MonitorAuthority, extra?: Record<string, string | number>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extra ?? {})) {
    params.set(key, String(value));
  }
  if (authority) params.set("authority", authority);
  const qs = params.toString();
  return `/api/v1/monitor/${path}${qs ? `?${qs}` : ""}`;
}

const anonymous = { anonymous: true } as const;

export const monitorApi = {
  municipalities: () =>
    apiClient.get<MonitorMunicipality[]>("/api/v1/monitor/municipalities", anonymous),

  overview: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorOverview>(url("overview", authority), anonymous),

  feed: (
    params?: { category?: string; type?: string; page?: number; size?: number; sort?: string },
    authority?: MonitorAuthority,
  ) => {
    const extra: Record<string, string | number> = {};
    if (params?.category) extra.category = params.category;
    if (params?.type) extra.type = params.type;
    if (params?.page != null) extra.page = params.page;
    if (params?.size != null) extra.size = params.size;
    if (params?.sort) extra.sort = params.sort;
    return apiClient.get<MonitorPage<MonitorFeedItem>>(url("feed", authority, extra), anonymous);
  },

  briefing: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorBriefing>(url("briefing", authority), anonymous),

  weeklyHighlights: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorFeedItem[]>(url("feed/weekly", authority), anonymous),

  searchSuggest: (q: string, limit = 8, authority?: MonitorAuthority) =>
    apiClient.get<MonitorSearchSuggestion[]>(
      url("search/suggest", authority, { q, limit }),
      anonymous,
    ),

  search: (q: string, page = 0, authority?: MonitorAuthority) =>
    apiClient.get<MonitorPage<MonitorFeedItem>>(url("search", authority, { q, page }), anonymous),

  procurementStats: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorProcurementStats>(url("procurement/stats", authority), anonymous),

  anomalies: (page = 0, size = 20, authority?: MonitorAuthority) =>
    apiClient.get<MonitorPage<MonitorFeedItem>>(
      url("procurement/anomalies", authority, { page, size }),
      anonymous,
    ),

  flows: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorFlows>(url("procurement/flows", authority), anonymous),

  contract: (id: number) =>
    apiClient.get<MonitorContractDetail>(`/api/v1/monitor/contract/${id}`, anonymous),

  document: (id: number) =>
    apiClient.get<MonitorDocumentDetail>(`/api/v1/monitor/document/${id}`, anonymous),

  deadlines: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorFeedItem[]>(url("deadlines", authority), anonymous),

  council: (page = 0, authority?: MonitorAuthority) =>
    apiClient.get<MonitorPage<MonitorFeedItem>>(url("council", authority, { page }), anonymous),

  consultations: (page = 0, authority?: MonitorAuthority) =>
    apiClient.get<MonitorPage<MonitorFeedItem>>(
      url("consultations", authority, { page }),
      anonymous,
    ),

  competition: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorCompetition>(url("procurement/competition", authority), anonymous),

  councilTimeline: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorFeedItem[]>(url("council/timeline", authority), anonymous),

  company: (eik: string) =>
    apiClient.get<MonitorCompanyDetail>(`/api/v1/monitor/company/${eik}`, anonymous),

  connections: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorConnections>(url("connections", authority), anonymous),

  companyConnections: (eik: string) =>
    apiClient.get<MonitorConnections>(`/api/v1/monitor/company/${eik}/connections`, anonymous),

  /** Always the whole region — the view exists to compare the municipalities. */
  regionalComparison: () =>
    apiClient.get<MonitorRegionalComparison>(
      "/api/v1/monitor/procurement/regional-comparison",
      anonymous,
    ),

  councilStats: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorCouncilStats>(url("council/stats", authority), anonymous),

  contractRelatedSignals: (id: number) =>
    apiClient.get<MonitorRelatedSignal[]>(
      `/api/v1/monitor/contract/${id}/related-signals`,
      anonymous,
    ),

  budget: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorBudget>(url("budget", authority), anonymous),

  euFunds: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorEuFunds>(url("eu-funds", authority), anonymous),

  councilors: (authority?: MonitorAuthority) =>
    apiClient.get<MonitorCouncilorCard[]>(url("council/councilors", authority), anonymous),
};
