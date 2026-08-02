import { apiClient } from "@/lib/api/client";
import type {
  MonitorAdminAiStats,
  MonitorAdminCompany,
  MonitorAdminContract,
  MonitorAdminCouncilor,
  MonitorAdminDocument,
  MonitorAdminIngestionLog,
  MonitorAdminRawDocument,
  MonitorBudgetLine,
  MonitorBudgetLineRequest,
  MonitorCompanyUpdateRequest,
  MonitorContractUpdateRequest,
  MonitorCouncilorRequest,
  MonitorDataQualityReport,
  MonitorIngestionStatus,
  MonitorJobState,
  MonitorSchedulerSettings,
  MonitorSigmaSpotCheck,
  PageResponse,
} from "../types";

export const adminMonitorApi = {
  ingestionStatus: () =>
    apiClient.get<MonitorIngestionStatus>("/admin/api/monitor/ingestion/status"),

  ingestionLogs: (limit = 20) =>
    apiClient.get<MonitorAdminIngestionLog[]>(`/admin/api/monitor/ingestion/logs?limit=${limit}`),

  documents: (filter: "recent" | "pending" = "recent", limit = 50) =>
    apiClient.get<MonitorAdminDocument[]>(
      `/admin/api/monitor/documents?filter=${filter}&limit=${limit}`,
    ),

  aiStats: () => apiClient.get<MonitorAdminAiStats>("/admin/api/monitor/ai/stats"),

  rawDocument: (id: number) =>
    apiClient.get<MonitorAdminRawDocument>(`/admin/api/monitor/documents/${id}/raw`),

  ingestionJobs: () => apiClient.get<MonitorJobState[]>("/admin/api/monitor/ingestion/jobs"),

  cancelIngestionJob: (key: string) =>
    apiClient.post<{ accepted: boolean; message: string; logsClosed: number }>(
      `/admin/api/monitor/ingestion/jobs/${encodeURIComponent(key)}/cancel`,
    ),

  cancelAllIngestionJobs: () =>
    apiClient.post<{ jobsCancelled: number; logsClosed: number; message: string }>(
      "/admin/api/monitor/ingestion/jobs/cancel-all",
    ),

  cancelIngestionLog: (id: number) =>
    apiClient.post<{ accepted: boolean; message: string }>(
      `/admin/api/monitor/ingestion/logs/${id}/cancel`,
    ),

  triggerSigma: () => apiClient.post<MonitorJobState>("/admin/api/monitor/ingestion/trigger-sigma"),

  refreshSigmaCache: () =>
    apiClient.post<MonitorJobState>("/admin/api/monitor/ingestion/refresh-sigma-cache"),

  triggerScrape: () =>
    apiClient.post<MonitorJobState>("/admin/api/monitor/ingestion/trigger-scrape"),

  triggerPipeline: () =>
    apiClient.post<MonitorJobState>("/admin/api/monitor/ingestion/trigger-pipeline"),

  processAiBatch: (limit = 25) =>
    apiClient.post<MonitorJobState>(`/admin/api/monitor/ai/process-batch?limit=${limit}`),

  enrichInsights: () =>
    apiClient.post<MonitorJobState>("/admin/api/monitor/enrich-insights"),

  generateRegionalReport: (authority?: string) =>
    apiClient.post<MonitorJobState>(
      `/admin/api/monitor/ai/regional-report${authority ? `?authority=${encodeURIComponent(authority)}` : ""}`,
    ),

  reprocessDocument: (documentId: number) =>
    apiClient.post<{ status: string }>(`/admin/api/monitor/ai/reprocess/${documentId}`),

  enrichTradeRegister: (limit = 25) =>
    apiClient.post<MonitorJobState>(`/admin/api/monitor/enrichment/trade-register?limit=${limit}`),

  triggerEop: (days = 7) =>
    apiClient.post<MonitorJobState>(`/admin/api/monitor/ingestion/trigger-eop?days=${days}`),

  enrichSubcontractors: (refreshAll = false) =>
    apiClient.post<MonitorJobState>(
      `/admin/api/monitor/ingestion/enrich-subcontractors?refreshAll=${refreshAll}`,
    ),

  ocrBatch: (limit = 10) =>
    apiClient.post<MonitorJobState>(`/admin/api/monitor/ingestion/ocr-batch?limit=${limit}`),

  syncCouncilors: () =>
    apiClient.post<MonitorJobState>("/admin/api/monitor/ingestion/sync-councilors"),

  verifyZpokonpi: (authority?: string) =>
    apiClient.post<MonitorJobState>(
      `/admin/api/monitor/ingestion/verify-zpokonpi${authority ? `?authority=${encodeURIComponent(authority)}` : ""}`,
    ),

  dataQualityReport: () =>
    apiClient.get<MonitorDataQualityReport>("/admin/api/monitor/integrity/report"),

  repairIntegrity: () =>
    apiClient.post<MonitorJobState>("/admin/api/monitor/integrity/repair"),

  sigmaSpotCheck: (sample = 25) =>
    apiClient.post<MonitorSigmaSpotCheck>(
      `/admin/api/monitor/integrity/sigma-spot-check?sample=${sample}`,
    ),

  deleteDocument: (id: number) =>
    apiClient.delete<{ status: string }>(`/admin/api/monitor/documents/${id}`),

  // ---- Contracts ----------------------------------------------------

  searchContracts: (search: string, page = 0, size = 25) =>
    apiClient.get<PageResponse<MonitorAdminContract>>(
      `/admin/api/monitor/contracts?search=${encodeURIComponent(search)}&page=${page}&size=${size}`,
    ),

  getContract: (id: number) =>
    apiClient.get<MonitorAdminContract>(`/admin/api/monitor/contracts/${id}`),

  updateContract: (id: number, body: MonitorContractUpdateRequest) =>
    apiClient.put<MonitorAdminContract>(`/admin/api/monitor/contracts/${id}`, { body }),

  deleteContract: (id: number) =>
    apiClient.delete<{ status: string }>(`/admin/api/monitor/contracts/${id}`),

  // ---- Companies ------------------------------------------------------

  searchCompanies: (search: string, page = 0, size = 25) =>
    apiClient.get<PageResponse<MonitorAdminCompany>>(
      `/admin/api/monitor/companies?search=${encodeURIComponent(search)}&page=${page}&size=${size}`,
    ),

  updateCompany: (id: number, body: MonitorCompanyUpdateRequest) =>
    apiClient.put<MonitorAdminCompany>(`/admin/api/monitor/companies/${id}`, { body }),

  deleteCompany: (id: number) =>
    apiClient.delete<{ status: string }>(`/admin/api/monitor/companies/${id}`),

  enrichCompanyOne: (eik: string) =>
    apiClient.post<{ updated: number }>(`/admin/api/monitor/enrichment/trade-register/${eik}`),

  // ---- Councilors ------------------------------------------------------

  listCouncilors: () => apiClient.get<MonitorAdminCouncilor[]>("/admin/api/monitor/councilors"),

  createCouncilor: (body: MonitorCouncilorRequest) =>
    apiClient.post<MonitorAdminCouncilor>("/admin/api/monitor/councilors", { body }),

  updateCouncilor: (id: number, body: MonitorCouncilorRequest) =>
    apiClient.put<MonitorAdminCouncilor>(`/admin/api/monitor/councilors/${id}`, { body }),

  deleteCouncilor: (id: number) =>
    apiClient.delete<{ status: string }>(`/admin/api/monitor/councilors/${id}`),

  // ---- Budget lines ------------------------------------------------------

  listBudgetLines: (year?: number) =>
    apiClient.get<MonitorBudgetLine[]>(
      `/admin/api/monitor/budget-lines${year ? `?year=${year}` : ""}`,
    ),

  createBudgetLine: (body: MonitorBudgetLineRequest) =>
    apiClient.post<MonitorBudgetLine>("/admin/api/monitor/budget-lines", { body }),

  updateBudgetLine: (id: number, body: MonitorBudgetLineRequest) =>
    apiClient.put<MonitorBudgetLine>(`/admin/api/monitor/budget-lines/${id}`, { body }),

  deleteBudgetLine: (id: number) =>
    apiClient.delete<{ status: string }>(`/admin/api/monitor/budget-lines/${id}`),

  // ---- Scheduler settings ------------------------------------------------------

  getSchedulerSettings: () =>
    apiClient.get<MonitorSchedulerSettings>("/admin/api/monitor/settings/scheduler"),

  updateSchedulerSettings: (body: MonitorSchedulerSettings) =>
    apiClient.put<MonitorSchedulerSettings>("/admin/api/monitor/settings/scheduler", { body }),
};
