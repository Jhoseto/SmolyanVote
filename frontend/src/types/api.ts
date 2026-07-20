/**
 * Shared API DTO shapes for /api/v1 endpoints. Feature-specific
 * request/response types live in each feature's own `types.ts`;
 * only cross-feature contracts belong here.
 */

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  timestamp?: string;
}
