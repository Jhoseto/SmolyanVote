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
  | "events"
  | "moderation"
  | "activity"
  | "subscriptions";

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
