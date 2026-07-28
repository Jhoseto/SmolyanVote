import { Container } from "@/shared/ui";
import { CommunityContactButton } from "./CommunityContactButton";

/** "Платформата се изгражда от хората за хората" — v1 decorative BG. */
export function CommunitySection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-24">
      {/* Decorative BG — desktop only (v1 platformComunitiSection.jpg) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden md:block"
        style={{
          backgroundImage: "url('/images/web/platformComunitiSection.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "277px",
          backgroundPosition: "278px 165px",
        }}
      />
      <Container>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="text-gradient-brand text-[clamp(1.75rem,4vw,2.5rem)] font-bold">
            Платформата се изгражда от хората за хората
          </h2>
          <p className="mt-6 text-[color:var(--color-text-secondary)]">
            В SmolyanVote всяка функция, всяко подобрение се ражда от реалните
            потребности на жителите на област Смолян. Вашето мнение и предложение
            директно влияе върху развитието на платформата.
          </p>
          <p className="mt-4 text-[color:var(--color-text-secondary)]">
            Виждате нещо, което може да се подобри логично? Имате идея за нова
            функция? Искате да предложите промяна, която ще направи платформата
            по-полезна за всички? Вашите идеи са основата, върху която изграждаме
            SmolyanVote.
          </p>
          <CommunityContactButton />
        </div>
      </Container>
    </section>
  );
}
