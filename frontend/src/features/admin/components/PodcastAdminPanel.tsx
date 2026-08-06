"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ErrorState, Skeleton } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { errorMessage } from "@/shared/lib/errorMessage";
import { UploadEpisodeModal } from "@/features/podcast/components/UploadEpisodeModal";
import { parseDurationInput } from "@/features/podcast/lib/parseDurationInput";
import { adminApi } from "../api";
import type { AdminPodcastEpisode } from "../types";

export function PodcastAdminPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPodcastEpisode | null>(null);

  const episodesQ = useQuery({
    queryKey: ["admin", "podcast-episodes"],
    queryFn: () => adminApi.listPodcastEpisodesAdmin(),
    enabled,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminApi.deletePodcastEpisode(id),
    onSuccess: () => {
      toast.success("Епизодът е изтрит");
      queryClient.invalidateQueries({ queryKey: ["admin", "podcast-episodes"] });
    },
    onError: (e) => toast.error(errorMessage(e, "Изтриването не успя")),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, form }: { id: number; form: FormData }) =>
      adminApi.updatePodcastEpisode(id, form),
    onSuccess: () => {
      toast.success("Епизодът е обновен");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "podcast-episodes"] });
      queryClient.invalidateQueries({ queryKey: ["podcast", "episodes"] });
    },
    onError: (e) => toast.error(errorMessage(e, "Изтриването не успя")),
  });

  if (episodesQ.isLoading) return <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />;
  if (episodesQ.isError) {
    return <ErrorState description="Епизодите не се заредиха" onRetry={() => episodesQ.refetch()} />;
  }

  const episodes = episodesQ.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm text-white"
        >
          Качи епизод
        </button>
      </div>

      <UploadEpisodeModal
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) queryClient.invalidateQueries({ queryKey: ["admin", "podcast-episodes"] });
        }}
      />

      {editing && (
        <EditEpisodeForm
          episode={editing}
          loading={updateMut.isPending}
          onCancel={() => setEditing(null)}
          onSave={(form) => updateMut.mutate({ id: editing.id, form })}
        />
      )}

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/60">
        <table className="min-w-full text-sm">
          <thead className="bg-[color:var(--color-surface-muted)]">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Заглавие</th>
              <th className="px-3 py-2 text-left">Статус</th>
              <th className="px-3 py-2 text-left">Слушания</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {episodes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[color:var(--color-text-muted)]">
                  Няма качени епизоди. Натисни „Качи епизод“, за да добавиш първия.
                </td>
              </tr>
            ) : (
              episodes.map((ep) => (
              <tr key={ep.id} className="border-t border-border-default/40">
                <td className="px-3 py-2">{ep.episodeNumber ?? ep.id}</td>
                <td className="px-3 py-2">{ep.title}</td>
                <td className="px-3 py-2">{ep.isPublished ? "Публикуван" : "Чернова"}</td>
                <td className="px-3 py-2">{ep.listenCount ?? 0}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    className="mr-2 text-primary"
                    onClick={() => setEditing(ep)}
                  >
                    Редакция
                  </button>
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Изтриване на епизод",
                        description: `Изтрий „${ep.title}"?`,
                        confirmText: "Изтрий",
                        destructive: true,
                      });
                      if (ok) deleteMut.mutate(ep.id);
                    }}
                  >
                    Изтрий
                  </button>
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditEpisodeForm({
  episode,
  loading,
  onCancel,
  onSave,
}: {
  episode: AdminPodcastEpisode;
  loading: boolean;
  onCancel: () => void;
  onSave: (form: FormData) => void;
}) {
  const [title, setTitle] = useState(episode.title);
  const [description, setDescription] = useState(episode.description ?? "");
  const [audioUrl, setAudioUrl] = useState(episode.audioUrl ?? "");
  const [durationInput, setDurationInput] = useState(
    episode.durationSeconds != null
      ? `${Math.floor(episode.durationSeconds / 60)}:${String(episode.durationSeconds % 60).padStart(2, "0")}`
      : "",
  );
  const [published, setPublished] = useState(episode.isPublished ?? true);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-default/60 p-4">
      <h3 className="mb-3 font-semibold">Редакция: {episode.title}</h3>
      <div className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
          placeholder="Заглавие"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
          rows={3}
          placeholder="Описание"
        />
        <input
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
          placeholder="https://ia902807.us.archive.org/…/episode.mp3"
        />
        <input
          value={durationInput}
          onChange={(e) => setDurationInput(e.target.value)}
          className="rounded-[var(--radius-md)] border px-3 py-2 text-sm"
          placeholder="Времетраене (mm:ss)"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Публикуван
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              const form = new FormData();
              form.append("title", title);
              form.append("description", description);
              form.append("audioUrl", audioUrl.trim());
              const durationSeconds = parseDurationInput(durationInput);
              if (durationSeconds != null) {
                form.append("durationSeconds", String(durationSeconds));
              }
              form.append("isPublished", String(published));
              onSave(form);
            }}
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm text-white"
          >
            Запази
          </button>
          <button type="button" onClick={onCancel} className="rounded-[var(--radius-md)] border px-4 py-2 text-sm">
            Отказ
          </button>
        </div>
      </div>
    </div>
  );
}
