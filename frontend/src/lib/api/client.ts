import { resolveApiUrl } from "@/config/env";
import { tokenStore } from "./tokenStore";

/** Typed API error surfaced to callers (explicit over silent fallbacks). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Attach an Idempotency-Key header (required for vote writes). */
  idempotencyKey?: string;
  /** Skip Authorization header + refresh (public endpoints). */
  anonymous?: boolean;
}

interface FormRequestOptions extends Omit<RequestOptions, "body"> {
  /** Multipart body (image uploads) — the browser sets the boundary, never JSON-encoded. */
  body: FormData;
}

const REFRESH_PATH = "/api/mobile/auth/refresh";

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  // De-duplicate concurrent refreshes into a single in-flight request.
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(resolveApiUrl(REFRESH_PATH), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) {
        tokenStore.clear();
        return false;
      }
      const data = (await res.json()) as {
        accessToken: string;
        refreshToken?: string;
      };
      tokenStore.set(data.accessToken, data.refreshToken, tokenStore.isPersistent());
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown;
  let code = `HTTP_${res.status}`;
  let message = res.statusText || "Request failed";
  try {
    body = await res.json();
    if (body && typeof body === "object") {
      const b = body as Record<string, unknown>;
      if (typeof b.code === "string") code = b.code;
      // Mobile auth endpoints (`/api/mobile/auth/**`) use `{ error: "..." }`
      // instead of `{ message: "..." }` — fall back so callers get a usable message either way.
      if (typeof b.message === "string") message = b.message;
      else if (typeof b.error === "string") message = b.error;
    }
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, code, message, body);
}

async function doFetch(
  path: string,
  options: RequestOptions,
  retryOn401: boolean,
): Promise<Response> {
  const { body, idempotencyKey, anonymous, headers, ...rest } = options;
  const isFormData = body instanceof FormData;

  const finalHeaders = new Headers(headers);
  // FormData: leave Content-Type unset so fetch adds the multipart boundary itself.
  if (body !== undefined && !isFormData && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (idempotencyKey) finalHeaders.set("Idempotency-Key", idempotencyKey);
  if (!anonymous) {
    const access = tokenStore.getAccess();
    if (access) finalHeaders.set("Authorization", `Bearer ${access}`);
  }

  const url = resolveApiUrl(path);

  const res = await fetch(url, {
    ...rest,
    headers: finalHeaders,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && retryOn401 && !anonymous) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return doFetch(path, options, false);
  }

  return res;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await doFetch(path, options, true);

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(
      res.status,
      "INVALID_RESPONSE",
      "Сървърът върна неочакван (не-JSON) отговор.",
    );
  }
  return (await res.json()) as T;
}

/** Thin typed fetch wrapper: JWT refresh, idempotency, typed errors. */
export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST" }),
  put: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT" }),
  patch: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH" }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
  /** Multipart POST (image uploads) — see `postForm` vs `post` split so JSON callers never touch `FormData` typing. */
  postForm: <T>(path: string, options: FormRequestOptions) =>
    request<T>(path, { ...options, method: "POST" }),
  /** Multipart PUT (admin inline edit — text fields + new images + existing-image deletion). */
  putForm: <T>(path: string, options: FormRequestOptions) =>
    request<T>(path, { ...options, method: "PUT" }),
};
