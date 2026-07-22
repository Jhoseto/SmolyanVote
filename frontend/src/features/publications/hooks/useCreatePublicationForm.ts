"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/shared/hooks/useToast";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { createPublicationSchema, type CreatePublicationFormValues } from "../schema";
import {
  clearPublicationDraft,
  loadPublicationDraft,
  savePublicationDraft,
} from "../lib/publicationDraft";
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
  const draftHydrated = useRef(false);

  const [expanded, setExpanded] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [emotion, setEmotion] = useState<{ emoji: string; text: string } | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const form = useForm<CreatePublicationFormValues>({
    resolver: zodResolver(createPublicationSchema),
    mode: "onChange",
    defaultValues: { content: "", category: undefined },
  });

  const content = form.watch("content");
  const category = form.watch("category");

  useEffect(() => {
    if (draftHydrated.current) return;
    draftHydrated.current = true;
    const draft = loadPublicationDraft();
    if (!draft?.content) return;
    form.reset({ content: draft.content, category: draft.category });
    setEmotion(draft.emotion ?? null);
    setLinkUrl(draft.linkUrl ?? "");
    setShowLinkInput(!!draft.linkUrl);
    setExpanded(true);
    setHasDraft(true);
  }, [form]);

  useEffect(() => {
    if (!expanded || !draftHydrated.current) return;
    const trimmed = content.trim();
    if (!trimmed && !emotion && !linkUrl.trim()) {
      clearPublicationDraft();
      setHasDraft(false);
      return;
    }
    savePublicationDraft({
      content,
      category,
      emotion,
      linkUrl: linkUrl.trim() || undefined,
    });
    setHasDraft(true);
  }, [expanded, content, category, emotion, linkUrl]);

  function reset() {
    form.reset({ content: "", category: undefined });
    setImage(null);
    setEmotion(null);
    setLinkUrl("");
    setLinkMetadata(null);
    setShowLinkInput(false);
    setExpanded(false);
    clearPublicationDraft();
    setHasDraft(false);
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

      const nextContent = values.content.trim();
      await createPublication({
        title: nextContent.slice(0, 100) || "Публикация",
        content: nextContent,
        category: values.category,
        status: "PUBLISHED",
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
    hasDraft,
  };
}
