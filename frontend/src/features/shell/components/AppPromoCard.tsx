"use client";

import Image from "next/image";
import { Container } from "@/shared/ui";

/** SVMessenger promo — opens download modal via custom event (app shell listens). */
export function AppPromoCard() {
  function openDownload() {
    window.dispatchEvent(new CustomEvent("sv:open-download-modal"));
  }

  return (
    <section className="py-16 md:py-24">
      <Container>
        <div
          className="overflow-hidden rounded-[28px] shadow-[0_18px_45px_rgba(15,118,110,0.18)]"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(72,162,76,0.18), transparent 45%), linear-gradient(135deg, #f4faf5 0%, #ffffff 55%, #eef6f8 100%)",
          }}
        >
          <div className="grid items-center gap-8 p-8 md:grid-cols-[1.4fr_1fr] md:p-12">
            <div>
              <span className="inline-block rounded-[999px] bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-primary-800">
                Ново
              </span>
              <h2 className="text-gradient-brand mt-4 text-[clamp(1.6rem,3.5vw,2.25rem)] font-bold">
                SmolyanVote вече е в джоба ти!
              </h2>
              <p className="mt-4 max-w-lg text-[color:var(--color-text-secondary)]">
                Бъди винаги свързан със твоите контакти. Получавай мигновени
                известия и чати в реално време с нашето ново мобилно приложение.
              </p>
              <button
                type="button"
                onClick={openDownload}
                className="btn-brand mt-6 inline-flex items-center gap-2 rounded-[999px] px-7 py-3 font-semibold shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]"
              >
                <i className="bi bi-phone" />
                Изтегли SVMessenger
              </button>
            </div>

            <div className="mx-auto w-full max-w-[260px]">
              <Image
                src="/svmessenger/img/svapp_promo_premium.jpg"
                alt="SVMessenger приложение"
                width={520}
                height={520}
                className="h-auto w-full rounded-[20px] object-cover shadow-[var(--shadow-lg)]"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
