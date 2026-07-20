import type { PublicationCategory } from "../types";

/** Mirrors backend `CategoryEnum` (`models/enums/CategoryEnum.java`). */
export const CATEGORIES: { value: PublicationCategory; label: string; icon: string }[] = [
  { value: "NEWS", label: "Новини", icon: "bi-newspaper" },
  { value: "INFRASTRUCTURE", label: "Инфраструктура", icon: "bi-cone-striped" },
  { value: "MUNICIPAL", label: "Община", icon: "bi-building" },
  { value: "INITIATIVES", label: "Граждански инициативи", icon: "bi-lightbulb" },
  { value: "CULTURE", label: "Културни събития", icon: "bi-palette" },
  { value: "OTHER", label: "Други", icon: "bi-three-dots" },
];

export function categoryLabel(value: PublicationCategory | null | undefined): string {
  if (!value) return "";
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function categoryIcon(value: PublicationCategory | null | undefined): string {
  if (!value) return "bi-tag";
  return CATEGORIES.find((c) => c.value === value)?.icon ?? "bi-tag";
}
