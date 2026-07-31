/** Citizen-facing labels for backend concernType codes. */

const LABELS: Record<string, string> = {
  SINGLE_BID: "Слаба конкуренция",
  LARGE_SINGLE_BID: "Слаба конкуренция",
  FRAGMENTATION: "Раздробяване",
  ABOVE_TYPICAL: "Над типичното",
  AMENDMENT_GROWTH: "Ръст от анекси",
  REPEAT_WINNER: "Повтарящ се победител",
  NEW_COMPANY_LARGE_CONTRACT: "Нова фирма",
  ABOVE_ESTIMATE: "Над прогнозата",
  EU_LOW_COMPETITION: "ЕС без конкуренция",
  SIGNED_BEFORE_PUBLICATION: "Нередност",
  ROUTINE: "Стандартна",
  LOW_COMPETITION: "Слаба конкуренция",
  OVERPRICE: "Висока цена",
  GOVERNANCE: "Управление",
  OTHER: "Риск",
};

export function concernLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return LABELS[code] ?? LABELS.OTHER;
}
