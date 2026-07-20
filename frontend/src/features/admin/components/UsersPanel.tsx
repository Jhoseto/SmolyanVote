"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
import { adminApi } from "../api";
import type { AdminUser, BanHistoryItem, UserRole, UserStatus } from "../types";
import { MetricGrid } from "./MetricGrid";

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Активен",
  PENDING_ACTIVATION: "Чака активация",
  TEMPORARILY_BANNED: "Врем. бан",
  PERMANENTLY_BANNED: "Перм. бан",
};

export function UsersPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"users" | "history">("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");
  const [sorting, setSorting] = useState<SortingState>([{ id: "created", desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [banTarget, setBanTarget] = useState<AdminUser[] | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);

  const statsQ = useQuery({
    queryKey: ["admin", "user-stats"],
    queryFn: () => adminApi.userStatistics(),
    enabled,
    staleTime: 30_000,
  });

  const usersQ = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.users(),
    enabled,
    staleTime: 15_000,
  });

  const historyQ = useQuery({
    queryKey: ["admin", "user-history"],
    queryFn: () => adminApi.history(),
    enabled: enabled && tab === "history",
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "user-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "user-history"] });
  };

  const filtered = useMemo(() => {
    let list = usersQ.data?.users ?? [];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          (u.email?.toLowerCase().includes(q) ?? false) ||
          (u.realName?.toLowerCase().includes(q) ?? false),
      );
    }
    if (roleFilter !== "ALL") list = list.filter((u) => u.role === roleFilter);
    if (statusFilter !== "ALL") list = list.filter((u) => u.status === statusFilter);
    return list;
  }, [usersQ.data, search, roleFilter, statusFilter]);

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
        cell: ({ getValue }) => (getValue() === "ADMIN" ? "Admin" : "User"),
      },
      {
        accessorKey: "status",
        header: "Статус",
        cell: ({ getValue }) => STATUS_LABEL[getValue() as UserStatus] ?? String(getValue()),
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
            <IconBtn title="Роля" icon="bi-shield" onClick={() => setRoleTarget(row.original)} />
            <IconBtn title="Бан" icon="bi-slash-circle" onClick={() => setBanTarget([row.original])} />
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (r) => String(r.id),
    initialState: { pagination: { pageSize: 20 } },
  });

  const selectedUsers = table.getSelectedRowModel().rows.map((r) => r.original);

  const banMut = useMutation({
    mutationFn: (args: {
      users: AdminUser[];
      reason: string;
      banType: string;
      durationDays?: number;
    }) => {
      if (args.users.length === 1) {
        return adminApi.banUser(args.users[0].id, {
          reason: args.reason,
          banType: args.banType,
          durationDays: args.durationDays,
        });
      }
      return adminApi.bulkBan({
        userIds: args.users.map((u) => u.id),
        banType: args.banType,
        reason: args.reason,
        durationDays: args.durationDays,
      });
    },
    onSuccess: () => {
      toast.success("Банът е приложен");
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

  async function runUnban(user: AdminUser) {
    const ok = await confirm({
      title: "Премахване на бан",
      description: `Премахване на бана на ${user.username}?`,
      confirmText: "Unban",
    });
    if (!ok) return;
    try {
      await adminApi.unbanUser(user.id);
      toast.success("Банът е премахнат");
      invalidate();
    } catch (e) {
      toast.error(errorMessage(e, "Unban не успя"));
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
        {(["users", "history"] as const).map((t) => (
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
            {t === "users" ? "Потребители" : "История роли/банове"}
          </button>
        ))}
      </div>

      {tab === "history" ? (
        <HistoryTable items={historyQ.data ?? []} loading={historyQ.isPending} />
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
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="rounded-[var(--radius-md)] border border-border-default/60 px-2 py-1.5 text-sm"
            >
              <option value="ALL">Всички роли</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-[var(--radius-md)] border border-border-default/60 px-2 py-1.5 text-sm"
            >
              <option value="ALL">Всички статуси</option>
              {(Object.keys(STATUS_LABEL) as UserStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
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
              {filtered.length} резултата · стр. {table.getState().pagination.pageIndex + 1}/
              {table.getPageCount() || 1}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                className="rounded border px-2 py-1 disabled:opacity-40"
              >
                Назад
              </button>
              <button
                type="button"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
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
          onUnban={() => void runUnban(detail)}
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
  onUnban,
  onActivate,
  onDelete,
}: {
  user: AdminUser;
  onClose: () => void;
  onBan: () => void;
  onRole: () => void;
  onUnban: () => void;
  onActivate: () => void;
  onDelete: () => void;
}) {
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
        <Field label="Локация" value={user.location || "—"} />
        <Field label="Бан причина" value={user.banReason || "—"} />
        <Field label="Бан от" value={user.bannedBy || "—"} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onRole} className="rounded bg-primary px-3 py-1.5 text-xs text-white">
          Смяна на роля
        </button>
        <button type="button" onClick={onBan} className="rounded bg-amber-600 px-3 py-1.5 text-xs text-white">
          Бан
        </button>
        <button type="button" onClick={onUnban} className="rounded border px-3 py-1.5 text-xs">
          Unban
        </button>
        <button type="button" onClick={onActivate} className="rounded border px-3 py-1.5 text-xs">
          Активирай
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded bg-[color:var(--color-error)] px-3 py-1.5 text-xs text-white"
        >
          Изтрий
        </button>
      </div>
    </Modal>
  );
}

function BanModal({
  users,
  busy,
  onClose,
  onSubmit,
}: {
  users: AdminUser[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (p: { reason: string; banType: string; durationDays?: number }) => void;
}) {
  const [reason, setReason] = useState("");
  const [banType, setBanType] = useState("TEMPORARY");
  const [days, setDays] = useState(7);

  return (
    <Modal title={`Бан · ${users.length} потребител(я)`} onClose={onClose}>
      <label className="block text-xs">
        Тип
        <select
          value={banType}
          onChange={(e) => setBanType(e.target.value)}
          className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
        >
          <option value="TEMPORARY">Временен</option>
          <option value="PERMANENT">Постоянен</option>
        </select>
      </label>
      {banType === "TEMPORARY" && (
        <label className="mt-2 block text-xs">
          Дни
          <input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
          />
        </label>
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
        disabled={!reason.trim() || busy}
        onClick={() =>
          onSubmit({
            reason: reason.trim(),
            banType,
            durationDays: banType === "TEMPORARY" ? days : undefined,
          })
        }
        className="mt-3 rounded bg-[color:var(--color-error)] px-4 py-2 text-sm text-white disabled:opacity-40"
      >
        Потвърди бан
      </button>
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
                    ? `${h.banType}${h.banDurationDays ? ` (${h.banDurationDays}д)` : ""}`
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
