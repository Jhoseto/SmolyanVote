"use client";

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/shared/lib/authContext";
import { authApi } from "../api";
import { loginSchema, type LoginFormValues } from "../schema";
import { errorMessage } from "@/shared/lib/errorMessage";
import { notifyModerationFromApiBody } from "@/shared/lib/moderationStore";
import { ApiError } from "@/lib/api/client";
import type { LoginUserSummary } from "../types";

/**
 * Shared login logic for both the standalone `/login` page and the inline
 * `LoginGateModal` variant — `onSuccess` lets each caller decide what
 * happens next (redirect vs. resolving the pending gate promise).
 */
export function useLogin(onSuccess?: (user: LoginUserSummary) => void) {
  const { setSession } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  useEffect(() => {
    const sub = form.watch(() => setServerError(null));
    return () => sub.unsubscribe();
  }, [form]);

  // Left un-caught here on purpose — RHF's `handleSubmit` needs the throw to
  // mark `isSubmitSuccessful: false`. The `onSubmit` wrapper below reports it.
  const submitValid: SubmitHandler<LoginFormValues> = async (values) => {
    const response = await authApi.login(values.email, values.password);
    setSession(response.accessToken, response.refreshToken, values.rememberMe);
    onSuccess?.(response.user);
  };

  const submit = form.handleSubmit(submitValid);

  const onSubmit = async (event: React.BaseSyntheticEvent) => {
    setServerError(null);
    try {
      await submit(event);
    } catch (error) {
      if (error instanceof ApiError) {
        notifyModerationFromApiBody(error.body);
        if (error.status === 403) {
          setServerError(null);
          return;
        }
      }
      setServerError(errorMessage(error, "Грешка при вход. Моля, опитайте отново."));
    }
  };

  return { form, onSubmit, serverError };
}
