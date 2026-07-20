"use client";

import { CallWindowClient, type CallWindowParams } from "@/features/messenger/components/CallWindowClient";

export function CallWindowPageClient({ params }: { params: CallWindowParams }) {
  if (!params.token) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0f1419] text-white">
        <p className="text-sm text-white/70">Липсва call token.</p>
      </div>
    );
  }

  return <CallWindowClient params={params} />;
}
