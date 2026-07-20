"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { createPublicationSchema, type CreatePublicationFormValues } from "../schema";
import { useCreatePublication } from "./useCreatePublication";
import { useUploadPublicationImage } from "./useUploadPublicationImage";
import { useLinkPreview } from "./useLinkPreview";
import type { LinkMetadata } from "../types";

/** RHF + Zod kept out of the component (React Compiler treats `watch()` as unmemoizable otherwise — see `useCreateSimpleEventForm`). */
export function useCreatePublicationForm() {
  const toast = useToast();
  const requireAuth = useRequireAuth();
  const { mutateAsync: createPublication, isPending: isCreating } = useCreatePublication();
  const { mutateAsync: uploadImage, isPending: isUploadingImage } = useUploadPublicationImage();
  const linkPreview = useLinkPreview();

  const [expanded, setExpanded] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [emotion, setEmotion] = useState<{ emoji: string; text: string } | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const form = useForm<CreatePublicationFormValues>({
    resolver: zodResolver(createPublicationSchema),
    mode: "onChange",
    defaultValues: { content: "", category: undefined },
  });

  function reset() {
    form.reset({ content: "", category: undefined });
    setImage(null);
    setEmotion(null);
    setLinkUrl("");
    setLinkMetadata(null);
    setShowLinkInput(false);
    setExpanded(false);
  }

  async function fetchLinkPreview() {
    const url = linkUrl.trim();
    if (!url) return;
    try {
      const metadata = await linkPreview.mutateAsync(url);
      setLinkMetadata(metadata);
    } catch (error) {
      toast.error(errorMessage(error, "Не успяхме да заредим визуализация за този линк."));
    }
  }

  function removeLink() {
    setLinkUrl("");
    setLinkMetadata(null);
    setShowLinkInput(false);
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!(await requireAuth("да създадеш публикация"))) return;

    try {
      let imageUrl: string | undefined;
      if (image) {
        const uploaded = await uploadImage(image);
        imageUrl = uploaded.url;
      }

      const content = values.content.trim();
      await createPublication({
        title: content.slice(0, 100) || "Публикация",
        content,
        category: values.category,
        imageUrl,
        emotion: emotion?.emoji,
        emotionText: emotion?.text,
        linkUrl: linkMetadata ? linkMetadata.url : undefined,
        linkMetadata: linkMetadata ? JSON.stringify(linkMetadata) : undefined,
      });

      toast.success("Публикацията беше създадена успешно!");
      reset();
    } catch (error) {
      toast.error(errorMessage(error, "Грешка при създаване на публикацията."));
    }
  });

  return {
    form,
    onSubmit,
    isPending: isCreating || isUploadingImage,
    expanded,
    setExpanded,
    image,
    setImage,
    emotion,
    setEmotion,
    linkUrl,
    setLinkUrl,
    linkMetadata,
    showLinkInput,
    setShowLinkInput,
    fetchLinkPreview,
    removeLink,
    isFetchingLinkPreview: linkPreview.isPending,
    cancel: reset,
  };
}
