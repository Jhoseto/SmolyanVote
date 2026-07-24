"use client";

import { useMemo } from "react";
import { buildSignalLanes } from "../lib/signalLanes";
import { SignalsCarouselLane } from "./SignalsCarouselLane";
import type { Signal } from "../types";

interface SignalsLanesSectionProps {
  signals: Signal[];
  onSelect: (id: number) => void;
  selectedId?: number | null;
}

const MIN_LANE_SIZE = 3;

export function SignalsLanesSection({ signals, onSelect, selectedId }: SignalsLanesSectionProps) {
  const lanes = useMemo(
    () => buildSignalLanes(signals).filter((lane) => lane.signals.length >= MIN_LANE_SIZE),
    [signals],
  );

  if (lanes.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {lanes.map((lane) => (
        <SignalsCarouselLane key={lane.id} lane={lane} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </div>
  );
}
