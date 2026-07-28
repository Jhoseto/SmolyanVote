"use client";

import { Container } from "@/shared/ui";
import { ContactTrigger } from "@/features/contacts";

export function FaqContactCta() {
  return (
    <section className="border-t border-border-default/60 bg-[color:var(--color-surface-light)] py-14">
      <Container className="text-center">
        <h2 className="text-2xl font-bold text-[color:var(--color-text-heading)]">
          Не намерихте отговор?
        </h2>
        <p className="mt-2 text-[color:var(--color-text-secondary)]">
          Свържете се с нас и ще отговорим на вашия въпрос
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:smolyanvote@gmail.com"
            className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-border-default px-5 py-2.5 text-sm font-medium text-[color:var(--color-text-primary)] transition-colors hover:border-primary hover:text-primary"
          >
            <i className="bi bi-envelope" />
            Изпрати имейл
          </a>
          <ContactTrigger className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[image:var(--gradient-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)]">
            <i className="bi bi-chat-dots" />
            Форма за контакт
          </ContactTrigger>
        </div>
      </Container>
    </section>
  );
}
