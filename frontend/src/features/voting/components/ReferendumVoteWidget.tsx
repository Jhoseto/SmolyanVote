"use client";

import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { useCanInteract } from "@/features/moderation/hooks/useCanInteract";
import { errorMessage } from "@/shared/lib/errorMessage";
import { hapticSuccess } from "@/shared/lib/haptic";
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
  const canInteract = useCanInteract();
  const { mutate, isPending } = useCastReferendumVote();

  const hasVoted = props.currentUserVote !== null;
  const totalVotes = props.votes.reduce((sum, n) => sum + n, 0);

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
    <VoteResultsBars
      rows={rows}
      totalVotes={totalVotes}
      interactive={!hasVoted && canInteract}
      disabled={isPending || !canInteract}
      onSelect={handleVote}
      hint={
        !canInteract
          ? "Гласуването е изключено, докато профилът е ограничен"
          : hasVoted
            ? undefined
            : "Докоснете опция, за да гласувате"
      }
    />
  );
}
