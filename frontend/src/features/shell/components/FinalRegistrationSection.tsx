"use client";

import { Container } from "@/shared/ui";
import { useLoginGateStore } from "@/shared/lib/loginGateStore";

/** Closing CTA — photo card + grid chrome (v1 final-registration-section). */
export function FinalRegistrationSection() {
  const openAuth = useLoginGateStore((s) => s.open);

  return (
    <section className="relative overflow-hidden bg-white py-16 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(25,134,28,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(25,134,28,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(76,175,80,0.2), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(25,134,28,0.16), transparent 70%)" }}
      />

      <Container className="relative z-10">
        <div
          className="overflow-hidden rounded-[28px] border border-white/70 px-6 py-12 text-center shadow-[0_18px_45px_rgba(15,118,110,0.18)] md:px-12 md:py-14"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.78) 100%), url('/images/web/reg.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="text-gradient-brand text-[clamp(1.75rem,4vw,2.5rem)] font-bold">
              Време е за действие
            </h2>
            <div className="mx-auto mt-3 h-1 w-[min(365px,70%)] rounded-full bg-[image:var(--gradient-primary)]" />
            <p className="mt-6 text-[color:var(--color-text-secondary)]">
              Видяхте възможностите. Разбрахте потенциала. Сега е ваш ред да станете
              част от активното гражданско общество. Зад всеки профил стои човек —
              личност с мнение, мисъл, емоции и мечти. Можете да участвате с име или
              анонимно. Присъединете се към стотиците жители на Област Смолян, които
              вече усещат пулса на общественото мнение чрез SmolyanVote!
            </p>
            <p className="mt-4 font-semibold text-[color:var(--color-text-primary)]">
              Регистрацията отнема само минута, но въздействието може да трае години.
            </p>
            <button
              type="button"
              onClick={() => openAuth("register")}
              className="btn-brand group relative mt-8 inline-flex overflow-hidden rounded-[999px] px-8 py-3.5 text-base font-semibold shadow-[var(--shadow-lg)] transition-all hover:-translate-y-1 hover:shadow-2xl"
            >
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                aria-hidden
              />
              <i className="bi bi-person-plus mr-2" />
              Регистрирайте се сега
            </button>
            <p className="mt-3 text-sm text-[color:var(--color-text-muted)]">Безплатно и сигурно</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
