export type CreateEventType = "simple" | "referendum" | "multipoll";

export interface CreateEventPageCopy {
  type: CreateEventType;
  badge: string;
  title: string;
  intro: string;
  beforeCreate: string;
  /** Atmospheric photo for the create-page hero (not the default cover asset). */
  heroSrc: string;
  heroAlt: string;
  /** Default cover shown if the user uploads no images. */
  defaultCoverSrc: string;
  defaultCoverAlt: string;
  howItWorks: { icon: string; title: string; text: string }[];
  rules: string[];
  tips: string[];
  submitHint: string;
  typeSwitcher: { type: CreateEventType; href: string; label: string; hint: string }[];
}

const BEFORE_CREATE =
  "Проверете дали вече няма подобно събитие — дублираните теми разводняват гласа на общността.";

const SHARED_RULES = [
  "Резултатите са неофициални и консултативни — нямат правна сила.",
  "След публикуване авторът не може да редактира събитието.",
  "До 3 снимки по избор; иначе се ползва стандартната корица.",
];

const TYPE_SWITCHER = [
  {
    type: "simple" as const,
    href: "/event/new",
    label: "Опростено събитие",
    hint: "За / Против / Неутрален",
  },
  {
    type: "referendum" as const,
    href: "/referendum/new",
    label: "Референдум",
    hint: "До 10 опции · 1 избор",
  },
  {
    type: "multipoll" as const,
    href: "/multipoll/new",
    label: "Анкета",
    hint: "До 10 опции · до 3 избора",
  },
];

export const CREATE_EVENT_PAGE_COPY: Record<CreateEventType, CreateEventPageCopy> = {
  simple: {
    type: "simple",
    badge: "Опростено гласуване",
    title: "Ново събитие",
    intro:
      "Бърз начин да измерите мнението с ясен избор: ЗА, ПРОТИВ или неутрална позиция. Подходящо за конкретни ежедневни въпроси.",
    beforeCreate: BEFORE_CREATE,
    heroSrc: "/images/web/contacts.jpg",
    heroAlt: "Граждани гласуват — създаване на опростено събитие",
    defaultCoverSrc: "/images/eventImages/defaultEvent.jpg",
    defaultCoverAlt: "Опростено събитие — стандартна корица",
    howItWorks: [
      {
        icon: "bi-hand-thumbs-up",
        title: "Три етикета",
        text: "Гласуващите избират между ЗА, ПРОТИВ и неутрален етикет — можете да ги преименувате.",
      },
      {
        icon: "bi-person-check",
        title: "Един глас",
        text: "Всеки потребител гласува веднъж. Резултатите се обновяват в реално време.",
      },
      {
        icon: "bi-lightning",
        title: "За бързи решения",
        text: "Идеално за конкретни предложения без нужда от много опции.",
      },
    ],
    rules: SHARED_RULES,
    tips: [
      "Формулирайте заглавието като ясен въпрос или предложение.",
      "В описанието добавете контекст и възможни последствия.",
      "Преди да публикувате, проверете дали вече няма подобно събитие.",
    ],
    submitHint: "След създаване събитието е видимо веднага и не може да се редактира.",
    typeSwitcher: TYPE_SWITCHER,
  },
  referendum: {
    type: "referendum",
    badge: "Референдум",
    title: "Нов референдум",
    intro:
      "За по-сложни обществени въпроси с няколко възможни отговора. Участниците избират точно една опция.",
    beforeCreate: BEFORE_CREATE,
    heroSrc: "/images/web/contacts.jpg",
    heroAlt: "Граждани гласуват — създаване на референдум",
    defaultCoverSrc: "/images/eventImages/defaultReferendum.jpg",
    defaultCoverAlt: "Референдум — стандартна корица",
    howItWorks: [
      {
        icon: "bi-list-ul",
        title: "До 10 опции",
        text: "Добавете между 2 и 10 ясно формулирани алтернативи.",
      },
      {
        icon: "bi-1-circle",
        title: "Един избор",
        text: "Всеки гласуващ избира само една опция — за ясен резултат.",
      },
      {
        icon: "bi-bank",
        title: "Големи теми",
        text: "Подходящо за градски проекти, приоритети и обществени дилеми.",
      },
    ],
    rules: SHARED_RULES,
    tips: [
      "Опциите да са взаимно изключващи се и лесни за сравнение.",
      "Опишете аргументите „за“ и „против“ в текста, не само в заглавието.",
      "Проверете дали вече няма референдум по същата тема.",
    ],
    submitHint: "След създаване референдумът е публичен и не може да се редактира.",
    typeSwitcher: TYPE_SWITCHER,
  },
  multipoll: {
    type: "multipoll",
    badge: "Анкета с множествен избор",
    title: "Нова анкета",
    intro:
      "Когато мнението не е черно-бяло. Участниците могат да изберат до 3 опции — за нюансирани предпочитания.",
    beforeCreate: BEFORE_CREATE,
    heroSrc: "/images/web/contacts.jpg",
    heroAlt: "Граждани гласуват — създаване на анкета",
    defaultCoverSrc: "/images/eventImages/defaultMultiPoll.jpg",
    defaultCoverAlt: "Анкета — стандартна корица",
    howItWorks: [
      {
        icon: "bi-bar-chart-steps",
        title: "До 10 опции",
        text: "Създайте списък от възможности, които хората могат да комбинират.",
      },
      {
        icon: "bi-ui-checks",
        title: "До 3 избора",
        text: "Всеки може да маркира максимум три предпочитания.",
      },
      {
        icon: "bi-pie-chart",
        title: "Нюансирано мнение",
        text: "Подходящо за бюджети, благоустройство и класации на идеи.",
      },
    ],
    rules: SHARED_RULES,
    tips: [
      "Дръжте опциите кратки и сравними по смисъл.",
      "В описанието обяснете защо са позволени няколко избора.",
      "Преди публикуване потърсете сходни анкети в платформата.",
    ],
    submitHint: "След създаване анкетата е публична и не може да се редактира.",
    typeSwitcher: TYPE_SWITCHER,
  },
};
