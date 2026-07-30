'use client';

// ============================================================================
// MODULE 1 — SUPER ADMIN
// Quản lý User & phân quyền · System Logs · Cấu hình tham số · Xem mọi module
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserPlus, Users, ScrollText, SlidersHorizontal, Eye, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card, PageHeader, Badge, EmptyState, AccessDenied, Field,
  inputCls, btnGhost, btnPrimary, thCls, tdCls,
} from '@/components/ui';
import { TableSkeleton, ErrorState } from '@/components/data-state';
import StaffTable from './staff-table';
import StaffFormDialog from './staff-form-dialog';
import { useSession } from '@/lib/hooks';
import { canAccess, ROLE_LABEL, ROLE_HOME } from '@/lib/auth';
import { NAV_ITEMS } from '@/components/sidebar';
import { fetchTables, insertRow, updateRow, genId, subscribeTables } from '@/lib/supabase';
import { fetchStaff, type Staff } from '@/lib/staff';
import { fetchStaffEmails } from './actions';
import { fmtDateTime } from '@/lib/garment-math';
import type { SystemLog, Setting, Role } from '@/types/erp';

const MODULE_PATH = '/admin';

const SETTING_LABEL: Record<string, string> = {
  gsm_default: 'GSM mặc định khi nhập kho vải',
  max_cutting_waste_percent: 'Trần hao hụt bàn cắt cho phép (%)',
  defect_warning_percent: 'Ngưỡng cảnh báo tỷ lệ lỗi (%)',
  safety_stock_factor: 'Hệ số tồn kho an toàn',
  four_point_threshold: 'Ngưỡng kiểm vải 4-Point (điểm/100 yd²)',
};

export default function AdminPage() {
  const { session, ready } = useSession();
  const [loading, setLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [staffError, setStaffError] = useState<string | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    // Nhân sự đọc riêng khỏi fetchTables vì fetchTables còn cơ chế fallback mock
    // cho các bảng nghiệp vụ khác. Danh sách tài khoản mà hiện dữ liệu giả thì
    // quản trị viên có thể khoá nhầm hoặc xoá nhầm người không tồn tại.
    try {
      const [{ data }, staffRes, mails] = await Promise.all([
        fetchTables(['system_logs', 'settings']),
        fetchStaff(),
        fetchStaffEmails().catch(() => ({}) as Record<string, string>),
      ]);

      setLogs(
        (data.system_logs as SystemLog[]).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
      setSettings(data.settings as Setting[]);
      setStaff(staffRes.rows);
      setStaffError(staffRes.error);
      setEmails(mails);
      setLogsError(null);
    } catch (e) {
      setLogsError(e instanceof Error ? e.message : 'Không tải được dữ liệu quản trị.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['system_logs'], () => { void load(); }), [load]);

  const writeLog = useCallback(
    (action: string, detail: string) => {
      const row: SystemLog = {
        id: genId('SL'),
        user: session?.user.username ?? 'superadmin',
        action,
        detail,
        created_at: new Date().toISOString(),
      };
      setLogs((prev) => [row, ...prev]);
      const { id: _omit, ...payload } = row;
      void insertRow('system_logs', payload);
    },
    [session],
  );

  const saveSettings = async () => {
    for (const s of settings) {
      const v = editedSettings[s.key];
      if (v !== undefined && v !== s.value) {
        setSettings((prev) => prev.map((x) => (x.key === s.key ? { ...x, value: v } : x)));
        void updateRow('settings', s.id, { value: v });
        writeLog('CẤU HÌNH', `${SETTING_LABEL[s.key] ?? s.key} → ${v}`);
      }
    }
    setEditedSettings({});
    toast.success('Đã lưu cấu hình hệ thống');
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader title="Super Admin" desc="Quản lý người dùng, phân quyền, log hệ thống và tham số vận hành"
        action={
          <button className={btnPrimary} onClick={() => setShowAdd(true)}>
            <UserPlus className="h-4 w-4" /> Tạo User
          </button>
        } />

      {/* Chuyển nhanh góc nhìn */}
      <Card title="Xem nhanh với vai trò (Impersonate view)" icon={Eye}>
        <div className="flex flex-wrap gap-2 p-5">
          {NAV_ITEMS.map((n) => (
            <Link key={n.path} href={n.path}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600">
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Users */}
        <Card className="xl:col-span-2" title={`Nhân sự hệ thống (${staff.length})`} icon={Users}>
          <StaffTable
            staff={staff}
            emails={emails}
            loading={loading}
            error={staffError}
            onRefresh={load}
          />
        </Card>

        {/* Settings */}
        <Card title="Tham số hệ thống" icon={SlidersHorizontal}
          action={<button className={btnGhost} onClick={() => void saveSettings()}><Save className="h-4 w-4" /> Lưu</button>}>
          <div className="space-y-4 p-5">
            {settings.length === 0 && <EmptyState title="Chưa có cấu hình" />}
            {settings.map((s) => (
              <Field key={s.key} label={SETTING_LABEL[s.key] ?? s.key}>
                <input className={inputCls} value={editedSettings[s.key] ?? s.value}
                  onChange={(e) => setEditedSettings((prev) => ({ ...prev, [s.key]: e.target.value }))} />
              </Field>
            ))}
            <p className="text-[11px] leading-relaxed text-slate-400">
              Các tham số này là ngưỡng dùng chung cho cảnh báo hao hụt cắt, tỷ lệ lỗi, kiểm vải 4-point và tồn kho an toàn trên toàn hệ thống.
            </p>
          </div>
        </Card>
      </div>

      {/* System logs */}
      <Card className="mt-5" title="Nhật ký hệ thống (System Logs)" icon={ScrollText}>
        <div className="max-h-[360px] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thCls}>Thời gian</th>
                <th className={thCls}>User</th>
                <th className={thCls}>Hành động</th>
                <th className={thCls}>Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    {loading ? (
                      <TableSkeleton columns={4} rows={4} />
                    ) : logsError ? (
                      <ErrorState message={logsError} onRetry={() => void load()} />
                    ) : (
                      <EmptyState title="Chưa có log" />
                    )}
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="transition hover:bg-slate-50/70">
                  <td className={`${tdCls} text-slate-400`}>{fmtDateTime(l.created_at)}</td>
                  <td className={`${tdCls} font-mono text-slate-600`}>{l.user}</td>
                  <td className={tdCls}><Badge tone="indigo">{l.action}</Badge></td>
                  <td className="px-4 py-3 text-sm text-slate-700">{l.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal tạo user */}
      <StaffFormDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={async () => {
          writeLog('TẠO USER', 'Tạo tài khoản mới qua màn hình Quản trị');
          await load();
        }}
      />

    </div>
  );
}
