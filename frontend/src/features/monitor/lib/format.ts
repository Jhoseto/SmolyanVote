const eur = new Intl.NumberFormat("bg-BG", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatEur(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return eur.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    const parts = value.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return value;
  }
  return d.toLocaleDateString("bg-BG");
}

export function formatFreshness(iso: string | null | undefined): string {
  if (!iso) return "Няма данни";
  return formatDate(iso);
}

export function riskTone(score: number | null | undefined): "low" | "medium" | "high" | "none" {
  if (score == null || score <= 0) return "none";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  return "low";
}
