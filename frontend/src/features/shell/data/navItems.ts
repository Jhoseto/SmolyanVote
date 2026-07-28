import type { ShellDictionary } from "@/lib/i18n/locales";

export interface NavItem {
  key: keyof Pick<
    ShellDictionary["nav"],
    "home" | "about" | "vote" | "publications" | "signals" | "podcast"
  >;
  href: string;
  icon: string; // Bootstrap Icons class (v1 parity)
}

/** Primary navbar links — mirrors v1 `navbar.html` order & labels. */
export const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/", icon: "bi-house-door" },
  { key: "vote", href: "/events", icon: "bi-hand-index-thumb" },
  { key: "publications", href: "/publications", icon: "bi-chat-square-text" },
  { key: "signals", href: "/signals", icon: "bi-geo-alt-fill" },
  { key: "podcast", href: "/podcast", icon: "bi-broadcast" },
  { key: "about", href: "/about", icon: "bi-info-circle" },
];
