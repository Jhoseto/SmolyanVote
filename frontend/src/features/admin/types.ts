/** Loose actuator maps — backend returns `Map<String, Object>`. */
export type MetricMap = Record<string, unknown>;

export interface DashboardAggregate {
  health: MetricMap;
  metrics: MetricMap;
  appInfo: MetricMap;
  dbHealth: MetricMap;
  jvmMetrics: MetricMap;
  diskSpace: MetricMap;
  dbPool: MetricMap;
  errorRates: MetricMap;
}

export interface AdminDashboardData {
  aggregate: DashboardAggregate;
  cloudinary: MetricMap;
  email: MetricMap;
  httpStatus: MetricMap;
  responseTime: MetricMap;
  memory: MetricMap;
  recentErrors: MetricMap;
}

export type UserRole = "ADMIN" | "USER";
export type UserStatus =
  | "PENDING_ACTIVATION"
  | "ACTIVE"
  | "TEMPORARILY_BANNED"
  | "PERMANENTLY_BANNED";

export interface AdminUser {
  id: number;
  created: string | null;
  modified: string | null;
  username: string;
  realName: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
  imageUrl: string | null;
  role: UserRole;
  status: UserStatus;
  onlineStatus: number;
  lastOnline: string | null;
  userEventsCount: number;
  totalVotes: number;
  publicationsCount: number;
  banReason: string | null;
  banDate: string | null;
  banEndDate: string | null;
  bannedBy: string | null;
  moderationStrikeCount?: number;
  masterAdmin?: boolean;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  totalCount: number;
  page?: number;
  size?: number;
  totalPages?: number;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  tempBannedUsers: number;
  permBannedUsers: number;
  onlineUsers: number;
  adminCount: number;
  userCount: number;
  todayRegistrations: number;
  weekRegistrations: number;
  monthRegistrations: number;
  avgEngagement?: number;
  highActivityUsers?: number;
  timestamp?: string;
}

export interface BanHistoryItem {
  id: number;
  targetUsername: string;
  adminUsername: string;
  actionType: "ROLE_CHANGE" | "BAN" | "UNBAN" | string;
  actionTimestamp: string;
  reason: string | null;
  oldRole?: UserRole | null;
  newRole?: UserRole | null;
  banType?: string | null;
  banDurationDays?: number | null;
  banDurationHours?: number | null;
  oldStatus?: UserStatus | null;
  newStatus?: UserStatus | null;
}

export interface BulkResult {
  successCount?: number;
  errorCount?: number;
  errors?: string[];
  errorMessages?: string[];
  message?: string;
}

export type ReportStatus = "PENDING" | "REVIEWED" | "DISMISSED" | "RESOLVED" | string;

export interface GroupedReport {
  entityType: string;
  entityId: number;
  reportCount: number;
  firstReportDate: string | null;
  lastReportDate: string | null;
  reporterUsernames: string[];
  reasons: string[];
  mostCommonReason: string | null;
  status: ReportStatus;
  mostRecentDescription: string | null;
  adminNotes: string | null;
  reportIds: number[];
  entityLabel?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export interface ReportStatistics {
  totalReports: number;
  pendingReports: number;
  recentReports?: number;
  reasonCounts?: Record<string, number>;
  entityTypeCounts?: Record<string, number>;
}

export interface ReportDetail {
  id: number;
  entityType: string;
  entityId: number;
  reporterUsername: string;
  reason: string;
  description: string | null;
  status: ReportStatus;
  createdAt: string | null;
  reviewedAt: string | null;
  reviewedByUsername: string | null;
  adminNotes: string | null;
}

export interface ActivityItem {
  id: number;
  timestamp: string;
  userId: number | null;
  username: string | null;
  action: string | null;
  entityType: string | null;
  entityId: number | null;
  details: string | null;
  ipAddress: string | null;
  type: string;
  displayText: string;
  iconClass: string;
  colorClass: string;
}

export interface ActivityStats {
  lastHour?: number;
  today?: number;
  onlineUsers?: number;
  topUsers?: { username: string; activityCount: number }[];
  topActions?: { action: string; count: number }[];
  [key: string]: unknown;
}

export interface ActivitiesResponse {
  success: boolean;
  activities: ActivityItem[];
  stats?: ActivityStats;
  count?: number;
  timestamp?: string;
}

export type AdminTab =
  | "overview"
  | "health"
  | "users"
  | "reports"
  | "inbox"
  | "content"
  | "podcast"
  | "monitor"
  | "events"
  | "moderation"
  | "activity"
  | "subscriptions";

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

/**
 * A background ingestion job. Imports take minutes, so triggers answer with the job
 * state and the panel polls until it reaches SUCCESS or FAILED.
 */
export interface MonitorJobState {
  key: string;
  label: string;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | "BUSY";
  message: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface MonitorAdminIngestionLog {
  id: number;
  ingestionType: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  recordsProcessed: number | null;
  message: string | null;
}

export interface MonitorAdminDocument {
  id: number;
  title: string;
  documentType: string;
  shortSummary: string | null;
  sourceUrl: string | null;
  contentHash: string | null;
  publishedAt: string | null;
  fetchedAt: string | null;
  aiPending: boolean;
  hasRawContent: boolean;
}

export interface MonitorAdminAiStats {
  pendingDocuments: number;
  pendingContracts: number;
  totalDocuments: number;
  totalContracts: number;
  geminiConfigured: boolean;
  geminiModel: string;
}

export interface MonitorAdminRawDocument {
  id: number;
  title: string;
  rawContent: string | null;
  sourceUrl: string | null;
  contentHash: string | null;
}

export interface MonitorAdminContract {
  id: number;
  sigmaId: string;
  unp: string | null;
  subject: string;
  authorityName: string | null;
  authorityEik: string;
  contractorName: string | null;
  contractorEik: string | null;
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
  sourceUrl: string | null;
}

export interface MonitorContractUpdateRequest {
  subject: string;
  authorityName: string | null;
  authorityEik: string;
  contractorName: string | null;
  contractorEik: string | null;
  sectorCode: string | null;
  procedureType: string | null;
  signedAt: string | null;
  amountEur: number | null;
  euFunded: boolean;
  bidsReceived: number | null;
  sourceUrl: string | null;
}

export interface MonitorAdminCompany {
  id: number;
  eik: string;
  name: string;
  consortium: boolean;
  totalWonEur: number | null;
  contractCount: number | null;
  compositeRiskScore: number | null;
  legalForm: string | null;
  registeredAddress: string | null;
  managersSummary: string | null;
  registryStatus: string | null;
  foundedAt: string | null;
}

export interface MonitorCompanyUpdateRequest {
  name: string;
  consortium: boolean;
  legalForm: string | null;
  registeredAddress: string | null;
  managersSummary: string | null;
}

export interface MonitorAdminCouncilor {
  id: number;
  fullName: string;
  roleLabel: string | null;
  party: string | null;
  mandatePeriod: string | null;
  zpokonpiChecked: boolean;
  zpokonpiNote: string | null;
  sourceUrl: string | null;
  zpokonpiPortalUrl: string;
}

export interface MonitorCouncilorRequest {
  fullName: string;
  roleLabel: string | null;
  party: string | null;
  mandatePeriod: string | null;
  zpokonpiChecked: boolean;
  zpokonpiNote: string | null;
  sourceUrl: string | null;
}

export interface MonitorBudgetLine {
  id: number;
  categoryKey: string;
  label: string;
  plannedEur: number;
  executedEur: number;
  cpvPrefix: string | null;
  budgetYear: number;
  sortOrder: number;
}

export interface MonitorBudgetLineRequest {
  categoryKey: string;
  label: string;
  plannedEur: number;
  cpvPrefix: string | null;
  budgetYear?: number;
  sortOrder?: number;
}

export interface MonitorSchedulerSettings {
  schedulerEnabled: boolean;
  sigmaEnabled: boolean;
  eopEnabled: boolean;
  scrapeEnabled: boolean;
  aiBatchEnabled: boolean;
  eopDays: number;
  eopMaxDays: number;
  aiBatchLimit: number;
}

export interface HealthAlert {
  level: "critical" | "warning" | "info";
  title: string;
  message: string;
}

export interface AdminOverview {
  users: UserStatistics;
  reports: ReportStatistics;
  activity: ActivityStats;
  subscriptions: Record<string, number>;
  strikes: Record<string, number>;
  content: Record<string, number>;
  healthAlerts: { alerts: HealthAlert[]; criticalCount: number; warningCount: number };
}

export interface ModerationInboxItem {
  entityType: string;
  entityId: number;
  entityLabel?: string | null;
  authorUsername?: string | null;
  authorId?: number | null;
  reportCount: number;
  status: string;
  lastReportDate: string | null;
  reportIds: number[];
  preview?: string | null;
}

export interface AdminEventRow {
  id: number;
  type: string;
  title: string;
  creatorName: string | null;
  createdAt: string | null;
  status: string | null;
  reportCount: number;
  editPath: string;
}

export interface AdminPodcastEpisode {
  id: number;
  title: string;
  description?: string | null;
  audioUrl: string;
  imageUrl?: string | null;
  publishDate?: string | null;
  durationSeconds?: number | null;
  episodeNumber?: number | null;
  listenCount?: number | null;
  formattedDuration?: string;
  isPublished?: boolean;
}

export interface StrikeStatistics {
  withOneStrike: number;
  withTwoStrikes: number;
  withThreeOrMore: number;
  autoBannedNow: number;
}

export interface ProfanityWord {
  id: number;
  word: string;
  active: boolean;
  createdAt?: string;
}
