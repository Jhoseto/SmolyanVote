import type { Metadata } from "next";

export interface MonitorTabSeo {
  path: string;
  title: string;
  description: string;
  answerFirst: string;
}

/** Per-tab SEO for /monitor/* indexable routes. */
export const MONITOR_TAB_SEO: MonitorTabSeo[] = [
  {
    path: "/monitor",
    title: "Граждански монитор — Смолян",
    description:
      "Поръчки, договори, бюджет и решения на община Смолян — структурирани и проверими на SmolyanVote.",
    answerFirst:
      "Гражданският монитор на SmolyanVote показва поръчки, договори и документи за Смолян и областта с риск индикатори и търсене.",
  },
  {
    path: "/monitor/procurement",
    title: "Общински поръчки — Смолян",
    description: "Публични поръчки и договори в Смолян — сумa, доставчик, риск и източник.",
    answerFirst:
      "Разделът Поръчки в монитора показва активни и приключени общински поръчки в Смолян с AI обобщения и флагове за риск.",
  },
  {
    path: "/monitor/budget",
    title: "Бюджет на община Смолян",
    description: "Бюджетни линии и тенденции за община Смолян и региона.",
    answerFirst:
      "Бюджетният раздел визуализира официални бюджетни данни за Смолян на разбираем език.",
  },
  {
    path: "/monitor/council",
    title: "Общински съвет — Смолян",
    description: "Решения и дейност на общинския съвет в Смолян.",
    answerFirst:
      "Разделът Съвет следи решения и документи, свързани с общинския съвет на Смолян.",
  },
  {
    path: "/monitor/methodology",
    title: "Методология на Гражданския монитор",
    description: "Как SmolyanVote събира, обработва и представя данни за общинските разходи в Смолян.",
    answerFirst:
      "Методологията описва източниците, AI обработката и ограниченията на Гражданския монитор — за прозрачност и доверие.",
  },
  {
    path: "/monitor/consultations",
    title: "Обществени консултации — Смолян",
    description: "Консултации и обществени обсъждания в Смолян.",
    answerFirst:
      "Разделът Консултации събира документи и теми за обществени консултации в региона.",
  },
  {
    path: "/monitor/deadlines",
    title: "Срокове и процедури — Смолян",
    description: "Важни срокове по общински процедури в Смолян.",
    answerFirst:
      "Календарът на срокове помага да следите крайни дати по процедури и документи.",
  },
  {
    path: "/monitor/anomalies",
    title: "Аномалии в поръчките — Смолян",
    description: "Подозрителни или необичайни общински поръчки в Смолян.",
    answerFirst:
      "Разделът Аномалии показва поръчки с повишен риск или необичайни параметри за допълнителна проверка.",
  },
  {
    path: "/monitor/flows",
    title: "Потоци на средства — Смолян",
    description: "Визуализация на потоци на общински средства в Смолян.",
    answerFirst:
      "Потоците показват как средствата се разпределят между участници в общинските поръчки.",
  },
  {
    path: "/monitor/eu-funds",
    title: "EU фондове — Смолян",
    description: "Проекти и средства от EU фондове в Смолян и региона.",
    answerFirst:
      "Разделът EU фондове следи проекти и финансиране, свързани с европейски програми в региона.",
  },
  {
    path: "/monitor/region",
    title: "Регионално сравнение — Смолян",
    description: "Сравнение на общински показатели в област Смолян.",
    answerFirst:
      "Регионалното сравнение поставя Смолян в контекст спрямо съседни общини в областта.",
  },
  {
    path: "/monitor/search",
    title: "Търсене в монитора — Смолян",
    description: "Търсене в договори, документи и компании в Гражданския монитор.",
    answerFirst:
      "Търсенето в монитора намира договори, документи и фирми по ключова дума за Смолян.",
  },
];

export function getMonitorTabSeo(path: string): MonitorTabSeo | undefined {
  return MONITOR_TAB_SEO.find((t) => t.path === path);
}

export function buildMonitorTabMetadata(tab: MonitorTabSeo): Metadata {
  return {
    title: tab.title,
    description: tab.description,
    alternates: { canonical: tab.path },
    openGraph: {
      type: "website",
      title: tab.title,
      description: tab.description,
      url: `https://smolyanvote.com${tab.path}`,
      locale: "bg_BG",
      siteName: "SmolyanVote",
      images: [{ url: "https://smolyanvote.com/images/SMVshare.JPG", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: tab.title,
      description: tab.description,
      images: ["https://smolyanvote.com/images/SMVshare.JPG"],
    },
  };
}
