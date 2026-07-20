import { ApiError } from "@/lib/api/client";

/** `ApiError.message` is already resolved from `{message}` or `{error}` (see `client.ts`). */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  return fallback;
}
