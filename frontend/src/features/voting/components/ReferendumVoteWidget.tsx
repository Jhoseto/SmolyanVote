"use client";

import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { hapticSuccess } from "@/shared/lib/haptic";
import { Button } from "@/shared/ui";
import { useCastReferendumVote } from "../hooks/useCastReferendumVote";
import { VoteResultsBars } from "./VoteResultsBars";

interface ReferendumVoteWidgetProps {
  referendumId: number;
  options: string[];
  votes: number[];
  votePercentages: number[];
  currentUserVote: number | null;
  onVoted: () => void;
}

/** Single-select vote — `optionIndex` is 0-based (matches backend). */
export function ReferendumVoteWidget(props: ReferendumVoteWidgetProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const requireAuth = useRequireAuth();
  const { mutate, isPending } = useCastReferendumVote();

  const hasVoted = props.currentUserVote !== null;

  async function handleVote(optionIndex: number) {
    if (!(await requireAuth("да гласуваш"))) return;
    const ok = await confirm({
      title: "Потвърдете вашия глас",
      confirmText: "Потвърждавам гласа си",
      voteConfirm: { selectedLabels: [props.options[optionIndex]] },
    });
    if (!ok) return;

    mutate(
      { referendumId: props.referendumId, optionIndex },
      {
        onSuccess: (res) => {
          hapticSuccess();
          toast.success(res.message);
          props.onVoted();
        },
        onError: (error) => {
          toast.error(errorMessage(error, "Гласуването не бе успешно."));
        },
      },
    );
  }

  const rows = props.options.map((label, index) => ({
    key: String(index),
    label,
    count: props.votes[index] ?? 0,
    percent: props.votePercentages[index] ?? 0,
    active: props.currentUserVote === index,
  }));

  return (
    <div className="flex flex-col gap-4">
      {!hasVoted && (
        <div className="flex flex-col gap-2">
          {props.options.map((label, index) => (
            <Button
              key={index}
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleVote(index)}
              className="justify-start text-left"
            >
              {label}
            </Button>
          ))}
        </div>
      )}
      {hasVoted && (
        <p className="text-sm text-[color:var(--color-text-muted)]">
          <i className="bi bi-check-circle-fill mr-1.5 text-primary" />
          Вече гласувахте &ldquo;{props.options[props.currentUserVote as number]}&rdquo;.
        </p>
      )}
      <VoteResultsBars rows={rows} />
    </div>
  );
}
