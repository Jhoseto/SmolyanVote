"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/shared/hooks/useToast";
import { contactApi } from "../api";
import { contactFormSchema, type ContactFormValues } from "../schema";

function readHoneypot(event?: { target?: EventTarget | null }): string {
  const formEl = event?.target;
  if (!(formEl instanceof HTMLFormElement)) return "";
  const input = formEl.elements.namedItem("middleName");
  return input instanceof HTMLInputElement ? input.value : "";
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError && error.body && typeof error.body === "object" && "message" in error.body) {
    return String((error.body as { message?: unknown }).message);
  }
  return "Грешка при изпращане на съобщението. Моля, опитайте отново.";
}

/** RHF + Zod contact form (ports v1 `/contact` — honeypot + timestamp anti-spam, no reload). */
export function useContactForm(options?: { onSuccess?: () => void }) {
  // Lazy initializer keeps `Date.now()` out of the render body proper. Stays
  // fixed for the hook's lifetime — a later submit only ever measures *more*
  // elapsed time against it, so the "too fast" bot heuristic stays valid.
  const [formRenderedAt] = useState(() => Date.now());

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  // Left un-caught here on purpose — RHF's `handleSubmit` needs the throw to
  // mark `isSubmitSuccessful: false`. The wrapper below is what actually
  // reports the error to the user.
  const submitValid: SubmitHandler<ContactFormValues> = async (values, event) => {
    const response = await contactApi.submit({
      ...values,
      middleName: readHoneypot(event),
      formRenderedAt,
    });
    toast.success(response.message);
    form.reset();
    options?.onSuccess?.();
  };

  const submit = form.handleSubmit(submitValid);

  const onSubmit = async (event: React.BaseSyntheticEvent) => {
    try {
      await submit(event);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return { form, onSubmit };
}
