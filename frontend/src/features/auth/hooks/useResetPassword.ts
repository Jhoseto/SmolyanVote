"use client";

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../api";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../schema";
import { errorMessage } from "@/shared/lib/errorMessage";

/** RHF + Zod reset-password form (ports v1 `/reset-password?token=`). */
export function useResetPassword(token: string) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const sub = form.watch(() => setServerError(null));
    return () => sub.unsubscribe();
  }, [form]);

  const submitValid: SubmitHandler<ResetPasswordFormValues> = async (values) => {
    const response = await authApi.resetPassword(token, values.password, values.confirmPassword);
    setSuccessMessage(response.message);
  };

  const submit = form.handleSubmit(submitValid);

  const onSubmit = async (event: React.BaseSyntheticEvent) => {
    setServerError(null);
    try {
      await submit(event);
    } catch (error) {
      setServerError(errorMessage(error, "Възникна грешка. Моля, опитайте отново."));
    }
  };

  return { form, onSubmit, serverError, successMessage };
}
