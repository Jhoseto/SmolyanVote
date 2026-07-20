import { z } from "zod";

/** Mirrors backend `MobileLoginRequest` validation. */
export const loginSchema = z.object({
  email: z.string().trim().min(1, "Имейлът е задължителен").email("Моля, въведете валиден имейл адрес"),
  password: z.string().min(1, "Паролата е задължителна"),
  rememberMe: z.boolean(),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Mirrors backend `RegisterRequest` validation (`AuthController`) —
 * username 5-20 chars, password ≥6 chars + 1 uppercase + 1 digit (v1 bug
 * fixed: message always claimed 6 chars minimum, backend regex didn't
 * enforce it; both are fixed together here and in `RegisterRequest`).
 */
export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(5, "Невалидно потребителско име! Въведете име с минимум 5 и максимум 20 символа.")
      .max(20, "Невалидно потребителско име! Въведете име с минимум 5 и максимум 20 символа."),
    email: z.string().trim().min(1, "Имейлът е задължителен").email("Невалиден формат за Емейл!"),
    password: z
      .string()
      .min(6, "Паролата трябва да съдържа поне 6 символа на латиница, една голяма буква и поне две цифри")
      .regex(
        /^(?=.*[A-Z])(?=.*\d).+$/,
        "Паролата трябва да съдържа поне 6 символа на латиница, една голяма буква и поне две цифри",
      ),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v, {
      message: "Трябва да приемете условията за ползване",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролите не съвпадат",
    path: ["confirmPassword"],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Имейлът е задължителен").email("Моля, въведете валиден имейл адрес"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Паролата трябва да бъде поне 6 символа"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролите не съвпадат",
    path: ["confirmPassword"],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
