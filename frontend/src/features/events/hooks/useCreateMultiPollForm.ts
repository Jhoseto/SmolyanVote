"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { createMultiPollSchema, type CreateMultiPollFormValues } from "../schema";
import { useCreateMultiPoll } from "./useCreateMultiPoll";

/** RHF + Zod, wrapped in its own hook so the `useForm()` call stays out of the component (React Compiler treats RHF's `watch()` as unmemoizable otherwise). */
export function useCreateMultiPollForm() {
  const router = useRouter();
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const { mutate, isPending } = useCreateMultiPoll();
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<CreateMultiPollFormValues>({
    resolver: zodResolver(createMultiPollSchema),
    defaultValues: { title: "", description: "", location: "", options: ["", ""] },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!(await requireAuth("да създадеш анкета"))) return;

    mutate(
      { values, images },
      {
        onSuccess: (res) => {
          toast.success("Анкетата беше създадена успешно!");
          router.push(`/multipoll/${res.id}`);
        },
        onError: (error) => toast.error(errorMessage(error, "Грешка при създаване на анкетата.")),
      },
    );
  });

  return { form, onSubmit, isPending, images, setImages };
}
