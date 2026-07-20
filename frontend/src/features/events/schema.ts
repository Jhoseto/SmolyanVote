import { z } from "zod";

/** Mirrors `CreateEventView` validation (`@Size(max=100)` title, `@Size(max=1000)` description) + the required vote labels (`EventsController#createSimpleEvent`). */
export const createSimpleEventSchema = z.object({
  title: z.string().trim().min(1, "Заглавието е задължително.").max(100, "До 100 символа."),
  description: z.string().trim().min(1, "Описанието е задължително.").max(1000, "До 1000 символа."),
  location: z.string().min(1, "Изберете локация."),
  positiveLabel: z.string().trim().min(1, "Задължително.").max(80, "До 80 символа."),
  negativeLabel: z.string().trim().min(1, "Задължително.").max(80, "До 80 символа."),
  neutralLabel: z.string().trim().min(1, "Задължително.").max(80, "До 80 символа."),
});
export type CreateSimpleEventFormValues = z.infer<typeof createSimpleEventSchema>;

const optionsSchema = z
  .array(z.string().trim().max(100, "До 100 символа."))
  .refine((options) => options.filter((o) => o.length > 0).length >= 2, {
    message: "Въведете поне 2 валидни опции.",
  });

/** Mirrors `ReferendumController#handleCreateReferendum` (topic/description maxlength, 2-10 options). */
export const createReferendumSchema = z.object({
  topic: z.string().trim().min(1, "Темата е задължителна.").max(150, "До 150 символа."),
  description: z.string().trim().min(1, "Описанието е задължително.").max(1000, "До 1000 символа."),
  location: z.string().min(1, "Изберете локация."),
  options: optionsSchema,
});
export type CreateReferendumFormValues = z.infer<typeof createReferendumSchema>;

/** Mirrors `MultiPollController#createMultiPoll` (title/description maxlength, 2-10 options). */
export const createMultiPollSchema = z.object({
  title: z.string().trim().min(1, "Заглавието е задължително.").max(150, "До 150 символа."),
  description: z.string().trim().min(1, "Описанието е задължително.").max(1000, "До 1000 символа."),
  location: z.string().min(1, "Изберете локация."),
  options: optionsSchema,
});
export type CreateMultiPollFormValues = z.infer<typeof createMultiPollSchema>;

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;
export const MAX_IMAGES = 3;
