import type { MonitorZpokonpiStatus } from "../types";

export function zpokonpiStatusLabel(status: MonitorZpokonpiStatus | string | null | undefined): string {
  switch (status) {
    case "OK":
      return "ЗПКОНПИ — потвърдено";
    case "ROSTER_ONLY":
      return "Състав — потвърден";
    case "WARNING":
      return "Внимание — несъответствие";
    case "NOT_FOUND":
      return "Липсва в регистъра";
    case "UNAVAILABLE":
      return "Източникът е недостъпен";
    case "PENDING":
    default:
      return "Проверката предстои";
  }
}

export function zpokonpiStatusClass(status: MonitorZpokonpiStatus | string | null | undefined): string {
  switch (status) {
    case "OK":
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
    case "ROSTER_ONLY":
      return "bg-sky-50 text-sky-900 border-sky-200";
    case "WARNING":
    case "NOT_FOUND":
      return "bg-amber-50 text-amber-900 border-amber-200";
    case "UNAVAILABLE":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "PENDING":
    default:
      return "bg-violet-50 text-violet-900 border-violet-200";
  }
}
