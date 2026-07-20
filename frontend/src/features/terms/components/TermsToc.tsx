const TERMS_LINKS = [
  { id: "general", label: "1. Общи положения" },
  { id: "registration", label: "2. Регистрация и достъп" },
  { id: "data-protection", label: "3. Защита на личните данни" },
  { id: "content-rules", label: "4. Правила за съдържанието" },
  { id: "disclaimer", label: "5. Отказ от отговорност" },
  { id: "intellectual-property", label: "6. Интелектуална собственост" },
  { id: "final-provisions", label: "7. Заключителни разпоредби" },
];

const PRIVACY_LINKS = [
  { id: "privacy", label: "Политика за поверителност" },
  { id: "cookies", label: "Бисквитки (Cookies)" },
];

/** Anchor nav — native `<a href="#id">`, smooth-scroll via `html { scroll-behavior }` (globals.css). */
export function TermsToc() {
  return (
    <nav
      aria-label="Съдържание"
      className="rounded-[var(--radius-lg)] border border-border-default/60 bg-white p-5 text-sm"
    >
      <p className="font-semibold text-[color:var(--color-text-heading)]">Условия за ползване</p>
      <ul className="mt-2 space-y-1.5">
        {TERMS_LINKS.map((link) => (
          <li key={link.id}>
            <a href={`#${link.id}`} className="text-[color:var(--color-text-secondary)] hover:text-primary">
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-4 font-semibold text-[color:var(--color-text-heading)]">Поверителност</p>
      <ul className="mt-2 space-y-1.5">
        {PRIVACY_LINKS.map((link) => (
          <li key={link.id}>
            <a href={`#${link.id}`} className="text-[color:var(--color-text-secondary)] hover:text-primary">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
