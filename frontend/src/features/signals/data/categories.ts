import type { SignalCategory } from "../types";

/** Mirrors backend `SignalsCategory` display names + Bootstrap icons (порт на legacy `signal-management.js` category map). */
export const SIGNAL_CATEGORIES: { value: SignalCategory; label: string; icon: string }[] = [
  { value: "ROAD_DAMAGE", label: "Дупки в пътищата", icon: "bi-cone-striped" },
  { value: "SIDEWALK_DAMAGE", label: "Счупени тротоари", icon: "bi-bricks" },
  { value: "LIGHTING", label: "Неработещо осветление", icon: "bi-lightbulb" },
  { value: "TRAFFIC_SIGNS", label: "Повредени пътни знаци", icon: "bi-sign-turn-right" },
  { value: "WATER_SEWER", label: "Водопровод/канализация", icon: "bi-droplet" },
  { value: "WASTE_MANAGEMENT", label: "Замърсяване на околната среда", icon: "bi-trash" },
  { value: "ILLEGAL_DUMPING", label: "Незаконно изхвърляне на отпадъци", icon: "bi-trash3" },
  { value: "TREE_ISSUES", label: "Проблеми с дървета и растителност", icon: "bi-tree" },
  { value: "AIR_POLLUTION", label: "Замърсяване на въздуха", icon: "bi-cloud-haze2" },
  { value: "NOISE_POLLUTION", label: "Шумово замърсяване", icon: "bi-volume-up" },
  { value: "HEALTHCARE", label: "Здравеопазване", icon: "bi-heart-pulse" },
  { value: "EDUCATION", label: "Образование", icon: "bi-book" },
  { value: "TRANSPORT", label: "Обществен транспорт", icon: "bi-bus-front" },
  { value: "PARKING", label: "Паркиране", icon: "bi-p-circle" },
  { value: "SECURITY", label: "Обществена безопасност", icon: "bi-shield-exclamation" },
  { value: "VANDALISM", label: "Вандализъм", icon: "bi-emoji-frown" },
  { value: "ACCESSIBILITY", label: "Достъпност", icon: "bi-universal-access" },
  { value: "OTHER", label: "Други", icon: "bi-three-dots" },
];

const BY_VALUE = new Map(SIGNAL_CATEGORIES.map((c) => [c.value, c]));

export function categoryLabel(category: SignalCategory): string {
  return BY_VALUE.get(category)?.label ?? category;
}

export function categoryIcon(category: SignalCategory): string {
  return BY_VALUE.get(category)?.icon ?? "bi-flag";
}
