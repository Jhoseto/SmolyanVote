import { FaqAccordionItem } from "./FaqAccordionItem";
import type { FaqCategoryView } from "../hooks/useFaqController";

interface FaqCategorySectionProps {
  category: FaqCategoryView;
  isSearching: boolean;
  onToggle: (itemId: string) => void;
}

export function FaqCategorySection({ category, isSearching, onToggle }: FaqCategorySectionProps) {
  if (!category.visible) return null;

  return (
    <section id={category.id} className="target-highlight rounded-[var(--radius-lg)] py-6">
      <h2 className="text-xl font-bold text-[color:var(--color-text-heading)]">{category.title}</h2>
      <div className="mt-4 space-y-3">
        {category.items
          .filter((item) => item.visible)
          .map((item) => (
            <FaqAccordionItem
              key={item.id}
              item={item}
              highlighted={isSearching}
              onToggle={() => onToggle(item.id)}
            />
          ))}
      </div>
    </section>
  );
}
