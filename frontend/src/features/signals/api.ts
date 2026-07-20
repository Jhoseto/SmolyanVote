import { apiClient } from "@/lib/api/client";
import type {
  ApiMessageResponse,
  CreateSignalPayload,
  Signal,
  SignalReactionResponse,
  SignalsListParams,
  UpdateSignalPayload,
} from "./types";

function buildQuery(params: SignalsListParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("category", params.category);
  if (params.showExpired) query.set("showExpired", "true");
  if (params.sort) query.set("sort", params.sort);
  return query.toString();
}

function toFormData(payload: CreateSignalPayload | UpdateSignalPayload): FormData {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("description", payload.description);
  form.append("category", payload.category);
  form.append("expirationDays", String(payload.expirationDays));
  if ("latitude" in payload) {
    form.append("latitude", String(payload.latitude));
    form.append("longitude", String(payload.longitude));
  }
  if (payload.image) form.append("image", payload.image);
  return form;
}

/**
 * Thin wrappers over `SignalsController` — no business logic here
 * (filtering/validation lives in `SignalsService`, per-item shaping in the
 * controller's `SignalResponseDTO.from`). List returns a flat array (not a
 * page) — the map needs every matching signal at once for clustering, and
 * the list panel shares the same query (no infinite scroll for signals).
 */
export const signalsApi = {
  list: (params: SignalsListParams) => apiClient.get<Signal[]>(`/api/v1/signals?${buildQuery(params)}`),

  detail: (id: number) => apiClient.get<Signal>(`/api/v1/signals/${id}`),

  liked: () => apiClient.get<number[]>("/api/v1/signals/liked"),

  create: (payload: CreateSignalPayload) =>
    apiClient.postForm<Signal>("/api/v1/signals", { body: toFormData(payload) }),

  update: (id: number, payload: UpdateSignalPayload) =>
    apiClient.putForm<Signal>(`/api/v1/signals/${id}`, { body: toFormData(payload) }),

  remove: (id: number) => apiClient.delete<ApiMessageResponse>(`/api/v1/signals/${id}`),

  like: (id: number) => apiClient.post<SignalReactionResponse>(`/api/v1/signals/${id}/like`),
};
