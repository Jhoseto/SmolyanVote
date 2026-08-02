/** Display order: mayor → ObS chair → deputies → committee chairs → councilors. */
export function councilorRoleRank(roleLabel: string | null | undefined): number {
  if (!roleLabel?.trim()) return 50;
  const role = roleLabel.trim().toLowerCase();
  if (role.includes("кмет")) return 0;
  if (role.includes("председател на обс") || role.includes("председател на общинск")) return 1;
  if (role.includes("зам") && role.includes("председател")) return 2;
  if (role.includes("председател на пк") || role.includes("постоянна комисия")) return 3;
  if (role.includes("съветник")) return 4;
  return 5;
}

export function compareCouncilorsByHierarchy(
  a: { fullName: string; roleLabel?: string | null },
  b: { fullName: string; roleLabel?: string | null },
): number {
  const byRole = councilorRoleRank(a.roleLabel) - councilorRoleRank(b.roleLabel);
  if (byRole !== 0) return byRole;
  return a.fullName.localeCompare(b.fullName, "bg");
}
