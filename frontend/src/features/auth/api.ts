import { resolveOAuthStartUrl } from "@/config/env";
import { apiClient } from "@/lib/api/client";
import type { CurrentUser } from "@/types/auth";
import type { AuthMessageResponse, LoginResponse, OAuthProvider, RegisterResponse } from "./types";

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  /** Honeypot — must stay empty; bots tend to fill every field. */
  middleName: string;
  /** Client timestamp (ms) the form was rendered — anti-spam minimum delay (5s). */
  formRenderedAt: number;
}

/**
 * Thin wrappers over the auth endpoints. Login/refresh/logout reuse the
 * existing mobile JWT flow (`/api/mobile/auth/**`); register/forgot/reset/
 * confirm/me are the new thin JSON `/api/v1/**` endpoints
 * (`AuthController`, `UsersController`) — same v1 services, no
 * new business logic here.
 */
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>("/api/mobile/auth/login", {
      body: { email, password },
      anonymous: true,
    }),

  register: (payload: RegisterPayload) =>
    apiClient.post<RegisterResponse>("/api/v1/auth/register", { body: payload, anonymous: true }),

  forgotPassword: (email: string) =>
    apiClient.post<AuthMessageResponse>("/api/v1/auth/forgot-password", {
      body: { email },
      anonymous: true,
    }),

  resetPassword: (token: string, password: string, confirmPassword: string) =>
    apiClient.post<AuthMessageResponse>("/api/v1/auth/reset-password", {
      body: { token, password, confirmPassword },
      anonymous: true,
    }),

  confirmEmail: (userId: number, code: string) =>
    apiClient.get<AuthMessageResponse>(
      `/api/v1/auth/confirm?userId=${userId}&code=${encodeURIComponent(code)}`,
      { anonymous: true },
    ),

  me: () => apiClient.get<CurrentUser>("/api/v1/users/me"),

  logout: () =>
    apiClient.post<{ success: boolean; message: string }>("/api/mobile/auth/logout"),

  /** Full-page navigation — hits Spring directly (session cookies for OAuth). */
  oauthStartUrl: (provider: OAuthProvider) => resolveOAuthStartUrl(provider),
};
