import { FAQ_CATEGORIES } from "../data/faqCategories";

/**
 * Native `<a href="#id">` anchors — smooth-scroll + navbar offset come from
 * `scroll-behavior`/`scroll-padding-top` on `html` (globals.css), and the
 * post-jump highlight from the `.target-highlight:target` CSS animation.
 * Replaces v1's manual `scrollTo()` + `setTimeout` highlight in `faq.js`.
 */
export function FaqQuickLinks() {
  return (
    <div className="mx-auto mt-10 max-w-4xl">
      <h3 className="text-center text-sm font-semibold text-[color:var(--color-text-muted)]">
        Бързи връзки
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {FAQ_CATEGORIES.map((category) => (
          <a
            key={category.id}
            href={`#${category.id}`}
            className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-border-default/60 bg-white px-3 py-4 text-center text-sm font-medium text-[color:var(--color-text-primary)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-md)]"
          >
            <i className={`bi ${category.quickLinkIcon} text-xl text-primary`} />
            <span>{category.quickLinkLabel}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
