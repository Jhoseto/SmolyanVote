import { apiClient } from "@/lib/api/client";
import type {
  ApiMessageResponse,
  CreateSignalPayload,
  ModerateSignalPayload,
  Signal,
  SignalReactionResponse,
  UpdateSignalPayload,
} from "./types";

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
  if ("removeImage" in payload && payload.removeImage) {
    form.append("removeImage", "true");
  }
  if (payload.image) form.append("image", payload.image);
  return form;
}

function toModerateForm(payload: ModerateSignalPayload): FormData {
  const form = new FormData();
  if (payload.adminNotes != null) form.append("adminNotes", payload.adminNotes);
  form.append("markResolved", String(payload.markResolved));
  return form;
}

/**
 * Thin wrappers over `SignalsController`. The map page loads `/dataset` once;
 * filtering/sorting/priority tiers are client-side.
 */
export const signalsApi = {
  dataset: () => apiClient.get<Signal[]>("/api/v1/signals/dataset"),

  detail: (id: number) => apiClient.get<Signal>(`/api/v1/signals/${id}`),

  recordView: (id: number) =>
    apiClient.post<{ viewsCount: number }>(`/api/v1/signals/${id}/view`, { anonymous: true }),

  create: (payload: CreateSignalPayload) =>
    apiClient.postForm<Signal>("/api/v1/signals", { body: toFormData(payload) }),

  update: (id: number, payload: UpdateSignalPayload) =>
    apiClient.putForm<Signal>(`/api/v1/signals/${id}`, { body: toFormData(payload) }),

  moderate: (id: number, payload: ModerateSignalPayload) =>
    apiClient.putForm<Signal>(`/api/v1/signals/${id}/moderate`, { body: toModerateForm(payload) }),

  remove: (id: number) => apiClient.delete<ApiMessageResponse>(`/api/v1/signals/${id}`),

  boost: (id: number) => apiClient.post<SignalReactionResponse>(`/api/v1/signals/${id}/boost`),

  subscribe: (id: number) => apiClient.post<Signal>(`/api/v1/signals/${id}/subscribe`),

  unsubscribe: (id: number) => apiClient.delete<Signal>(`/api/v1/signals/${id}/subscribe`),

  reportResolved: (id: number) => apiClient.post<Signal>(`/api/v1/signals/${id}/report-resolved`),
};

export const SIGNALS_DATASET_QUERY_KEY = ["signals", "dataset"] as const;
