import { Container } from "@/shared/ui";

export function AboutHero() {
  return (
    <header className="relative overflow-hidden bg-[color:var(--color-text-heading)] py-20 text-white md:py-28">
      <Container className="relative text-center">
        <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold">Защо SmolyanVote?</h1>
        <p className="mt-3 text-lg text-white/80">
          Създадено от хората. За хората. С мисъл за града.
        </p>
        <div className="mx-auto mt-8 max-w-3xl space-y-4 text-white/70">
          <p>
            В свят, където демокрацията все повече се изгражда от активните граждани, твоят глас
            има значение. Смолян се нуждае от твоето мнение, идеи и ангажираност. Нашата
            платформа ти предоставя възможността да участваш в създаването на анкети,
            референдуми и обществени обсъждания, които оформят бъдещето на нашата общност.
          </p>
          <p>
            Присъедини се към движението за по-активно гражданско участие. Създавай, споделяй и
            участвай в инициативи, които имат значение. Заедно можем да изградим по-прозрачно,
            справедливо и ангажирано общество.
          </p>
        </div>
      </Container>
    </header>
  );
}
