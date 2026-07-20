import type { Metadata } from "next";
import { FaqPage } from "@/features/faq";

export const metadata: Metadata = {
  title: "Често задавани въпроси - SmolyanVote",
  description:
    "Отговори на най-често задаваните въпроси за SmolyanVote платформата за гражданско участие в Смолян.",
  alternates: { canonical: "/faq" },
  openGraph: {
    type: "website",
    title: "Често задавани въпроси - SmolyanVote",
    description: "Отговори на най-често задаваните въпроси за SmolyanVote платформата.",
    url: "https://smolyanvote.com/faq",
    images: ["https://smolyanvote.com/images/SMVshare.JPG"],
    locale: "bg_BG",
  },
  twitter: {
    card: "summary",
    title: "Често задавани въпроси - SmolyanVote",
    description: "Отговори на най-често задаваните въпроси за SmolyanVote платформата.",
  },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Какво е SmolyanVote?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SmolyanVote е безплатна платформа за гражданско участие в град Смолян, която позволява на жителите да участват в анкети, референдуми и обществени дискусии.",
      },
    },
    {
      "@type": "Question",
      name: "Как да се регистрирам в SmolyanVote?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Регистрацията е безплатна и отнема само няколко минути. Необходим е валиден имейл адрес и потвърждение, че сте жител на Смолян или Смолянска област.",
      },
    },
    {
      "@type": "Question",
      name: "Безопасно ли е гласуването в SmolyanVote?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Да, използваме модерни технологии за защита на данните и гарантиране на честността на всяко гласуване. Всеки може да гласува само веднъж.",
      },
    },
  ],
};

export default function Faq() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <FaqPage />
    </>
  );
}
