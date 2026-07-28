"use client";

import { ContactTrigger } from "@/features/contacts";

/** CTA button for the community section — opens the contact modal. */
export function CommunityContactButton() {
  return (
    <ContactTrigger className="btn-brand mt-8 inline-flex items-center gap-2 rounded-[8px] px-7 py-3 font-semibold shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[var(--shadow-lg)]">
      <i className="bi bi-envelope" />
      Изпратете предложение
    </ContactTrigger>
  );
}
