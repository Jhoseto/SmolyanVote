export interface RiskBadge {
  code: string;
  label: string;
  tooltip?: string | null;
}

export interface MonitorMunicipality {
  eik: string;
  name: string;
  /** Council decisions, consultations and deadlines are scraped for Смолян only. */
  hasScrapedDocuments: boolean;
}

export interface MonitorSearchSuggestion {
  id: string;
  itemType: string;
  title: string;
  subtitle: string | null;
}

export interface MonitorOverview {
  spentYtdEur: number;
  contractCount: number;
  flaggedCount: number;
  documentCount: number;
  newDocumentsThisWeek: number;
  dataFreshness: string | null;
}

export interface MonitorFeedItem {
  id: string;
  itemType: "contract" | "document" | string;
  title: string;
  shortSummary: string | null;
  category: string | null;
  riskScore: number | null;
  riskFlags: RiskBadge[];
  amountEur: number | null;
  date: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
  registryTitle?: string | null;
  concernType?: string | null;
}

export interface MonitorBriefingTheme {
  code: string;
  label: string;
  count: number;
  amountEur: number;
  explanation: string;
}

export interface MonitorAiFinding {
  title: string;
  body: string;
  severity: string;
}

export interface MonitorAiReport {
  executiveSummary: string | null;
  moneyLeaks: MonitorAiFinding[];
  irregularities: MonitorAiFinding[];
  conclusions: string[];
  watchNext: string[];
  generatedAt: string | null;
  aiGenerated: boolean;
}

export interface MonitorBriefingChartPoint {
  label: string;
  count: number;
  amountEur: number | null;
  color: string;
}

export interface MonitorBriefing {
  headline: string;
  narrative: string;
  flaggedCount: number;
  flaggedAmountEur: number;
  spentYtdEur: number;
  themes: MonitorBriefingTheme[];
  topConcerns: MonitorFeedItem[];
  aiReport: MonitorAiReport;
  riskChart: MonitorBriefingChartPoint[];
  councilChart: MonitorBriefingChartPoint[];
  recentDocuments: MonitorFeedItem[];
}

export interface MonitorPage<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MonitorContractDetail {
  id: number;
  sigmaId: string;
  unp: string | null;
  subject: string;
  shortSummary: string | null;
  authorityName: string | null;
  authorityEik: string | null;
  contractorName: string | null;
  contractorEik: string | null;
  contractorKind: string | null;
  hasSubcontractors: boolean;
  subcontractorName: string | null;
  subcontractorEik: string | null;
  subcontractingPercent: number | null;
  subcontractingAmountEur: number | null;
  sectorCode: string | null;
  procedureType: string | null;
  signedAt: string | null;
  amountEur: number | null;
  originalAmountEur: number | null;
  estimatedValueEur: number | null;
  publicationDate: string | null;
  euFunded: boolean;
  bidsReceived: number | null;
  riskScore: number | null;
  riskFlags: RiskBadge[];
  aiCategory: string | null;
  impactScore: number | null;
  regionScope: string;
  dataSource: string;
  fetchedAt: string | null;
  relatedSignalsCount: number;
  relatedSignals: MonitorRelatedSignal[];
  amendments: MonitorAmendment[];
  insightHeadline?: string | null;
  whyItMatters?: string | null;
  concernType?: string | null;
  aiAnalysis?: string | null;
  sigmaUrl?: string | null;
  sigmaRefreshedAt?: string | null;
}

export interface MonitorAmendment {
  id: number;
  amendedAt: string | null;
  previousAmountEur: number | null;
  newAmountEur: number | null;
  deltaEur: number | null;
  changeDescription: string | null;
  changeReason: string | null;
  sourceUrl: string | null;
}

export interface MonitorDocumentDetail {
  id: number;
  documentType: string;
  title: string;
  shortSummary: string | null;
  aiCategory: string | null;
  impactScore: number | null;
  amount: number | null;
  amountCurrency: string | null;
  amountEur: number | null;
  companyName: string | null;
  deadlineDate: string | null;
  publishedAt: string | null;
  sourceUrl: string | null;
  aiAnalysis?: string | null;
  insightWhy?: string | null;
}

export interface MonitorProcurementStats {
  monthlySpend: { year: number; month: number; amountEur: number; count: number }[];
  yearlySpend: { year: number; amountEur: number; count: number }[];
  sectorBreakdown: { sectorCode: string; amountEur: number; count: number }[];
  topCompanies: { eik: string; name: string; amountEur: number; contractCount: number }[];
}

export interface MonitorFlows {
  nodes: { id: string; label: string; type: string; totalEur: number }[];
  links: {
    source: string;
    target: string;
    valueEur: number;
    count: number;
    flaggedCount: number;
    concernLabel: string | null;
    citizenHint: string | null;
    contractsWithSubcontractor: number;
    subcontractorName: string | null;
    subcontractorEik: string | null;
    subcontractingTotalEur: number | null;
    topSubcontractors: {
      eik: string;
      name: string;
      valueEur: number;
      count: number;
    }[];
  }[];
  subLinks: {
    source: string;
    target: string;
    valueEur: number;
    count: number;
    subcontractorName: string | null;
    subcontractorEik: string | null;
  }[];
  subcontractorCoverage?: {
    declaredContracts: number;
    withAmountEur: number;
  };
}

export interface MonitorFlowPathDetail {
  authority: { eik: string; name: string; nodeId: string };
  contractor: { eik: string | null; name: string; nodeId: string };
  totals: {
    totalEur: number;
    contractCount: number;
    subcontractingTotalEur: number | null;
    contractsWithSubcontractor: number;
  };
  contracts: {
    id: number;
    subject: string;
    signedAt: string | null;
    amountEur: number;
    subcontractorName: string | null;
    subcontractorEik: string | null;
    subcontractingAmountEur: number | null;
    subcontractingPercent: number | null;
    concernLabel: string | null;
    citizenHint: string | null;
  }[];
}

export type MonitorTab =
  | "all"
  | "procurement"
  | "anomalies"
  | "flows"
  | "council"
  | "consultations"
  | "deadlines"
  | "region"
  | "budget"
  | "eu-funds"
  | "methodology";

export interface MonitorCompetition {
  singleBidderSharePercent: number;
  hhiIndex: number;
  competitionLabel: string;
  bySector: {
    sectorCode: string;
    hhiIndex: number;
    contractCount: number;
    topContractorName: string;
  }[];
}

export interface MonitorCompanyDetail {
  eik: string;
  name: string;
  totalWonEur: number;
  contractCount: number;
  compositeRiskScore: number | null;
  recentContracts: MonitorFeedItem[];
  subcontractorRoleCount: number;
  subcontractorRoleTotalEur: number | null;
  subcontractorRoles: MonitorFeedItem[];
  legalForm: string | null;
  registeredAddress: string | null;
  managersSummary: string | null;
  registryStatus: string | null;
  registryFetchedAt: string | null;
}

export interface MonitorBudget {
  year: number;
  yearTo: number;
  availableYears: number[];
  municipality: string;
  totalPlannedEur: number;
  totalExecutedEur: number;
  rows: {
    id: string;
    label: string;
    plannedEur: number;
    executedEur: number;
    executionPercent: number;
  }[];
  sourceUrl: string | null;
  /** True only when plan vs execution comparison is shown (Smolyan, current year). */
  plannedAvailable: boolean;
  contractCount: number;
  dataBasis: string | null;
  note: string | null;
  officialBudget: MonitorOfficialBudget | null;
}

export interface MonitorOfficialBudget {
  year: number;
  municipality: string;
  adoptedTotalBgn: number;
  adoptedTotalEur: number | null;
  executedTotalBgn: number | null;
  executedTotalEur: number | null;
  executionPercent: number | null;
  executionAsOf: string | null;
  rows: {
    id: string;
    label: string;
    adoptedBgn: number;
    adoptedEur: number | null;
    executedBgn: number | null;
    executedEur: number | null;
    executionPercent: number | null;
  }[];
  sourceUrl: string | null;
  sourceTitle: string | null;
  note: string | null;
  citizenAssessment?: MonitorCitizenAssessment | null;
}

export interface MonitorCitizenAssessment {
  headline: string;
  verdict: "positive" | "mixed" | "negative" | "pending" | string;
  successes: string[];
  concerns: string[];
  citizenImpact: string;
}

export interface MonitorOfficialBudgetTrendPoint {
  year: number;
  adoptedTotalBgn: number;
  executedTotalBgn: number | null;
  executionPercent: number | null;
  yoyAdoptedPercent: number | null;
}

export interface MonitorEuFunds {
  totalEur: number;
  projectCount: number;
  projects: {
    contractId: number;
    title: string;
    municipality: string;
    contractorName: string | null;
    amountEur: number;
    signedAt: string | null;
    sourceUrl: string | null;
  }[];
  dataNote: string;
}

export type MonitorZpokonpiStatus =
  | "OK"
  | "ROSTER_ONLY"
  | "WARNING"
  | "NOT_FOUND"
  | "UNAVAILABLE"
  | "PENDING";

export interface MonitorCouncilorCard {
  id: number;
  fullName: string;
  roleLabel: string | null;
  party: string | null;
  mandatePeriod: string | null;
  zpokonpiChecked: boolean;
  zpokonpiNote: string | null;
  zpokonpiStatus: MonitorZpokonpiStatus | string | null;
  zpokonpiRegisterUrl: string | null;
  sourceUrl: string | null;
  zpokonpiPortalUrl: string;
}

export interface MonitorConnections {
  nodes: {
    id: string;
    label: string;
    type: "authority" | "contractor" | string;
    totalEur: number;
    linkCount: number;
    flaggedCount: number;
    citizenHint: string | null;
  }[];
  links: {
    source: string;
    target: string;
    valueEur: number;
    contractCount: number;
  }[];
}

export interface MonitorRegionalComparison {
  municipalities: {
    eik: string;
    name: string;
    totalSpentEur: number;
    contractCount: number;
    avgBidsReceived: number | null;
    singleBidderSharePercent: number;
  }[];
}

export interface MonitorCouncilStats {
  totalDocuments: number;
  byType: {
    type: string;
    label: string;
    count: number;
    latestDate: string | null;
    latestTitle: string | null;
  }[];
}

export interface MonitorRelatedSignal {
  id: number;
  title: string;
  category: string | null;
  snippet: string | null;
}

export interface MonitorIngestionStatus {
  sigmaStatus: string;
  sigmaLastRun: string | null;
  sigmaRecordsProcessed: number | null;
  sigmaMessage: string | null;
  eopStatus: string;
  eopLastRun: string | null;
  eopRecordsProcessed: number | null;
  eopMessage: string | null;
  scrapeStatus: string;
  scrapeLastRun: string | null;
  contractCount: number;
  documentCount: number;
}
