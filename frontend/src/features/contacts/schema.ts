import { z } from "zod";

/** Mirrors backend `ContactRequest` validation (`ContactController`). */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Името трябва да е между 2 и 50 символа")
    .max(50, "Името трябва да е между 2 и 50 символа"),
  email: z.string().trim().min(1, "Имейлът е задължителен").email("Моля, въведете валиден имейл адрес"),
  subject: z
    .string()
    .trim()
    .min(3, "Темата трябва да е между 3 и 100 символа")
    .max(100, "Темата трябва да е между 3 и 100 символа"),
  message: z
    .string()
    .trim()
    .min(10, "Съобщението трябва да е между 10 и 1000 символа")
    .max(1000, "Съобщението трябва да е между 10 и 1000 символа"),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
