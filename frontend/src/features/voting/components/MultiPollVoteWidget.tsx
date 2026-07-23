"use client";

import { useState } from "react";
import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { hapticSuccess } from "@/shared/lib/haptic";
import { Button } from "@/shared/ui";
import { useCastMultiPollVote } from "../hooks/useCastMultiPollVote";
import { VoteResultsBars } from "./VoteResultsBars";

const MAX_SELECTABLE = 3;

interface MultiPollVoteWidgetProps {
  pollId: number;
  optionsText: string[];
  votesForOptions: number[];
  votePercentages: number[];
  currentUserVotes: string[] | null;
  onVoted: () => void;
}

/** Multi-select vote (1–3 options) — `selectedOptions` are 1-based (matches backend). */
export function MultiPollVoteWidget(props: MultiPollVoteWidgetProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const requireAuth = useRequireAuth();
  const { mutate, isPending } = useCastMultiPollVote();
  const [selected, setSelected] = useState<number[]>([]);

  const hasVoted = !!props.currentUserVotes && props.currentUserVotes.length > 0;
  const totalVotes = props.votesForOptions.reduce((sum, n) => sum + n, 0);

  function toggle(index: number) {
    const optionIndex = index + 1;
    setSelected((prev) => {
      if (prev.includes(optionIndex)) return prev.filter((i) => i !== optionIndex);
      if (prev.length >= MAX_SELECTABLE) {
        toast.warning(`Може да изберете най-много ${MAX_SELECTABLE} опции.`);
        return prev;
      }
      return [...prev, optionIndex];
    });
  }

  async function handleSubmit() {
    if (selected.length === 0) return;
    if (!(await requireAuth("да гласуваш"))) return;

    const chosenLabels = selected.map((i) => props.optionsText[i - 1]);
    const ok = await confirm({
      title: "Потвърдете вашите гласове",
      confirmText: "Потвърждавам гласовете си",
      voteConfirm: { selectedLabels: chosenLabels, plural: true },
    });
    if (!ok) return;

    mutate(
      { pollId: props.pollId, selectedOptions: selected },
      {
        onSuccess: () => {
          hapticSuccess();
          toast.success("Гласът ви беше записан успешно.");
          props.onVoted();
        },
        onError: (error) => {
          toast.error(errorMessage(error, "Гласуването не бе успешно."));
        },
      },
    );
  }

  const rows = props.optionsText.map((label, i) => ({
    key: String(i),
    label,
    count: props.votesForOptions[i] ?? 0,
    percent: props.votePercentages[i] ?? 0,
    active: props.currentUserVotes?.includes(label) ?? false,
  }));

  const selectedRowIndices = selected.map((oneBased) => oneBased - 1);

  return (
    <div className="flex flex-col gap-4">
      <VoteResultsBars
        rows={rows}
        totalVotes={totalVotes}
        interactive={!hasVoted}
        multiSelect
        disabled={isPending}
        selectedIndices={hasVoted ? [] : selectedRowIndices}
        onSelect={toggle}
        hint={
          hasVoted
            ? undefined
            : `Изберете до ${MAX_SELECTABLE} опции, после потвърдете`
        }
      />

      {!hasVoted && (
        <Button
          type="button"
          disabled={selected.length === 0 || isPending}
          onClick={handleSubmit}
          className="w-full"
        >
          {isPending ? "Записване…" : `Гласувай (${selected.length}/${MAX_SELECTABLE})`}
        </Button>
      )}
    </div>
  );
}
