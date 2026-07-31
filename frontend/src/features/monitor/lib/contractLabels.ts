/** Human-readable labels for SIGMA contract fields shown in the detail view. */

export const CONTRACTOR_KIND_LABELS: Record<string, string> = {
  company: "Юридическо лице",
  individual: "Физическо лице",
  consortium: "Консорциум",
  foreign: "Чуждестранен изпълнител",
};

export function contractorKindLabel(kind: string | null | undefined): string | null {
  if (!kind) return null;
  return CONTRACTOR_KIND_LABELS[kind.toLowerCase()] ?? kind;
}

export const REGION_SCOPE_LABELS: Record<string, string> = {
  SMOLYAN_CITY: "Община Смолян",
  OBLAST_SMOLYAN: "Област Смолян",
};

export function regionScopeLabel(scope: string | null | undefined): string | null {
  if (!scope) return null;
  return REGION_SCOPE_LABELS[scope] ?? scope;
}

export const DATA_SOURCE_LABELS: Record<string, string> = {
  SIGMA: "Регистър SIGMA (sigma.midt.bg)",
  EOP: "Отворени данни ЦАИС ЕОП",
};

export function dataSourceLabel(source: string | null | undefined): string | null {
  if (!source) return null;
  return DATA_SOURCE_LABELS[source] ?? source;
}

export function formatInstant(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("bg-BG");
  } catch {
    return iso;
  }
}

export function yesNo(value: boolean): string {
  return value ? "Да" : "Не";
}
