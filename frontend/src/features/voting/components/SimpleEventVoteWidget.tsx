"use client";

import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { useRequireAuth } from "@/shared/hooks/useRequireAuth";
import { errorMessage } from "@/shared/lib/errorMessage";
import { hapticSuccess } from "@/shared/lib/haptic";
import { useCastSimpleEventVote } from "../hooks/useCastSimpleEventVote";
import { VoteResultsBars } from "./VoteResultsBars";

interface SimpleEventVoteWidgetProps {
  eventId: number;
  currentUserVote: "1" | "2" | "3" | null;
  yesVotes: number;
  noVotes: number;
  neutralVotes: number;
  yesPercent: number;
  noPercent: number;
  neutralPercent: number;
  positiveLabel: string;
  negativeLabel: string;
  neutralLabel: string;
  onVoted: () => void;
}

const OPTIONS: { value: "1" | "2" | "3"; colorClass: string; iconClass: string }[] = [
  { value: "1", colorClass: "bg-[color:var(--color-success)]", iconClass: "bi-hand-thumbs-up-fill" },
  { value: "2", colorClass: "bg-[color:var(--color-error)]", iconClass: "bi-hand-thumbs-down-fill" },
  { value: "3", colorClass: "bg-[color:var(--color-text-muted)]", iconClass: "bi-dash-lg" },
];

/** Yes / No / Neutral vote — mirrors backend's 3-way `SimpleEventDetail` contract. */
export function SimpleEventVoteWidget(props: SimpleEventVoteWidgetProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const requireAuth = useRequireAuth();
  const { mutate, isPending } = useCastSimpleEventVote();

  const hasVoted = props.currentUserVote !== null;
  const labels: Record<"1" | "2" | "3", string> = {
    "1": props.positiveLabel,
    "2": props.negativeLabel,
    "3": props.neutralLabel,
  };

  async function handleVote(value: "1" | "2" | "3") {
    if (!(await requireAuth("да гласуваш"))) return;
    const ok = await confirm({
      title: "Потвърдете вашия глас",
      confirmText: "Потвърждавам гласа си",
      voteConfirm: { selectedLabels: [labels[value]] },
    });
    if (!ok) return;

    mutate(
      { eventId: props.eventId, vote: value },
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

  const rows = OPTIONS.map((opt) => ({
    key: opt.value,
    label: labels[opt.value],
    count: opt.value === "1" ? props.yesVotes : opt.value === "2" ? props.noVotes : props.neutralVotes,
    percent: opt.value === "1" ? props.yesPercent : opt.value === "2" ? props.noPercent : props.neutralPercent,
    active: props.currentUserVote === opt.value,
    colorClass: opt.colorClass,
    iconClass: opt.iconClass,
  }));

  return (
    <VoteResultsBars
      rows={rows}
      totalVotes={props.yesVotes + props.noVotes + props.neutralVotes}
      interactive={!hasVoted}
      disabled={isPending}
      onSelect={(index) => handleVote(OPTIONS[index].value)}
      hint={hasVoted ? undefined : "Изберете ЗА, ПРОТИВ или неутрална позиция"}
    />
  );
}
