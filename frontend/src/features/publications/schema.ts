import { z } from "zod";

/** Mirrors `PublicationRequestDTO` (`@Size(min=1,max=10000)` content; category required by the composer, same as legacy `validateForm()`). */
export const createPublicationSchema = z.object({
  content: z.string().trim().min(1, "Съдържанието е задължително.").max(10000, "До 10000 символа."),
  category: z.enum(["NEWS", "INFRASTRUCTURE", "MUNICIPAL", "INITIATIVES", "CULTURE", "OTHER"], {
    message: "Изберете категория.",
  }),
});
export type CreatePublicationFormValues = z.infer<typeof createPublicationSchema>;

export const MAX_CONTENT_LENGTH = 10000;
