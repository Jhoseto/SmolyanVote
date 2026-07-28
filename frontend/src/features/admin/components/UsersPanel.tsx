"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, ErrorState, Skeleton } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/hooks/useToast";
import { useConfirm } from "@/shared/hooks/useConfirm";
import { errorMessage } from "@/shared/lib/errorMessage";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";
import { formatBanExpiry } from "@/shared/lib/formatBanExpiry";
import { adminApi } from "../api";
import type { AdminUser, BanHistoryItem, BulkResult, UserRole, UserStatus } from "../types";
import { MetricGrid } from "./MetricGrid";

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Активен",
  PENDING_ACTIVATION: "Чака активация",
  TEMPORARILY_BANNED: "Врем. бан",
  PERMANENTLY_BANNED: "Перм. бан",
};

function isUserBanned(user: AdminUser): boolean {
  return user.status === "TEMPORARILY_BANNED" || user.status === "PERMANENTLY_BANNED";
}

function isMasterAdminUser(user: AdminUser): boolean {
  return user.masterAdmin === true;
}

function formatBanHistoryDuration(h: BanHistoryItem): string {
  const parts: string[] = [];
  if (h.banDurationDays) parts.push(`${h.banDurationDays}д`);
  if (h.banDurationHours) parts.push(`${h.banDurationHours}ч`);
  return parts.join(" ");
}

export function UsersPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"users" | "history" | "strikes">("users");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");
  const [minStrikesFilter, setMinStrikesFilter] = useState<0 | 1 | 2>(0);
  const [sorting, setSorting] = useState<SortingState>([{ id: "created", desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [banTarget, setBanTarget] = useState<AdminUser[] | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const statsQ = useQuery({
    queryKey: ["admin", "user-stats"],
    queryFn: () => adminApi.userStatistics(),
    enabled,
    staleTime: 30_000,
  });

  const usersQ = useQuery({
    queryKey: ["admin", "users", page, debouncedSearch, roleFilter, statusFilter, minStrikesFilter],
    queryFn: () =>
      adminApi.users({
        page,
        size: 20,
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        minStrikes: minStrikesFilter > 0 ? minStrikesFilter : undefined,
      }),
    enabled,
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });

  const historyQ = useQuery({
    queryKey: ["admin", "user-history"],
    queryFn: () => adminApi.history(),
    enabled: enabled && tab === "history",
  });

  const strikesStatsQ = useQuery({
    queryKey: ["admin", "strike-stats"],
    queryFn: () => adminApi.strikeStatistics(),
    enabled: enabled && tab === "strikes",
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "user-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "user-history"] });
  };

  const users = usersQ.data?.users ?? [];
  const totalPages = usersQ.data?.totalPages ?? 1;
  const totalCount = usersQ.data?.totalCount ?? users.length;

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={isMasterAdminUser(row.original)}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 36,
      },
      {
        accessorKey: "username",
        header: "Потребител",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setDetail(row.original)}
            className="flex items-center gap-2 text-left hover:text-primary"
          >
            <Avatar username={row.original.username} imageUrl={row.original.imageUrl} size={28} />
            <span className="font-medium">{row.original.username}</span>
          </button>
        ),
      },
      { accessorKey: "email", header: "Имейл", cell: ({ getValue }) => getValue() || "—" },
      {
        accessorKey: "role",
        header: "Роля",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5">
            {row.original.role === "ADMIN" ? "Admin" : "User"}
            {isMasterAdminUser(row.original) && (
              <span className="rounded-[var(--radius-pill)] bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                Master
              </span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Статус",
        cell: ({ getValue }) => STATUS_LABEL[getValue() as UserStatus] ?? String(getValue()),
      },
      {
        id: "banEndDate",
        header: "Бан до",
        cell: ({ row }) => {
          const user = row.original;
          if (user.status === "PERMANENTLY_BANNED") {
            return <span className="text-[color:var(--color-text-muted)]">Перманентен</span>;
          }
          if (user.status !== "TEMPORARILY_BANNED") {
            return "—";
          }
          const expiry = formatBanExpiry(user.banEndDate);
          if (!expiry) return "—";
          return (
            <div className="min-w-[8.5rem]">
              <p className={cn("text-sm font-medium", expiry.expired ? "text-emerald-700" : "text-amber-800")}>
                {expiry.primary}
              </p>
              <p className="text-[11px] text-[color:var(--color-text-muted)]">{expiry.secondary}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "moderationStrikeCount",
        header: "Strikes",
        cell: ({ getValue }) => {
          const n = (getValue() as number | undefined) ?? 0;
          return (
            <span className={cn(n >= 2 && "font-semibold text-amber-700")}>{n}/3</span>
          );
        },
      },
      {
        accessorKey: "created",
        header: "Регистрация",
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v ? formatRelativeDate(v) : "—";
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <IconBtn title="Детайли" icon="bi-eye" onClick={() => setDetail(row.original)} />
            <IconBtn title="Парола" icon="bi-key" onClick={() => setPasswordTarget(row.original)} />
            {!isMasterAdminUser(row.original) && (
              <>
                <IconBtn title="Роля" icon="bi-shield" onClick={() => setRoleTarget(row.original)} />
                <IconBtn
                  title={isUserBanned(row.original) ? "Бан / премахни бан" : "Бан"}
                  icon="bi-slash-circle"
                  onClick={() => setBanTarget([row.original])}
                />
              </>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (r) => String(r.id),
    manualPagination: true,
    pageCount: totalPages,
  });

  const selectedUsers = table.getSelectedRowModel().rows.map((r) => r.original);

  const banMut = useMutation({
    mutationFn: (args: {
      users: AdminUser[];
      reason: string;
      banType: string;
      durationDays?: number;
      durationHours?: number;
    }) => {
      if (args.users.length === 1) {
        return adminApi.banUser(args.users[0].id, {
          reason: args.reason,
          banType: args.banType,
          durationDays: args.durationDays,
          durationHours: args.durationHours,
        });
      }
      return adminApi.bulkBan({
        userIds: args.users.map((u) => u.id),
        banType: args.banType,
        reason: args.reason,
        durationDays: args.durationDays,
        durationHours: args.durationHours,
      });
    },
    onSuccess: (result) => {
      if (result && typeof result === "object" && "errorCount" in result) {
        const r = result as BulkResult & { errorCount?: number; successCount?: number };
        if ((r.errorCount ?? 0) > 0 && (r.successCount ?? 0) === 0) {
          toast.error(r.errorMessages?.[0] ?? r.errors?.[0] ?? "Банът не успя");
          return;
        }
        if ((r.errorCount ?? 0) > 0) {
          toast.success(`Частичен успех: ${r.successCount ?? 0} OK, ${r.errorCount} грешки`);
        } else {
          toast.success("Банът е приложен");
        }
      } else {
        toast.success("Банът е приложен");
      }
      setBanTarget(null);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Банът не успя")),
  });

  const roleMut = useMutation({
    mutationFn: (args: { user: AdminUser; role: UserRole; reason: string }) =>
      adminApi.changeRole(args.user.id, { role: args.role, reason: args.reason }),
    onSuccess: () => {
      toast.success("Ролята е променена");
      setRoleTarget(null);
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e, "Смяната на роля не успя")),
  });

  const passwordMut = useMutation({
    mutationFn: (args: { user: AdminUser; password: string; confirmPassword: string; reason: string }) =>
      adminApi.changePassword(args.user.id, {
        password: args.password,
        confirmPassword: args.confirmPassword,
        reason: args.reason,
      }),
    onSuccess: () => {
      toast.success("Паролата е сменена");
      setPasswordTarget(null);
    },
    onError: (e) => toast.error(errorMessage(e, "Смяната на парола не успя")),
  });

  async function runBulkActivate() {
    if (selectedUsers.length === 0) return;
    const ok = await confirm({
      title: "Активиране",
      description: `Активиране на ${selectedUsers.length} потребителя?`,
      confirmText: "Активирай",
    });
    if (!ok) return;
    try {
      await adminApi.bulkActivate(selectedUsers.map((u) => u.id));
      toast.success("Активирани");
      setRowSelection({});
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e, "Грешка при активиране"));
    }
  }

  async function runBulkDelete() {
    if (selectedUsers.length === 0) return;
    const ok = await confirm({
      title: "Изтриване на профили",
      description: `Изтриване на ${selectedUsers.length} потребител(я)? Това е необратимо.`,
      confirmText: "Изтрий",
      destructive: true,
    });
    if (!ok) return;
    try {
      const r = await adminApi.bulkDeleteUsers(selectedUsers.map((u) => u.id));
      if ((r.errorCount ?? 0) > 0 && (r.successCount ?? 0) === 0) {
        toast.error(r.errorMessages?.[0] ?? "Изтриването не успя");
        return;
      }
      if ((r.errorCount ?? 0) > 0) {
        toast.success(`Частичен успех: ${r.successCount ?? 0} изтрити, ${r.errorCount} грешки`);
      } else {
        toast.success("Профилите са изтрити");
      }
      setRowSelection({});
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e, "Изтриването не успя"));
    }
  }

  async function runUnban(users: AdminUser | AdminUser[]) {
    const list = (Array.isArray(users) ? users : [users]).filter(isUserBanned);
    if (list.length === 0) return;
    const ok = await confirm({
      title: "Премахване на бан",
      description:
        list.length === 1
          ? `Премахване на бана на ${list[0].username}?`
          : `Премахване на бана на ${list.length} потребителя?`,
      confirmText: "Премахни бан",
    });
    if (!ok) return;
    try {
      let errors = 0;
      for (const user of list) {
        try {
          await adminApi.unbanUser(user.id);
        } catch {
          errors += 1;
        }
      }
      if (errors === list.length) {
        toast.error("Премахването на бана не успя");
        return;
      }
      if (errors > 0) {
        toast.success(`Частичен успех: ${list.length - errors} от ${list.length} отблокирани`);
      } else {
        toast.success(list.length === 1 ? "Банът е премахнат" : "Бановете са премахнати");
      }
      setBanTarget(null);
      if (detail && list.some((u) => u.id === detail.id)) {
        try {
          setDetail(await adminApi.user(detail.id));
        } catch {
          setDetail(null);
        }
      }
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e, "Премахването на бана не успя"));
    }
  }

  async function runDelete(user: AdminUser) {
    const ok = await confirm({
      title: "Изтриване",
      description: `Изтриване на ${user.username}? Това е необратимо.`,
      confirmText: "Изтрий",
      destructive: true,
    });
    if (!ok) return;
    try {
      await adminApi.deleteUser(user.id);
      toast.success("Изтрит");
      setDetail(null);
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e, "Изтриването не успя"));
    }
  }

  if (usersQ.isPending) return <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />;
  if (usersQ.isError) {
    return <ErrorState description="Потребителите не можаха да се заредят." onRetry={() => usersQ.refetch()} />;
  }

  const stats = statsQ.data;

  return (
    <div className="flex flex-col gap-4">
      {stats && (
        <MetricGrid
          items={[
            { label: "Общо", value: String(stats.totalUsers ?? 0) },
            { label: "Активни", value: String(stats.activeUsers ?? 0), tone: "ok" },
            { label: "Онлайн", value: String(stats.onlineUsers ?? 0) },
            { label: "Админи", value: String(stats.adminCount ?? 0) },
            { label: "Врем. бан", value: String(stats.tempBannedUsers ?? 0), tone: "warn" },
            { label: "Перм. бан", value: String(stats.permBannedUsers ?? 0), tone: "bad" },
            { label: "Днес", value: String(stats.todayRegistrations ?? 0) },
            { label: "Седмица", value: String(stats.weekRegistrations ?? 0) },
          ]}
        />
      )}

      <div className="flex gap-2 border-b border-border-default/60">
        {(
          [
            ["users", "Потребители"],
            ["strikes", "Strikes"],
            ["history", "История роли/банове"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-2 text-sm font-medium",
              tab === t
                ? "border-b-2 border-primary text-primary"
                : "text-[color:var(--color-text-muted)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "history" ? (
        <HistoryTable items={historyQ.data ?? []} loading={historyQ.isPending} />
      ) : tab === "strikes" ? (
        <div className="flex flex-col gap-4">
          {strikesStatsQ.data && (
            <MetricGrid
              items={[
                { label: "1 strike", value: String(strikesStatsQ.data.withOneStrike) },
                { label: "2 strikes", value: String(strikesStatsQ.data.withTwoStrikes), tone: "warn" },
                { label: "≥3 strikes", value: String(strikesStatsQ.data.withThreeOrMore), tone: "bad" },
                { label: "Auto-ban сега", value: String(strikesStatsQ.data.autoBannedNow), tone: "bad" },
              ]}
            />
          )}
          <button
            type="button"
            className="self-start rounded border px-3 py-1.5 text-sm"
            onClick={() => {
              setMinStrikesFilter(2);
              setTab("users");
            }}
          >
            Покажи потребители с ≥2 strikes
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Търси…"
              className="rounded-[var(--radius-md)] border border-border-default/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as typeof roleFilter);
                setPage(0);
              }}
              className="rounded-[var(--radius-md)] border border-border-default/60 px-2 py-1.5 text-sm"
            >
              <option value="ALL">Всички роли</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(0);
              }}
              className="rounded-[var(--radius-md)] border border-border-default/60 px-2 py-1.5 text-sm"
            >
              <option value="ALL">Всички статуси</option>
              {(Object.keys(STATUS_LABEL) as UserStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <select
              value={minStrikesFilter}
              onChange={(e) => {
                setMinStrikesFilter(Number(e.target.value) as 0 | 1 | 2);
                setPage(0);
              }}
              className="rounded-[var(--radius-md)] border border-border-default/60 px-2 py-1.5 text-sm"
            >
              <option value={0}>Всички strikes</option>
              <option value={1}>≥1 strike</option>
              <option value={2}>≥2 strikes</option>
            </select>
            <button
              type="button"
              onClick={() =>
                adminApi.exportUsersCsv({
                  search: debouncedSearch,
                  role: roleFilter,
                  status: statusFilter,
                  minStrikes: minStrikesFilter > 0 ? minStrikesFilter : undefined,
                })
              }
              className="rounded-[var(--radius-md)] border px-3 py-1.5 text-sm"
            >
              Export CSV
            </button>
            {selectedUsers.length > 0 && (
              <div className="ml-auto flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runBulkActivate()}
                  className="rounded-[var(--radius-md)] bg-primary px-3 py-1.5 text-xs text-white"
                >
                  Активирай ({selectedUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBanTarget(selectedUsers)}
                  className="rounded-[var(--radius-md)] bg-[color:var(--color-error)] px-3 py-1.5 text-xs text-white"
                >
                  Бан ({selectedUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => void runBulkDelete()}
                  className="rounded-[var(--radius-md)] bg-red-800 px-3 py-1.5 text-xs text-white"
                >
                  Изтрий ({selectedUsers.length})
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Promote to ADMIN",
                      description: `${selectedUsers.length} потребителя → ADMIN?`,
                      confirmText: "Promote",
                    });
                    if (!ok) return;
                    try {
                      await adminApi.bulkRoleChange(
                        selectedUsers.map((u) => u.id),
                        "ADMIN",
                      );
                      toast.success("Ролите са обновени");
                      setRowSelection({});
                      invalidate();
                    } catch (e) {
                      toast.error(errorMessage(e, "Bulk role не успя"));
                    }
                  }}
                  className="rounded-[var(--radius-md)] border border-border-default/60 px-3 py-1.5 text-xs"
                >
                  → ADMIN
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Demote to USER",
                      description: `${selectedUsers.length} потребителя → USER?`,
                      confirmText: "Demote",
                    });
                    if (!ok) return;
                    try {
                      await adminApi.bulkRoleChange(
                        selectedUsers.map((u) => u.id),
                        "USER",
                      );
                      toast.success("Ролите са обновени");
                      setRowSelection({});
                      invalidate();
                    } catch (e) {
                      toast.error(errorMessage(e, "Bulk role не успя"));
                    }
                  }}
                  className="rounded-[var(--radius-md)] border border-border-default/60 px-3 py-1.5 text-xs"
                >
                  → USER
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/60">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-[color:var(--color-surface-muted)] text-xs uppercase text-[color:var(--color-text-muted)]">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="cursor-pointer px-3 py-2 font-semibold"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-border-default/40 hover:bg-primary-50/40">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-[color:var(--color-text-muted)]">
            <span>
              {totalCount} общо · стр. {page + 1}/{totalPages || 1}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border px-2 py-1 disabled:opacity-40"
              >
                Назад
              </button>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-2 py-1 disabled:opacity-40"
              >
                Напред
              </button>
            </div>
          </div>
        </>
      )}

      {detail && (
        <UserDetailModal
          user={detail}
          onClose={() => setDetail(null)}
          onBan={() => setBanTarget([detail])}
          onRole={() => setRoleTarget(detail)}
          onPassword={() => setPasswordTarget(detail)}
          onUnban={() => void runUnban(detail)}
          onResetStrikes={async () => {
            const ok = await confirm({
              title: "Нулиране на strikes",
              description: `Нулиране на moderation strikes за ${detail.username}?`,
              confirmText: "Нулирай",
            });
            if (!ok) return;
            try {
              await adminApi.resetModerationStrikes(detail.id);
              toast.success("Strikes са нулирани");
              invalidate();
            } catch (e) {
              toast.error(errorMessage(e, "Нулирането не успя"));
            }
          }}
          onActivate={async () => {
            try {
              await adminApi.activateUser(detail.id);
              toast.success("Активиран");
              invalidate();
            } catch (e) {
              toast.error(errorMessage(e, "Активирането не успя"));
            }
          }}
          onDelete={() => void runDelete(detail)}
        />
      )}

      {banTarget && (
        <BanModal
          users={banTarget}
          busy={banMut.isPending}
          onClose={() => setBanTarget(null)}
          onSubmit={(payload) => banMut.mutate({ users: banTarget, ...payload })}
          onUnban={(users) => void runUnban(users)}
        />
      )}

      {roleTarget && (
        <RoleModal
          user={roleTarget}
          busy={roleMut.isPending}
          onClose={() => setRoleTarget(null)}
          onSubmit={(role, reason) => roleMut.mutate({ user: roleTarget, role, reason })}
        />
      )}

      {passwordTarget && (
        <PasswordModal
          user={passwordTarget}
          busy={passwordMut.isPending}
          onClose={() => setPasswordTarget(null)}
          onSubmit={(password, confirmPassword, reason) =>
            passwordMut.mutate({ user: passwordTarget, password, confirmPassword, reason })
          }
        />
      )}
    </div>
  );
}

function IconBtn({ title, icon, onClick }: { title: string; icon: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[color:var(--color-surface-muted)]"
    >
      <i className={cn("bi text-xs", icon)} />
    </button>
  );
}

function UserDetailModal({
  user,
  onClose,
  onBan,
  onRole,
  onPassword,
  onUnban,
  onResetStrikes,
  onActivate,
  onDelete,
}: {
  user: AdminUser;
  onClose: () => void;
  onBan: () => void;
  onRole: () => void;
  onPassword: () => void;
  onUnban: () => void;
  onResetStrikes: () => void;
  onActivate: () => void;
  onDelete: () => void;
}) {
  const banExpiry = user.status === "TEMPORARILY_BANNED" ? formatBanExpiry(user.banEndDate) : null;

  return (
    <Modal title={`Потребител · ${user.username}`} onClose={onClose}>
      <div className="flex items-center gap-3">
        <Avatar username={user.username} imageUrl={user.imageUrl} size={48} />
        <div>
          <p className="font-semibold">{user.realName || user.username}</p>
          <p className="text-xs text-[color:var(--color-text-muted)]">{user.email}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Field label="Роля" value={user.role} />
        <Field label="Статус" value={STATUS_LABEL[user.status]} />
        <Field label="Събития" value={String(user.userEventsCount)} />
        <Field label="Гласове" value={String(user.totalVotes)} />
        <Field label="Публикации" value={String(user.publicationsCount)} />
        <Field
          label="Moderation strikes"
          value={`${user.moderationStrikeCount ?? 0}/3`}
        />
        <Field label="Локация" value={user.location || "—"} />
        <Field label="Бан причина" value={user.banReason || "—"} />
        <Field label="Бан от" value={user.bannedBy || "—"} />
        {banExpiry && <Field label="Бан до" value={`${banExpiry.secondary} (${banExpiry.primary})`} />}
      </dl>
      {isMasterAdminUser(user) && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Master admin акаунт — защитен от бан, изтриване и понижение до USER.
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onPassword} className="rounded border px-3 py-1.5 text-xs">
          Смяна на парола
        </button>
        {!isMasterAdminUser(user) && (
          <>
            <button type="button" onClick={onRole} className="rounded bg-primary px-3 py-1.5 text-xs text-white">
              Смяна на роля
            </button>
            {isUserBanned(user) ? (
              <button
                type="button"
                onClick={onUnban}
                className="rounded bg-emerald-600 px-3 py-1.5 text-xs text-white"
              >
                Премахни бан
              </button>
            ) : (
              <button type="button" onClick={onBan} className="rounded bg-amber-600 px-3 py-1.5 text-xs text-white">
                Бан
              </button>
            )}
            {!isUserBanned(user) && (
              <button type="button" onClick={onActivate} className="rounded border px-3 py-1.5 text-xs">
                Активирай
              </button>
            )}
            {(user.moderationStrikeCount ?? 0) > 0 && (
              <button type="button" onClick={onResetStrikes} className="rounded border px-3 py-1.5 text-xs">
                Нулирай strikes
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="rounded bg-[color:var(--color-error)] px-3 py-1.5 text-xs text-white"
            >
              Изтрий
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

function BanModal({
  users,
  busy,
  onClose,
  onSubmit,
  onUnban,
}: {
  users: AdminUser[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (p: { reason: string; banType: string; durationDays?: number; durationHours?: number }) => void;
  onUnban: (users: AdminUser[]) => void;
}) {
  const [reason, setReason] = useState("");
  const [banType, setBanType] = useState("temporary");
  const [durationUnit, setDurationUnit] = useState<"days" | "hours">("days");
  const [duration, setDuration] = useState(7);

  const bannedUsers = users.filter(isUserBanned);
  const notBannedUsers = users.filter((u) => !isUserBanned(u));
  const allBanned = bannedUsers.length === users.length;

  return (
    <Modal
      title={allBanned ? `Блокиран · ${users.length} потребител(я)` : `Бан · ${users.length} потребител(я)`}
      onClose={onClose}
    >
      {bannedUsers.length > 0 && (
        <div className="mb-4 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            {bannedUsers.length === 1 ? "Текущ бан" : "Блокирани потребители"}
          </p>
          {bannedUsers.length === 1 ? (
            <div className="mt-2 space-y-1 text-sm text-emerald-950">
              <p>
                <span className="font-medium">{bannedUsers[0].username}</span> ·{" "}
                {STATUS_LABEL[bannedUsers[0].status]}
              </p>
              {bannedUsers[0].banReason && (
                <p className="text-xs text-emerald-900">Причина: {bannedUsers[0].banReason}</p>
              )}
              {bannedUsers[0].bannedBy && (
                <p className="text-xs text-emerald-900">От: {bannedUsers[0].bannedBy}</p>
              )}
              {bannedUsers[0].status === "TEMPORARILY_BANNED" && formatBanExpiry(bannedUsers[0].banEndDate) && (
                <p className="text-xs text-emerald-900">
                  Изтича: {formatBanExpiry(bannedUsers[0].banEndDate)!.secondary} (
                  {formatBanExpiry(bannedUsers[0].banEndDate)!.primary})
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-sm text-emerald-950">
              {bannedUsers.length} от {users.length} са блокирани.
            </p>
          )}
          <button
            type="button"
            onClick={() => onUnban(bannedUsers)}
            className="mt-3 rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
          >
            Премахни бан{bannedUsers.length > 1 ? ` (${bannedUsers.length})` : ""}
          </button>
        </div>
      )}

      {!allBanned && (
        <>
          {notBannedUsers.length > 0 && bannedUsers.length > 0 && (
            <p className="mb-3 text-xs text-[color:var(--color-text-muted)]">
              Формата по-долу ще блокира {notBannedUsers.length} неблокиран(и) потребител(я).
            </p>
          )}
          <label className="block text-xs">
            Тип
            <select
              value={banType}
              onChange={(e) => setBanType(e.target.value)}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            >
              <option value="temporary">Временен</option>
              <option value="permanent">Постоянен</option>
            </select>
          </label>
          {banType === "temporary" && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="block text-xs">
                Единица
                <select
                  value={durationUnit}
                  onChange={(e) => {
                    const unit = e.target.value as "days" | "hours";
                    setDurationUnit(unit);
                    setDuration(unit === "days" ? 7 : 24);
                  }}
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                >
                  <option value="days">Дни</option>
                  <option value="hours">Часове</option>
                </select>
              </label>
              <label className="block text-xs">
                {durationUnit === "days" ? "Дни" : "Часове"}
                <input
                  type="number"
                  min={1}
                  max={durationUnit === "hours" ? 720 : 365}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                />
              </label>
            </div>
          )}
          <label className="mt-2 block text-xs">
            Причина
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={!reason.trim() || busy || (banType === "temporary" && duration < 1)}
            onClick={() =>
              onSubmit({
                reason: reason.trim(),
                banType,
                durationDays: banType === "temporary" && durationUnit === "days" ? duration : undefined,
                durationHours: banType === "temporary" && durationUnit === "hours" ? duration : undefined,
              })
            }
            className="mt-3 rounded bg-[color:var(--color-error)] px-4 py-2 text-sm text-white disabled:opacity-40"
          >
            Потвърди бан
          </button>
        </>
      )}
    </Modal>
  );
}

function RoleModal({
  user,
  busy,
  onClose,
  onSubmit,
}: {
  user: AdminUser;
  busy: boolean;
  onClose: () => void;
  onSubmit: (role: UserRole, reason: string) => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role === "ADMIN" ? "USER" : "ADMIN");
  const [reason, setReason] = useState("");

  return (
    <Modal title={`Роля · ${user.username}`} onClose={onClose}>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        className="w-full rounded border px-2 py-1.5 text-sm"
      >
        <option value="USER">USER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Причина"
        rows={2}
        className="mt-2 w-full rounded border px-2 py-1.5 text-sm"
      />
      <button
        type="button"
        disabled={!reason.trim() || busy}
        onClick={() => onSubmit(role, reason.trim())}
        className="mt-3 rounded bg-primary px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        Запази
      </button>
    </Modal>
  );
}

function PasswordModal({
  user,
  busy,
  onClose,
  onSubmit,
}: {
  user: AdminUser;
  busy: boolean;
  onClose: () => void;
  onSubmit: (password: string, confirmPassword: string, reason: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("");

  const passwordsMatch = password === confirmPassword;
  const validLength = password.length >= 6;
  const canSubmit = validLength && passwordsMatch && reason.trim().length > 0 && !busy;

  return (
    <Modal title={`Парола · ${user.username}`} onClose={onClose}>
      <p className="mb-3 text-xs text-[color:var(--color-text-muted)]">
        Задава нова парола за потребителя. Минимум 6 символа. Действието се записва в activity log.
      </p>
      <label className="block text-xs">
        Нова парола
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
        />
      </label>
      {password.length > 0 && !validLength && (
        <p className="mt-1 text-xs text-[color:var(--color-error)]">Поне 6 символа</p>
      )}
      <label className="mt-2 block text-xs">
        Потвърди парола
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
        />
      </label>
      {confirmPassword.length > 0 && !passwordsMatch && (
        <p className="mt-1 text-xs text-[color:var(--color-error)]">Паролите не съвпадат</p>
      )}
      <label className="mt-2 block text-xs">
        Причина
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Защо се сменя паролата"
          rows={2}
          className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(password, confirmPassword, reason.trim())}
        className="mt-3 rounded bg-primary px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        Смени паролата
      </button>
    </Modal>
  );
}

function HistoryTable({ items, loading }: { items: BanHistoryItem[]; loading: boolean }) {
  if (loading) return <Skeleton className="h-48 w-full" />;
  if (items.length === 0) {
    return <p className="text-sm text-[color:var(--color-text-muted)]">Няма история.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border-default/60">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-[color:var(--color-surface-muted)] text-xs uppercase text-[color:var(--color-text-muted)]">
          <tr>
            <th className="px-3 py-2">Кога</th>
            <th className="px-3 py-2">Действие</th>
            <th className="px-3 py-2">Цел</th>
            <th className="px-3 py-2">Админ</th>
            <th className="px-3 py-2">Детайли</th>
          </tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={h.id} className="border-t border-border-default/40">
              <td className="px-3 py-2 text-xs">
                {h.actionTimestamp ? formatRelativeDate(h.actionTimestamp) : "—"}
              </td>
              <td className="px-3 py-2">{h.actionType}</td>
              <td className="px-3 py-2">{h.targetUsername}</td>
              <td className="px-3 py-2">{h.adminUsername}</td>
              <td className="px-3 py-2 text-xs text-[color:var(--color-text-secondary)]">
                {h.actionType === "ROLE_CHANGE"
                  ? `${h.oldRole} → ${h.newRole}`
                  : h.banType
                    ? `${h.banType}${formatBanHistoryDuration(h) ? ` (${formatBanHistoryDuration(h)})` : ""}`
                    : ""}
                {h.reason ? ` · ${h.reason}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] bg-white p-5 shadow-[var(--shadow-dropdown)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Затвори">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[color:var(--color-text-muted)]">{label}</dt>
      <dd className="font-medium text-[color:var(--color-text-heading)]">{value}</dd>
    </div>
  );
}
