/** CPV sector labels (subset from SIGMA config) — regional monitor only. */
export const CPV_SECTORS: Record<string, string> = {
  "09": "Енергия",
  "15": "Храни",
  "39": "Обзавеждане",
  "42": "Машини",
  "45": "Строителство",
  "48": "Софтуер",
  "50": "Ремонт",
  "55": "Хотели и ресторанти",
  "60": "Транспорт",
  "64": "Пощи и телеком",
  "71": "Архитектура и инженеринг",
  "72": "IT услуги",
  "79": "Бизнес услуги",
  "85": "Здраве и социални",
  "90": "Околна среда",
};

export function cpvLabel(code: string | null | undefined): string {
  if (!code || code.length < 2) return "Друго";
  const prefix = code.slice(0, 2);
  const name = CPV_SECTORS[prefix];
  return name ? `CPV ${prefix} — ${name}` : `CPV ${prefix}`;
}
