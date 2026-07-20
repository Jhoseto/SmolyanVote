"use client";

import { Container, EmptyState } from "@/shared/ui";
import { useFaqController } from "../hooks/useFaqController";
import { FaqSearch } from "./FaqSearch";
import { FaqQuickLinks } from "./FaqQuickLinks";
import { FaqCategorySection } from "./FaqCategorySection";
import { FaqContactCta } from "./FaqContactCta";

export function FaqPage() {
  const { query, setQuery, categories, toggle, isSearching, hasResults } = useFaqController();

  return (
    <>
      <header className="bg-[color:var(--color-text-heading)] py-16 text-center text-white md:py-20">
        <Container>
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold">Често задавани въпроси</h1>
          <p className="mt-2 text-white/70">Отговори на най-важните въпроси за SmolyanVote</p>
        </Container>
      </header>

      <Container className="py-10 md:py-14">
        <FaqSearch value={query} onChange={setQuery} />
        {!isSearching && <FaqQuickLinks />}

        <div className="mx-auto mt-10 max-w-4xl space-y-8">
          {hasResults ? (
            categories.map((category) => (
              <FaqCategorySection
                key={category.id}
                category={category}
                isSearching={isSearching}
                onToggle={(itemId) => toggle(category.id, itemId)}
              />
            ))
          ) : (
            <EmptyState
              icon="bi-search"
              title={`Не намерихме резултати за "${query.trim()}"`}
              description="Опитайте с други ключови думи или се свържете с нас директно за помощ."
            />
          )}
        </div>
      </Container>

      <FaqContactCta />
    </>
  );
}
