/** Mirrors backend `ReportableEntityType` enum names (verbatim in the URL path). */
export type ReportableEntityType =
  | "PUBLICATION"
  | "SIMPLE_EVENT"
  | "REFERENDUM"
  | "SIGNAL"
  | "COMMENT"
  | "MULTI_POLL"
  | "USER";

/** Mirrors backend `ReportReasonEnum` enum names. */
export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE_SPEECH"
  | "MISINFORMATION"
  | "INAPPROPRIATE"
  | "COPYRIGHT"
  | "OTHER";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: "Спам",
  HARASSMENT: "Тормоз или заплахи",
  HATE_SPEECH: "Език на омразата",
  MISINFORMATION: "Дезинформация",
  INAPPROPRIATE: "Неподходящо съдържание",
  COPYRIGHT: "Нарушение на авторски права",
  OTHER: "Друго",
};

export interface CreateReportResponse {
  success: boolean;
  message: string;
  entityType: string;
  entityId: number;
}
