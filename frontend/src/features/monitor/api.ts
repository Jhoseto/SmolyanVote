import { apiClient } from "@/lib/api/client";
import type {
  MonitorCompetition,
  MonitorCompanyDetail,
  MonitorConnections,
  MonitorContractDetail,
  MonitorCouncilStats,
  MonitorBudget,
  MonitorEuFunds,
  MonitorCouncilorCard,
  MonitorDocumentDetail,
  MonitorFeedItem,
  MonitorFlows,
  MonitorOverview,
  MonitorPage,
  MonitorProcurementStats,
  MonitorRegionalComparison,
  MonitorRelatedSignal,
  MonitorSearchSuggestion,
} from "./types";

export const monitorApi = {
  overview: () => apiClient.get<MonitorOverview>("/api/v1/monitor/overview", { anonymous: true }),

  feed: (params?: { category?: string; type?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.type) q.set("type", params.type);
    if (params?.page != null) q.set("page", String(params.page));
    if (params?.size != null) q.set("size", String(params.size));
    const qs = q.toString();
    return apiClient.get<MonitorPage<MonitorFeedItem>>(
      `/api/v1/monitor/feed${qs ? `?${qs}` : ""}`,
      { anonymous: true },
    );
  },

  weeklyHighlights: () =>
    apiClient.get<MonitorFeedItem[]>("/api/v1/monitor/feed/weekly", { anonymous: true }),

  searchSuggest: (q: string, limit = 8) =>
    apiClient.get<MonitorSearchSuggestion[]>(
      `/api/v1/monitor/search/suggest?q=${encodeURIComponent(q)}&limit=${limit}`,
      { anonymous: true },
    ),

  search: (q: string, page = 0) =>
    apiClient.get<MonitorPage<MonitorFeedItem>>(
      `/api/v1/monitor/search?q=${encodeURIComponent(q)}&page=${page}`,
      { anonymous: true },
    ),

  procurementStats: () =>
    apiClient.get<MonitorProcurementStats>("/api/v1/monitor/procurement/stats", { anonymous: true }),

  anomalies: (page = 0, size = 20) =>
    apiClient.get<MonitorPage<MonitorFeedItem>>(
      `/api/v1/monitor/procurement/anomalies?page=${page}&size=${size}`,
      { anonymous: true },
    ),

  flows: () => apiClient.get<MonitorFlows>("/api/v1/monitor/procurement/flows", { anonymous: true }),

  contract: (id: number) =>
    apiClient.get<MonitorContractDetail>(`/api/v1/monitor/contract/${id}`, { anonymous: true }),

  document: (id: number) =>
    apiClient.get<MonitorDocumentDetail>(`/api/v1/monitor/document/${id}`, { anonymous: true }),

  deadlines: () => apiClient.get<MonitorFeedItem[]>("/api/v1/monitor/deadlines", { anonymous: true }),

  council: (page = 0) =>
    apiClient.get<MonitorPage<MonitorFeedItem>>(`/api/v1/monitor/council?page=${page}`, { anonymous: true }),

  consultations: (page = 0) =>
    apiClient.get<MonitorPage<MonitorFeedItem>>(`/api/v1/monitor/consultations?page=${page}`, {
      anonymous: true,
    }),

  competition: () =>
    apiClient.get<MonitorCompetition>("/api/v1/monitor/procurement/competition", { anonymous: true }),

  councilTimeline: () =>
    apiClient.get<MonitorFeedItem[]>("/api/v1/monitor/council/timeline", { anonymous: true }),

  company: (eik: string) =>
    apiClient.get<MonitorCompanyDetail>(`/api/v1/monitor/company/${eik}`, { anonymous: true }),

  connections: () =>
    apiClient.get<MonitorConnections>("/api/v1/monitor/connections", { anonymous: true }),

  companyConnections: (eik: string) =>
    apiClient.get<MonitorConnections>(`/api/v1/monitor/company/${eik}/connections`, {
      anonymous: true,
    }),

  regionalComparison: () =>
    apiClient.get<MonitorRegionalComparison>("/api/v1/monitor/procurement/regional-comparison", {
      anonymous: true,
    }),

  councilStats: () =>
    apiClient.get<MonitorCouncilStats>("/api/v1/monitor/council/stats", { anonymous: true }),

  contractRelatedSignals: (id: number) =>
    apiClient.get<MonitorRelatedSignal[]>(`/api/v1/monitor/contract/${id}/related-signals`, {
      anonymous: true,
    }),

  budget: () => apiClient.get<MonitorBudget>("/api/v1/monitor/budget", { anonymous: true }),

  euFunds: () => apiClient.get<MonitorEuFunds>("/api/v1/monitor/eu-funds", { anonymous: true }),

  councilors: () =>
    apiClient.get<MonitorCouncilorCard[]>("/api/v1/monitor/council/councilors", { anonymous: true }),
};
