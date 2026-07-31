/**
 * Layer 2 — static app-shell locales (MODERN_FRONTEND_PLAN §Multilingual).
 * Scope: app chrome labels only (Navbar/Footer). UGC content is handled by
 * Layer 1 (hidden Google Translate); messenger messages by Layer 3
 * (Gemini/Java).
 */

export const SUPPORTED_LANGUAGES = [
  "bg",
  "en",
  "el",
  "tr",
  "ru",
  "de",
  "fr",
  "es",
  "iw",
  "zh-CN",
] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "bg";

export const LANGUAGE_LABELS: Record<Language, { native: string; flag: string }> =
  {
    bg: { native: "Български", flag: "bg" },
    en: { native: "Английски", flag: "gb" },
    el: { native: "Гръцки", flag: "gr" },
    tr: { native: "Турски", flag: "tr" },
    ru: { native: "Руски", flag: "ru" },
    de: { native: "Немски", flag: "de" },
    fr: { native: "Френски", flag: "fr" },
    es: { native: "Испански", flag: "es" },
    iw: { native: "Иврит", flag: "il" },
    "zh-CN": { native: "Китайски", flag: "cn" },
  };

export interface ShellDictionary {
  nav: {
    home: string;
    about: string;
    vote: string;
    monitor: string;
    publications: string;
    signals: string;
    podcast: string;
    contacts: string;
    messenger: string;
    languages: string;
    login: string;
    register: string;
    logout: string;
    menu: string;
  };
  footer: {
    tagline: string;
    navHeading: string;
    nav: {
      events: string;
      publications: string;
      about: string;
      faq: string;
    };
    participateHeading: string;
    participate: {
      createEvent: string;
      createReferendum: string;
      createPoll: string;
      downloadApp: string;
    };
    legalHeading: string;
    legal: {
      terms: string;
      cookies: string;
    };
    contactHeading: string;
    contactHint: string;
    contactCta: string;
    location: string;
    newsletterTitle: string;
    newsletterHint: string;
    myProfile: string;
    copyright: string;
    copyrightSub: string;
  };
}

export const shellMessages: Record<Language, ShellDictionary> = {
  bg: {
    nav: {
      home: "Начало",
      about: "Философия",
      vote: "Гласувай",
      monitor: "Граждански монитор",
      publications: "Публикации",
      signals: "Карта/Сигнали",
      podcast: "Podcast",
      contacts: "Контакти",
      messenger: "SVMessenger",
      languages: "Езици",
      login: "Вход",
      register: "Регистрация",
      logout: "Изход",
      menu: "Меню",
    },
    footer: {
      tagline:
        "Платформа за свободно изразяване на гражданското мнение. Вашият глас има значение за развитието на Родопите.",
      navHeading: "Навигация",
      nav: {
        events: "Гласувания",
        publications: "Публикации",
        about: "Философия",
        faq: "FAQ",
      },
      participateHeading: "Участвай",
      participate: {
        createEvent: "Създай събитие",
        createReferendum: "Създай референдум",
        createPoll: "Създай анкета",
        downloadApp: "Изтегли SVMessenger",
      },
      legalHeading: "Правна информация",
      legal: {
        terms: "Условия за ползване и Политика за поверителност",
        cookies: "Cookies политика",
      },
      contactHeading: "Контакти",
      contactHint: "Въпроси, идеи и обратна връзка",
      contactCta: "Свържи се с нас",
      location: "Смолян, България",
      newsletterTitle: "Бюлетин",
      newsletterHint: "Нови събития и важни обновления",
      myProfile: "Моят профил",
      copyright: "© 2025 SmolyanVote. Всички права запазени.",
      copyrightSub: "Гражданска платформа за инициативи от област Смолян",
    },
  },
  en: {
    nav: {
      home: "Home",
      about: "Philosophy",
      vote: "Vote",
      monitor: "Citizen Monitor",
      publications: "Publications",
      signals: "Map/Signals",
      podcast: "Podcast",
      contacts: "Contacts",
      messenger: "SVMessenger",
      languages: "Languages",
      login: "Log in",
      register: "Register",
      logout: "Log out",
      menu: "Menu",
    },
    footer: {
      tagline:
        "A platform for the free expression of civic opinion. Your voice matters for the development of the Rhodopes.",
      navHeading: "Navigation",
      nav: {
        events: "Votes",
        publications: "Publications",
        about: "About",
        faq: "FAQ",
      },
      participateHeading: "Get involved",
      participate: {
        createEvent: "Create event",
        createReferendum: "Create referendum",
        createPoll: "Create poll",
        downloadApp: "Download SVMessenger",
      },
      legalHeading: "Legal information",
      legal: {
        terms: "Terms of Use and Privacy Policy",
        cookies: "Cookie Policy",
      },
      contactHeading: "Contacts",
      contactHint: "Questions, ideas and feedback",
      contactCta: "Contact us",
      location: "Smolyan, Bulgaria",
      newsletterTitle: "Newsletter",
      newsletterHint: "New events and important updates",
      myProfile: "My profile",
      copyright: "© 2025 SmolyanVote. All rights reserved.",
      copyrightSub: "Civic platform for initiatives from Smolyan Province",
    },
  },
  el: {
    nav: {
      home: "Αρχική",
      about: "Σχετικά",
      vote: "Ψήφισε",
      monitor: "Πολίτης Monitor",
      publications: "Δημοσιεύσεις",
      signals: "Χάρτης/Σήματα",
      podcast: "Podcast",
      contacts: "Επικοινωνία",
      messenger: "SVMessenger",
      languages: "Γλώσσες",
      login: "Σύνδεση",
      register: "Εγγραφή",
      logout: "Αποσύνδεση",
      menu: "Μενού",
    },
    footer: {
      tagline:
        "Πλατφόρμα για την ελεύθερη έκφραση της κοινής γνώμης. Η φωνή σου έχει σημασία για την ανάπτυξη της Ροδόπης.",
      navHeading: "Πλοήγηση",
      nav: {
        events: "Ψηφοφορίες",
        publications: "Δημοσιεύσεις",
        about: "Σχετικά",
        faq: "Συχνές ερωτήσεις",
      },
      participateHeading: "Συμμετοχή",
      participate: {
        createEvent: "Δημιούργησε εκδήλωση",
        createReferendum: "Δημιούργησε δημοψήφισμα",
        createPoll: "Δημιούργησε δημοσκόπηση",
        downloadApp: "Κατέβασε το SVMessenger",
      },
      legalHeading: "Νομικές πληροφορίες",
      legal: {
        terms: "Όροι Χρήσης και Πολιτική Απορρήτου",
        cookies: "Πολιτική Cookies",
      },
      contactHeading: "Επικοινωνία",
      contactHint: "Ερωτήσεις, ιδέες και σχόλια",
      contactCta: "Επικοινωνήστε μαζί μας",
      location: "Σμόλιαν, Βουλγαρία",
      newsletterTitle: "Ενημερωτικό δελτίο",
      newsletterHint: "Νέα γεγονότα και σημαντικές ενημερώσεις",
      myProfile: "Το προφίλ μου",
      copyright: "© 2025 SmolyanVote. Όλα τα δικαιώματα διατηρούνται.",
      copyrightSub: "Πλατφόρμα πολιτών για πρωτοβουλίες από την επαρχία Σμόλιαν",
    },
  },
  tr: {
    nav: {
      home: "Ana Sayfa",
      about: "Hakkımızda",
      vote: "Oy Ver",
      monitor: "Vatandaş Monitör",
      publications: "Yayınlar",
      signals: "Harita/Sinyaller",
      podcast: "Podcast",
      contacts: "İletişim",
      messenger: "SVMessenger",
      languages: "Diller",
      login: "Giriş yap",
      register: "Kayıt ol",
      logout: "Çıkış yap",
      menu: "Menü",
    },
    footer: {
      tagline:
        "Sivil görüşün özgürce ifade edilmesi için bir platform. Sesiniz Rodoplar'ın gelişimi için önemlidir.",
      navHeading: "Gezinme",
      nav: {
        events: "Oylamalar",
        publications: "Yayınlar",
        about: "Hakkımızda",
        faq: "SSS",
      },
      participateHeading: "Katıl",
      participate: {
        createEvent: "Etkinlik oluştur",
        createReferendum: "Referandum oluştur",
        createPoll: "Anket oluştur",
        downloadApp: "SVMessenger indir",
      },
      legalHeading: "Yasal bilgiler",
      legal: {
        terms: "Kullanım Koşulları ve Gizlilik Politikası",
        cookies: "Çerez Politikası",
      },
      contactHeading: "İletişim",
      contactHint: "Sorular, fikirler ve geri bildirim",
      contactCta: "Bize ulaşın",
      location: "Smolyan, Bulgaristan",
      newsletterTitle: "Bülten",
      newsletterHint: "Yeni etkinlikler ve önemli güncellemeler",
      myProfile: "Profilim",
      copyright: "© 2025 SmolyanVote. Tüm hakları saklıdır.",
      copyrightSub: "Smolyan bölgesinden girişimler için sivil platform",
    },
  },
  ru: {
    nav: {
      home: "Начало",
      about: "О нас",
      vote: "Голосуй",
      monitor: "Гражданский монитор",
      publications: "Публикации",
      signals: "Карта/Сигналы",
      podcast: "Подкаст",
      contacts: "Контакты",
      messenger: "SVMessenger",
      languages: "Языки",
      login: "Вход",
      register: "Регистрация",
      logout: "Выход",
      menu: "Меню",
    },
    footer: {
      tagline:
        "Платформа для свободного выражения гражданского мнения. Ваш голос важен для развития Родоп.",
      navHeading: "Навигация",
      nav: {
        events: "Голосования",
        publications: "Публикации",
        about: "О нас",
        faq: "Вопросы и ответы",
      },
      participateHeading: "Участвуй",
      participate: {
        createEvent: "Создать событие",
        createReferendum: "Создать референдум",
        createPoll: "Создать опрос",
        downloadApp: "Скачать SVMessenger",
      },
      legalHeading: "Правовая информация",
      legal: {
        terms: "Условия использования и Политика конфиденциальности",
        cookies: "Политика Cookies",
      },
      contactHeading: "Контакты",
      contactHint: "Вопросы, идеи и обратная связь",
      contactCta: "Связаться с нами",
      location: "Смолян, Болгария",
      newsletterTitle: "Рассылка",
      newsletterHint: "Новые события и важные обновления",
      myProfile: "Мой профиль",
      copyright: "© 2025 SmolyanVote. Все права защищены.",
      copyrightSub: "Гражданская платформа для инициатив из области Смолян",
    },
  },
  de: {
    nav: {
      home: "Start",
      about: "Über uns",
      vote: "Abstimmen",
      monitor: "Bürger-Monitor",
      publications: "Veröffentlichungen",
      signals: "Karte/Signale",
      podcast: "Podcast",
      contacts: "Kontakte",
      messenger: "SVMessenger",
      languages: "Sprachen",
      login: "Anmelden",
      register: "Registrieren",
      logout: "Abmelden",
      menu: "Menü",
    },
    footer: {
      tagline:
        "Eine Plattform für den freien Ausdruck der Bürgermeinung. Ihre Stimme ist wichtig für die Entwicklung der Rhodopen.",
      navHeading: "Navigation",
      nav: {
        events: "Abstimmungen",
        publications: "Veröffentlichungen",
        about: "Über uns",
        faq: "FAQ",
      },
      participateHeading: "Mitmachen",
      participate: {
        createEvent: "Ereignis erstellen",
        createReferendum: "Referendum erstellen",
        createPoll: "Umfrage erstellen",
        downloadApp: "SVMessenger herunterladen",
      },
      legalHeading: "Rechtliche Hinweise",
      legal: {
        terms: "Nutzungsbedingungen und Datenschutzrichtlinie",
        cookies: "Cookie-Richtlinie",
      },
      contactHeading: "Kontakte",
      contactHint: "Fragen, Ideen und Feedback",
      contactCta: "Kontaktieren Sie uns",
      location: "Smolyan, Bulgarien",
      newsletterTitle: "Newsletter",
      newsletterHint: "Neue Ereignisse und wichtige Updates",
      myProfile: "Mein Profil",
      copyright: "© 2025 SmolyanVote. Alle Rechte vorbehalten.",
      copyrightSub: "Bürgerplattform für Initiativen aus der Provinz Smolyan",
    },
  },
  fr: {
    nav: {
      home: "Accueil",
      about: "À propos",
      vote: "Voter",
      monitor: "Moniteur citoyen",
      publications: "Publications",
      signals: "Carte/Signaux",
      podcast: "Podcast",
      contacts: "Contacts",
      messenger: "SVMessenger",
      languages: "Langues",
      login: "Connexion",
      register: "Inscription",
      logout: "Déconnexion",
      menu: "Menu",
    },
    footer: {
      tagline:
        "Une plateforme pour la libre expression de l'opinion civique. Votre voix compte pour le développement des Rhodopes.",
      navHeading: "Navigation",
      nav: {
        events: "Votes",
        publications: "Publications",
        about: "À propos",
        faq: "FAQ",
      },
      participateHeading: "Participer",
      participate: {
        createEvent: "Créer un événement",
        createReferendum: "Créer un référendum",
        createPoll: "Créer un sondage",
        downloadApp: "Télécharger SVMessenger",
      },
      legalHeading: "Informations légales",
      legal: {
        terms: "Conditions d'utilisation et politique de confidentialité",
        cookies: "Politique de cookies",
      },
      contactHeading: "Contacts",
      contactHint: "Questions, idées et retours",
      contactCta: "Contactez-nous",
      location: "Smolyan, Bulgarie",
      newsletterTitle: "Newsletter",
      newsletterHint: "Nouveaux événements et mises à jour importantes",
      myProfile: "Mon profil",
      copyright: "© 2025 SmolyanVote. Tous droits réservés.",
      copyrightSub: "Plateforme citoyenne pour les initiatives de la province de Smolyan",
    },
  },
  es: {
    nav: {
      home: "Inicio",
      about: "Sobre nosotros",
      vote: "Vota",
      monitor: "Monitor ciudadano",
      publications: "Publicaciones",
      signals: "Mapa/Señales",
      podcast: "Podcast",
      contacts: "Contactos",
      messenger: "SVMessenger",
      languages: "Idiomas",
      login: "Iniciar sesión",
      register: "Registrarse",
      logout: "Cerrar sesión",
      menu: "Menú",
    },
    footer: {
      tagline:
        "Una plataforma para la libre expresión de la opinión ciudadana. Tu voz importa para el desarrollo de los Ródope.",
      navHeading: "Navegación",
      nav: {
        events: "Votaciones",
        publications: "Publicaciones",
        about: "Sobre nosotros",
        faq: "Preguntas frecuentes",
      },
      participateHeading: "Participa",
      participate: {
        createEvent: "Crear evento",
        createReferendum: "Crear referéndum",
        createPoll: "Crear encuesta",
        downloadApp: "Descargar SVMessenger",
      },
      legalHeading: "Información legal",
      legal: {
        terms: "Términos de uso y Política de privacidad",
        cookies: "Política de cookies",
      },
      contactHeading: "Contactos",
      contactHint: "Preguntas, ideas y comentarios",
      contactCta: "Contáctanos",
      location: "Smolyan, Bulgaria",
      newsletterTitle: "Boletín",
      newsletterHint: "Nuevos eventos y actualizaciones importantes",
      myProfile: "Mi perfil",
      copyright: "© 2025 SmolyanVote. Todos los derechos reservados.",
      copyrightSub: "Plataforma ciudadana para iniciativas de la provincia de Smolyan",
    },
  },
  iw: {
    nav: {
      home: "בית",
      about: "עלינו",
      vote: "הצבע",
      monitor: "מוניטור אזרחי",
      publications: "פרסומים",
      signals: "מפה/אותות",
      podcast: "פודקאסט",
      contacts: "צור קשר",
      messenger: "SVMessenger",
      languages: "שפות",
      login: "התחברות",
      register: "הרשמה",
      logout: "התנתקות",
      menu: "תפריט",
    },
    footer: {
      tagline: "פלטפורמה לביטוי חופשי של דעת הציבור. הקול שלך חשוב לפיתוח הרודופים.",
      navHeading: "ניווט",
      nav: {
        events: "הצבעות",
        publications: "פרסומים",
        about: "עלינו",
        faq: "שאלות נפוצות",
      },
      participateHeading: "השתתף",
      participate: {
        createEvent: "צור אירוע",
        createReferendum: "צור משאל עם",
        createPoll: "צור סקר",
        downloadApp: "הורד את SVMessenger",
      },
      legalHeading: "מידע משפטי",
      legal: {
        terms: "תנאי שימוש ומדיניות פרטיות",
        cookies: "מדיניות עוגיות",
      },
      contactHeading: "צור קשר",
      contactHint: "שאלות, רעיונות ומשוב",
      contactCta: "צור קשר איתנו",
      location: "סמולין, בולגריה",
      newsletterTitle: "ניוזלטר",
      newsletterHint: "אירועים חדשים ועדכונים חשובים",
      myProfile: "הפרופיל שלי",
      copyright: "© 2025 SmolyanVote. כל הזכויות שמורות.",
      copyrightSub: "פלטפורמה אזרחית ליזמות ממחוז סמולין",
    },
  },
  "zh-CN": {
    nav: {
      home: "首页",
      about: "关于我们",
      vote: "投票",
      monitor: "公民监督",
      publications: "出版物",
      signals: "地图/信号",
      podcast: "播客",
      contacts: "联系方式",
      messenger: "SVMessenger",
      languages: "语言",
      login: "登录",
      register: "注册",
      logout: "退出登录",
      menu: "菜单",
    },
    footer: {
      tagline: "一个自由表达公民意见的平台。您的声音对罗多彼地区的发展很重要。",
      navHeading: "导航",
      nav: {
        events: "投票",
        publications: "出版物",
        about: "关于我们",
        faq: "常见问题",
      },
      participateHeading: "参与",
      participate: {
        createEvent: "创建活动",
        createReferendum: "创建公投",
        createPoll: "创建投票",
        downloadApp: "下载 SVMessenger",
      },
      legalHeading: "法律信息",
      legal: {
        terms: "使用条款和隐私政策",
        cookies: "Cookie 政策",
      },
      contactHeading: "联系方式",
      contactHint: "问题、建议和反馈",
      contactCta: "联系我们",
      location: "斯莫扬，保加利亚",
      newsletterTitle: "通讯",
      newsletterHint: "新活动和重要更新",
      myProfile: "我的资料",
      copyright: "© 2025 SmolyanVote。保留所有权利。",
      copyrightSub: "斯莫扬州倡议的公民平台",
    },
  },
};

/** Parses the v1-compatible `googtrans=/bg/<lang>` cookie value. SSR-safe. */
export function resolveLanguageFromGoogtransCookie(cookieValue: string | undefined): Language {
  const match = cookieValue?.match(/^\/[^/]+\/([^/]+)$/);
  const lang = match?.[1];
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang ?? "")
    ? (lang as Language)
    : DEFAULT_LANGUAGE;
}

export function getShellMessages(lang: Language): ShellDictionary {
  return shellMessages[lang] ?? shellMessages[DEFAULT_LANGUAGE];
}
