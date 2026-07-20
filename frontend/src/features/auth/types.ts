/** Mirrors backend `SVUserMinimalDTO`, embedded in the mobile login/oauth response. */
export interface LoginUserSummary {
  id: number;
  username: string;
  email: string;
  fullName: string;
  imageUrl: string | null;
  isOnline: boolean;
  lastSeen: string | null;
  bio: string | null;
}

/** Mirrors backend `MobileLoginResponse` (`POST /api/mobile/auth/login|oauth`). */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: LoginUserSummary;
}

/** Mirrors backend `RegisterResponse` (`POST /api/v1/auth/register`). */
export interface RegisterResponse {
  success: boolean;
  message: string;
  fieldErrors: string[];
}

/** Mirrors backend `AuthMessageResponse` (forgot/reset/confirm). */
export interface AuthMessageResponse {
  success: boolean;
  message: string;
  /** Present only on Spring `dev` profile — localhost mail links are often blocked. */
  devResetLink?: string | null;
}

export type OAuthProvider = "google" | "facebook";
