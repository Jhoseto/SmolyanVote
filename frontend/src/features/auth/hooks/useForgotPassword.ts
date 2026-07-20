"use client";

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../api";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schema";
import { errorMessage } from "@/shared/lib/errorMessage";

/** RHF + Zod forgot-password form (ports v1 `/forgotten_password` — always a generic success message). */
export function useForgotPassword() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { email: "" },
  });

  useEffect(() => {
    const sub = form.watch(() => setServerError(null));
    return () => sub.unsubscribe();
  }, [form]);

  const submitValid: SubmitHandler<ForgotPasswordFormValues> = async (values) => {
    const response = await authApi.forgotPassword(values.email);
    setSuccessMessage(response.message);
    setDevResetLink(response.devResetLink ?? null);
  };

  const submit = form.handleSubmit(submitValid);

  const onSubmit = async (event: React.BaseSyntheticEvent) => {
    setServerError(null);
    try {
      await submit(event);
    } catch (error) {
      setServerError(errorMessage(error, "Грешка при изпращане. Моля, опитайте отново."));
    }
  };

  return { form, onSubmit, serverError, successMessage, devResetLink };
}
