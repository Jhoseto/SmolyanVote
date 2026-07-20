"use client";

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../api";
import { registerSchema, type RegisterFormValues } from "../schema";
import { errorMessage } from "@/shared/lib/errorMessage";

function readHoneypot(event?: { target?: EventTarget | null }): string {
  const formEl = event?.target;
  if (!(formEl instanceof HTMLFormElement)) return "";
  const input = formEl.elements.namedItem("middleName");
  return input instanceof HTMLInputElement ? input.value : "";
}

/** RHF + Zod register form (ports v1 `/user/registration` — honeypot + timestamp anti-spam, no reload). */
export function useRegister() {
  const [formRenderedAt] = useState(() => Date.now());
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { username: "", email: "", password: "", confirmPassword: "", acceptTerms: false },
  });

  useEffect(() => {
    const sub = form.watch(() => setServerError(null));
    return () => sub.unsubscribe();
  }, [form]);

  const submitValid: SubmitHandler<RegisterFormValues> = async (values, event) => {
    const response = await authApi.register({
      username: values.username,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      middleName: readHoneypot(event),
      formRenderedAt,
    });
    // v1 parity: no auto-login — account stays PENDING_ACTIVATION until the
    // confirmation email link is clicked.
    setSuccessMessage(response.message);
    form.reset();
  };

  const submit = form.handleSubmit(submitValid);

  const onSubmit = async (event: React.BaseSyntheticEvent) => {
    setServerError(null);
    try {
      await submit(event);
    } catch (error) {
      setServerError(errorMessage(error, "Грешка при регистрацията. Моля, опитайте отново."));
    }
  };

  return { form, onSubmit, serverError, successMessage };
}
