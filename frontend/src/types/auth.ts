/**
 * Current-user shape shared across layers (`shared/lib/authContext`,
 * `features/auth`). Lives in `types/` (not `features/auth/types.ts`) so
 * `shared/` can reference it without violating the shared-no-features
 * boundary rule.
 */
export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  imageUrl: string | null;
  bio: string | null;
  role: "USER" | "ADMIN";
}
