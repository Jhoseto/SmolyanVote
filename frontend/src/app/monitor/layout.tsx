import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SmolyanVote — Граждански монитор",
  description:
    "Поръчки, решения и разходи на община Смолян и област Смолян — структурирани, проверими, на прост език.",
  openGraph: {
    title: "Граждански монитор — Смолян",
    description: "Прозрачност за Смолян и региона: поръчки, договори, решения на ОбС.",
    type: "website",
    locale: "bg_BG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Граждански монитор — Смолян",
    description: "Прозрачност за Смолян и региона",
  },
};

export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
