import { apiClient } from "@/lib/api/client";
import type {
  ApiMessageResponse,
  EventCreatedResponse,
  EventsCatalogResponse,
  MultiPollDetail,
  ReferendumDetail,
  SimpleEventDetail,
} from "./types";
import type { CreateSimpleEventFormValues, CreateReferendumFormValues, CreateMultiPollFormValues } from "./schema";

function appendFileIfPresent(form: FormData, key: string, files: File[], index: number) {
  const file = files[index];
  if (file) form.append(key, file);
}

/**
 * Thin wrappers over `EventsController`. Hub list is a full catalog —
 * filter/sort/pagination live in `filterEventsCatalog`.
 */
export const eventsApi = {
  list: () => apiClient.get<EventsCatalogResponse>("/api/v1/events"),

  simpleEventDetail: (id: number) =>
    apiClient.get<SimpleEventDetail>(`/api/v1/events/simple/${id}`),

  referendumDetail: (id: number) =>
    apiClient.get<ReferendumDetail>(`/api/v1/events/referendum/${id}`),

  multiPollDetail: (id: number) =>
    apiClient.get<MultiPollDetail>(`/api/v1/events/multipoll/${id}`),

  createSimpleEvent: (values: CreateSimpleEventFormValues, images: File[]) => {
    const form = new FormData();
    form.append("title", values.title);
    form.append("description", values.description);
    form.append("location", values.location);
    form.append("positiveLabel", values.positiveLabel);
    form.append("negativeLabel", values.negativeLabel);
    form.append("neutralLabel", values.neutralLabel);
    appendFileIfPresent(form, "image1", images, 0);
    appendFileIfPresent(form, "image2", images, 1);
    appendFileIfPresent(form, "image3", images, 2);
    return apiClient.postForm<EventCreatedResponse>("/api/v1/events/simple", { body: form });
  },

  createReferendum: (values: CreateReferendumFormValues, images: File[]) => {
    const form = new FormData();
    form.append("topic", values.topic);
    form.append("description", values.description);
    form.append("location", values.location);
    values.options.filter((o) => o.trim().length > 0).forEach((option) => form.append("options", option));
    appendFileIfPresent(form, "image1", images, 0);
    appendFileIfPresent(form, "image2", images, 1);
    appendFileIfPresent(form, "image3", images, 2);
    return apiClient.postForm<EventCreatedResponse>("/api/v1/events/referendum", { body: form });
  },

  createMultiPoll: (values: CreateMultiPollFormValues, images: File[]) => {
    const form = new FormData();
    form.append("title", values.title);
    form.append("description", values.description);
    form.append("location", values.location);
    values.options.filter((o) => o.trim().length > 0).forEach((option) => form.append("options", option));
    appendFileIfPresent(form, "image1", images, 0);
    appendFileIfPresent(form, "image2", images, 1);
    appendFileIfPresent(form, "image3", images, 2);
    return apiClient.postForm<EventCreatedResponse>("/api/v1/events/multipoll", { body: form });
  },

  deleteEvent: (id: number) => apiClient.delete<ApiMessageResponse>(`/api/v1/events/${id}`),

  // ===== Admin inline edit (ADMIN only) =====

  updateSimpleEvent: (
    id: number,
    values: CreateSimpleEventFormValues,
    newImages: File[],
    deleteImageIds: number[],
  ) => {
    const form = new FormData();
    form.append("title", values.title);
    form.append("description", values.description);
    form.append("location", values.location);
    form.append("positiveLabel", values.positiveLabel);
    form.append("negativeLabel", values.negativeLabel);
    form.append("neutralLabel", values.neutralLabel);
    newImages.forEach((file) => form.append("newImages", file));
    deleteImageIds.forEach((imageId) => form.append("deleteImageIds", String(imageId)));
    return apiClient.putForm<SimpleEventDetail>(`/api/v1/events/simple/${id}`, { body: form });
  },

  updateReferendum: (
    id: number,
    values: CreateReferendumFormValues,
    newImages: File[],
    deleteImageIds: number[],
  ) => {
    const form = new FormData();
    form.append("topic", values.topic);
    form.append("description", values.description);
    form.append("location", values.location);
    values.options.filter((o) => o.trim().length > 0).forEach((option) => form.append("options", option));
    newImages.forEach((file) => form.append("newImages", file));
    deleteImageIds.forEach((imageId) => form.append("deleteImageIds", String(imageId)));
    return apiClient.putForm<ReferendumDetail>(`/api/v1/events/referendum/${id}`, { body: form });
  },

  updateMultiPoll: (
    id: number,
    values: CreateMultiPollFormValues,
    newImages: File[],
    deleteImageIds: number[],
  ) => {
    const form = new FormData();
    form.append("title", values.title);
    form.append("description", values.description);
    form.append("location", values.location);
    values.options.filter((o) => o.trim().length > 0).forEach((option) => form.append("options", option));
    newImages.forEach((file) => form.append("newImages", file));
    deleteImageIds.forEach((imageId) => form.append("deleteImageIds", String(imageId)));
    return apiClient.putForm<MultiPollDetail>(`/api/v1/events/multipoll/${id}`, { body: form });
  },
};
