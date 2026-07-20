import { apiClient } from "@/lib/api/client";
import type { ContactFormValues } from "./schema";

interface ContactResponse {
  success: boolean;
  message: string;
  fieldErrors: string[];
}

interface ContactSubmitPayload extends ContactFormValues {
  /** Honeypot — must stay empty; bots tend to fill every field. */
  middleName: string;
  /** Client timestamp (ms) the form was rendered — anti-spam minimum delay. */
  formRenderedAt: number;
}

/** Thin wrapper over `POST /api/v1/contact` — anonymous, session-less. */
export const contactApi = {
  submit: (payload: ContactSubmitPayload) =>
    apiClient.post<ContactResponse>("/api/v1/contact", { body: payload, anonymous: true }),
};
