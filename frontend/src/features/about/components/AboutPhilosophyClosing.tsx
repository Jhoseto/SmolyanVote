import { ABOUT_PHILOSOPHY_CLOSING } from "../data/aboutPhilosophyContent";
import "./about-philosophy.css";

function ClosingCard({
  label,
  children,
  accent,
}: {
  label?: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <article
      className={[
        "about-philosophy-closing__card",
        accent && "about-philosophy-closing__card--accent",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label ? <h2 className="about-philosophy-closing__label font-display">{label}</h2> : null}
      {children}
    </article>
  );
}

export function AboutPhilosophyClosing() {
  const { intro, audiences, together, questions, finale } = ABOUT_PHILOSOPHY_CLOSING;

  return (
    <section className="about-philosophy-closing border-t border-primary/10 bg-[#f8fcf9]">
      <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <p className="about-philosophy-closing__intro font-display text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold leading-snug tracking-[-0.02em] text-[color:var(--color-primary-800)]">
          {intro}
        </p>

        <div className="about-philosophy-closing__stack mt-8">
          {audiences.map((item) => (
            <ClosingCard key={item.label} label={item.label}>
              <p className="about-philosophy-closing__text">{item.text}</p>
            </ClosingCard>
          ))}

          <ClosingCard label="Заедно">
            <p className="about-philosophy-closing__text">{together}</p>
          </ClosingCard>

          <ClosingCard label="Въпросът">
            <div className="about-philosophy-closing__questions">
              {questions.map((line) => (
                <p key={line} className="about-philosophy-closing__question-line font-display">
                  {line}
                </p>
              ))}
            </div>
          </ClosingCard>

          <ClosingCard accent>
            <p className="about-philosophy-closing__finale font-display">{finale}</p>
          </ClosingCard>
        </div>
      </div>
    </section>
  );
}
