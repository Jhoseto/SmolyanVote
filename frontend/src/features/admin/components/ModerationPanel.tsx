"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, EmptyState, ErrorState, Skeleton } from "@/shared/ui";
import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { errorMessage } from "@/shared/lib/errorMessage";
import { adminApi } from "../api";

export function ModerationPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [newWord, setNewWord] = useState("");
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<{ blocked: boolean; matches: string[] } | null>(null);
  const [bulkText, setBulkText] = useState("");

  const wordsQ = useQuery({
    queryKey: ["admin", "moderation", "words"],
    queryFn: () => adminApi.listProfanityWords(),
    enabled,
  });

  const addWord = useMutation({
    mutationFn: (word: string) => adminApi.addProfanityWord(word),
    onSuccess: () => {
      setNewWord("");
      toast.success("Думата е добавена.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "words"] });
    },
    onError: (err) => toast.error(errorMessage(err, "Думата не бе добавена.")),
  });

  const toggleWord = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminApi.setProfanityWordActive(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "words"] });
    },
    onError: (err) => toast.error(errorMessage(err, "Промяната не успя.")),
  });

  const deleteWord = useMutation({
    mutationFn: (id: number) => adminApi.deleteProfanityWord(id),
    onSuccess: () => {
      toast.success("Думата е изтрита.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "words"] });
    },
    onError: (err) => toast.error(errorMessage(err, "Изтриването не успя.")),
  });

  async function handleDelete(id: number, word: string) {
    const ok = await confirm({
      title: "Изтриване на дума",
      description: `Премахване на „${word}" от филтъра?`,
      confirmText: "Изтрий",
      destructive: true,
    });
    if (!ok) return;
    deleteWord.mutate(id);
  }

  if (wordsQ.isPending) return <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />;
  if (wordsQ.isError) {
    return (
      <ErrorState description="Филтърът не можа да се зареди." onRetry={() => wordsQ.refetch()} />
    );
  }

  const words = wordsQ.data?.words ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-semibold">Филтър на думи</h2>
        <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
          Добавете думи или фрази, които автоматично блокират публикации и коментари. След 3
          нарушения профилът получава 1-часов read-only бан.
        </p>
      </div>

      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          const word = newWord.trim();
          if (!word) return;
          addWord.mutate(word);
        }}
      >
        <input
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          placeholder="Нова дума…"
          className="flex-1 rounded-[var(--radius-md)] border border-border-default/60 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <Button type="submit" size="sm" disabled={addWord.isPending || !newWord.trim()}>
          Добави
        </Button>
      </form>

      <div className="rounded-[var(--radius-lg)] border border-border-default/60 p-4">
        <h3 className="mb-2 text-sm font-semibold">Тест на текст</h3>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          rows={2}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="Въведете текст за проверка…"
        />
        <button
          type="button"
          className="mt-2 rounded bg-primary px-3 py-1.5 text-sm text-white"
          onClick={async () => {
            try {
              setTestResult(await adminApi.testProfanityText(testText));
            } catch (e) {
              toast.error(errorMessage(e, "Операцията не успя"));
            }
          }}
        >
          Провери
        </button>
        {testResult && (
          <p className="mt-2 text-sm">
            {testResult.blocked
              ? `Блокира се: ${testResult.matches.join(", ")}`
              : "Няма съвпадения"}
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border-default/60 p-4">
        <h3 className="mb-2 text-sm font-semibold">Bulk import (по един ред)</h3>
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          rows={4}
          className="w-full rounded border px-3 py-2 text-sm font-mono"
          placeholder="дума1&#10;дума2"
        />
        <button
          type="button"
          className="mt-2 rounded border px-3 py-1.5 text-sm"
          onClick={async () => {
            const words = bulkText.split(/\r?\n/).map((w) => w.trim()).filter(Boolean);
            try {
              const res = await adminApi.bulkImportProfanityWords(words);
              toast.success(`Добавени: ${res.added}, пропуснати: ${res.skipped}`);
              setBulkText("");
              void queryClient.invalidateQueries({ queryKey: ["admin", "moderation", "words"] });
            } catch (e) {
              toast.error(errorMessage(e, "Операцията не успя"));
            }
          }}
        >
          Импорт
        </button>
      </div>

      {words.length === 0 ? (
        <EmptyState
          icon="bi-shield-check"
          title="Няма филтрирани думи"
          description="Добавете първата дума по-горе."
        />
      ) : (
        <ul className="divide-y divide-border-default/40 overflow-hidden rounded-[var(--radius-lg)] border border-border-default/60 bg-white">
          {words.map((word) => (
            <li key={word.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <span className="font-medium text-[color:var(--color-text-heading)]">{word.word}</span>
                {!word.active && (
                  <span className="ml-2 text-xs text-[color:var(--color-text-muted)]">(неактивна)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleWord.mutate({ id: word.id, active: !word.active })}
                  className="text-xs text-primary hover:underline"
                >
                  {word.active ? "Изключи" : "Активирай"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(word.id, word.word)}
                  className="text-xs text-[color:var(--color-error)] hover:underline"
                >
                  Изтрий
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
