import { z } from "zod";
import { SIGNAL_CATEGORIES } from "./data/categories";
import type { SignalCategory } from "./types";

const CATEGORY_VALUES = SIGNAL_CATEGORIES.map((c) => c.value) as [SignalCategory, ...SignalCategory[]];

/** Mirrors `SignalsEntity`/legacy `validateSignalInput` (title 5-200, description 10-2000). */
export const signalFormSchema = z.object({
  title: z.string().trim().min(5, "Заглавието трябва да е поне 5 символа.").max(200, "До 200 символа."),
  description: z.string().trim().min(10, "Описанието трябва да е поне 10 символа.").max(2000, "До 2000 символа."),
  category: z.enum(CATEGORY_VALUES, { message: "Изберете категория." }),
});
export type SignalFormValues = z.infer<typeof signalFormSchema>;

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 2000;
