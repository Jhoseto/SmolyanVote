"use client";

import { useMemo, useState } from "react";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { FAQ_CATEGORIES, type FaqItem } from "../data/faqCategories";

export interface FaqItemView extends FaqItem {
  visible: boolean;
  open: boolean;
}

export interface FaqCategoryView {
  id: string;
  title: string;
  quickLinkIcon: string;
  quickLinkLabel: string;
  visible: boolean;
  items: FaqItemView[];
}

/**
 * FAQ accordion + search state (ports v1 `faq.js`).
 *
 * Accordion stays "one open per category" while browsing — but while a
 * search query is active, matches auto-expand across categories instead
 * (v1 did this too; the two modes just never conflict since search always
 * takes over rendering while typing).
 */
export function useFaqController() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const normalizedQuery = debouncedQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const [openByCategory, setOpenByCategory] = useState<Record<string, string | null>>({});

  const toggle = (categoryId: string, itemId: string) => {
    setOpenByCategory((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === itemId ? null : itemId,
    }));
  };

  const categories = useMemo<FaqCategoryView[]>(
    () =>
      FAQ_CATEGORIES.map((category) => {
        let categoryHasMatch = false;

        const items = category.items.map((item) => {
          const matches =
            !isSearching ||
            item.question.toLowerCase().includes(normalizedQuery) ||
            item.answer.toLowerCase().includes(normalizedQuery);

          if (matches && isSearching) categoryHasMatch = true;

          return {
            ...item,
            visible: matches,
            open: isSearching ? matches : openByCategory[category.id] === item.id,
          };
        });

        return {
          id: category.id,
          title: category.title,
          quickLinkIcon: category.quickLinkIcon,
          quickLinkLabel: category.quickLinkLabel,
          visible: !isSearching || categoryHasMatch,
          items,
        };
      }),
    [isSearching, normalizedQuery, openByCategory],
  );

  const hasResults = !isSearching || categories.some((c) => c.visible);

  return { query, setQuery, categories, toggle, isSearching, hasResults };
}
