"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { createReferendumSchema, type CreateReferendumFormValues } from "../schema";
import { useCreateReferendum } from "./useCreateReferendum";

/** RHF + Zod, wrapped in its own hook so the `useForm()` call stays out of the component (React Compiler treats RHF's `watch()` as unmemoizable otherwise). */
export function useCreateReferendumForm() {
  const router = useRouter();
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const { mutate, isPending } = useCreateReferendum();
  const [images, setImages] = useState<File[]>([]);

  const form = useForm<CreateReferendumFormValues>({
    resolver: zodResolver(createReferendumSchema),
    defaultValues: { topic: "", description: "", location: "", options: ["", "", ""] },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!(await requireAuth("да създадеш референдум"))) return;

    mutate(
      { values, images },
      {
        onSuccess: (res) => {
          toast.success("Референдумът беше създаден успешно!");
          router.push(`/referendum/${res.id}`);
        },
        onError: (error) => toast.error(errorMessage(error, "Грешка при създаване на референдума.")),
      },
    );
  });

  return { form, onSubmit, isPending, images, setImages };
}
