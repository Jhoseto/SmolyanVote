"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { createSimpleEventSchema, type CreateSimpleEventFormValues } from "../schema";
import { useCreateSimpleEvent } from "./useCreateSimpleEvent";

/** RHF + Zod, wrapped in its own hook so the `useForm()` call stays out of the component (React Compiler treats RHF's `watch()` as unmemoizable otherwise). */
export function useCreateSimpleEventForm() {
  const router = useRouter();
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const { mutate, isPending } = useCreateSimpleEvent();
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<CreateSimpleEventFormValues>({
    resolver: zodResolver(createSimpleEventSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      positiveLabel: "ЗА",
      negativeLabel: "ПРОТИВ",
      neutralLabel: "Без мнение",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!(await requireAuth("да създадеш събитие"))) return;

    mutate(
      { values, images },
      {
        onSuccess: (res) => {
          toast.success("Събитието беше създадено успешно!");
          router.push(`/event/${res.id}`);
        },
        onError: (error) => toast.error(errorMessage(error, "Грешка при създаване на събитието.")),
      },
    );
  });

  return { form, onSubmit, isPending, images, setImages };
}
