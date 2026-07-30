'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, ShieldCheck, ShieldOff, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

import { Badge, thCls, tdCls } from '@/components/ui';
import { TableSkeleton, ErrorState, NoData } from '@/components/data-state';
import { ROLE_LABEL } from '@/lib/rbac';
import type { Staff } from '@/lib/staff';
import { setStaffActive, deleteStaffAccount, resetStaffPassword } from './actions';
import { resetPasswordSchema } from './staff-schema';

interface Props {
  staff: Staff[];
  emails: Record<string, string>;
  loading: boolean;
  error: string | null;
  onRefresh: () => void | Promise<void>;
}

export default function StaffTable({ staff, emails, loading, error, onRefresh }: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  if (loading) return <TableSkeleton columns={6} rows={7} />;
  if (error) return <ErrorState message={error} onRetry={() => void onRefresh()} />;
  if (staff.length === 0) {
    return (
      <NoData
        title="Chưa có nhân sự nào"
        sub="Chạy scripts/seed-users.mjs để tạo tài khoản cho các phòng ban, hoặc bấm Tạo User."
      />
    );
  }

  /** Bọc chung: khoá nút đang thao tác, hiện toast, nạp lại nếu thành công. */
  async function run(id: string, fn: () => Promise<{ ok: boolean; message: string }>, okTitle: string) {
    setBusy(id);
    try {
      const res = await fn();
      if (res.ok) {
        toast.success(okTitle, { description: res.message });
        await onRefresh();
      } else {
        toast.error('Thao tác thất bại', { description: res.message });
      }
    } catch (e) {
      toast.error('Thao tác thất bại', {
        description: e instanceof Error ? e.message : 'Lỗi không xác định',
      });
    } finally {
      setBusy(null);
    }
  }

  function onResetPassword(u: Staff) {
    const input = window.prompt(`Mật khẩu mới cho "${u.fullName}" (tối thiểu 10 ký tự):`, '');
    if (input === null) return;

    // Validate ngay ở client để không tốn một vòng gọi máy chủ chỉ để bị từ chối
    const parsed = resetPasswordSchema.safeParse({ userId: u.id, password: input });
    if (!parsed.success) {
      toast.error('Mật khẩu không hợp lệ', {
        description: parsed.error.issues[0]?.message ?? 'Vui lòng kiểm tra lại',
      });
      return;
    }

    void run(u.id, () => resetStaffPassword(parsed.data.userId, parsed.data.password), 'Đã đặt lại mật khẩu');
  }

  function onDelete(u: Staff) {
    if (u.role === 'superadmin') {
      toast.error('Không thể xoá Super Admin', { description: 'Xoá xong sẽ không còn ai quản trị hệ thống.' });
      return;
    }
    if (!window.confirm(`Xoá vĩnh viễn tài khoản "${u.fullName}"? Thao tác này không hoàn tác được.`)) return;
    void run(u.id, () => deleteStaffAccount(u.id), 'Đã xoá tài khoản');
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className={thCls}>Mã NV</th>
            <th className={thCls}>Họ tên</th>
            <th className={thCls}>Vai trò</th>
            <th className={thCls}>Phòng ban</th>
            <th className={thCls}>Trạng thái</th>
            <th className={thCls}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {staff.map((u) => {
            const isBusy = busy === u.id;
            return (
              <tr key={u.id} className="transition hover:bg-slate-50/70">
                <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{u.employeeCode ?? '—'}</td>
                <td className={tdCls}>
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-[10px] font-bold text-white">
                      {u.avatar}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">{u.fullName}</span>
                      <span className="block truncate text-xs text-slate-400">{emails[u.id] ?? ''}</span>
                    </span>
                  </span>
                </td>
                <td className={tdCls}>
                  {u.role ? (
                    <Badge tone={u.role === 'superadmin' ? 'rose' : 'indigo'}>{ROLE_LABEL[u.role]}</Badge>
                  ) : (
                    <Badge tone="amber" icon={AlertTriangle}>Chưa phân quyền</Badge>
                  )}
                </td>
                <td className={`${tdCls} text-xs text-slate-500`}>{u.departmentName ?? '—'}</td>
                <td className={tdCls}>
                  {u.isActive ? (
                    <Badge tone="emerald" icon={ShieldCheck}>Hoạt động</Badge>
                  ) : (
                    <Badge tone="slate" icon={ShieldOff}>Đã khóa</Badge>
                  )}
                </td>
                <td className={tdCls}>
                  <span className="flex gap-1.5">
                    {isBusy ? (
                      <span className="flex h-8 w-8 items-center justify-center text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </span>
                    ) : (
                      <>
                        <button
                          title="Đặt lại mật khẩu"
                          onClick={() => onResetPassword(u)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-blue-600"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          title={u.isActive ? 'Khóa' : 'Mở khóa'}
                          onClick={() =>
                            void run(
                              u.id,
                              () => setStaffActive(u.id, !u.isActive),
                              u.isActive ? 'Đã khoá tài khoản' : 'Đã mở khoá',
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-amber-600"
                        >
                          {u.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </button>
                        <button
                          title="Xóa"
                          disabled={u.role === 'superadmin'}
                          onClick={() => onDelete(u)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-rose-600 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
