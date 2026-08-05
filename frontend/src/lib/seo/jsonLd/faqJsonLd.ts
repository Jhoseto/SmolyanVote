import { FAQ_CATEGORIES } from "@/features/faq/data/faqCategories";

/** Full FAQPage JSON-LD from all categories (19 Q&A). */
export function buildFaqJsonLd() {
  const mainEntity = FAQ_CATEGORIES.flatMap((cat) =>
    cat.items.map((item) => ({
      "@type": "Question" as const,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer" as const,
        text: item.answer,
      },
    })),
  );

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}
