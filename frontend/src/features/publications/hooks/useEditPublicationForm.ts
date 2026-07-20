"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { errorMessage } from "@/shared/lib/errorMessage";
import { createPublicationSchema, type CreatePublicationFormValues } from "../schema";
import { useUpdatePublication } from "./useUpdatePublication";
import { useUploadPublicationImage } from "./useUploadPublicationImage";
import { useLinkPreview } from "./useLinkPreview";
import { parseLinkMetadata } from "../lib/linkMetadata";
import type { LinkMetadata, Publication } from "../types";

/**
 * Mirrors `useCreatePublicationForm` — same fields/validation, prefilled from
 * an existing `Publication`. Image is replace-only (upload a new file to swap
 * it); leaving it empty keeps the current one, matching a backend limitation
 * in `PublicationServiceImpl#update` (can't clear `imageUrl` via edit either).
 */
export function useEditPublicationForm(publication: Publication, onSaved: () => void) {
  const toast = useToast();
  const { mutateAsync: updatePublication, isPending: isUpdating } = useUpdatePublication();
  const { mutateAsync: uploadImage, isPending: isUploadingImage } = useUploadPublicationImage();
  const linkPreview = useLinkPreview();

  const [newImage, setNewImage] = useState<File | null>(null);
  const [emotion, setEmotion] = useState<{ emoji: string; text: string } | null>(
    publication.emotion ? { emoji: publication.emotion, text: publication.emotionText ?? "" } : null,
  );
  const [linkUrl, setLinkUrl] = useState(publication.linkUrl ?? "");
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(parseLinkMetadata(publication.linkMetadata));
  const [showLinkInput, setShowLinkInput] = useState(!!publication.linkUrl);

  const form = useForm<CreatePublicationFormValues>({
    resolver: zodResolver(createPublicationSchema),
    mode: "onChange",
    defaultValues: { content: publication.content, category: publication.category },
  });

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
    try {
      let imageUrl: string | undefined;
      if (newImage) {
        const uploaded = await uploadImage(newImage);
        imageUrl = uploaded.url;
      }

      const content = values.content.trim();
      await updatePublication({
        id: publication.id,
        payload: {
          title: content.slice(0, 100) || "Публикация",
          content,
          category: values.category,
          imageUrl,
          emotion: emotion?.emoji,
          emotionText: emotion?.text,
          linkUrl: linkMetadata ? linkMetadata.url : undefined,
          linkMetadata: linkMetadata ? JSON.stringify(linkMetadata) : undefined,
        },
      });

      toast.success("Публикацията беше обновена успешно!");
      onSaved();
    } catch (error) {
      toast.error(errorMessage(error, "Грешка при обновяване на публикацията."));
    }
  });

  return {
    form,
    onSubmit,
    isPending: isUpdating || isUploadingImage,
    newImage,
    setNewImage,
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
  };
}
