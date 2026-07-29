'use client';

// ============================================================================
// MODULE 1 — SUPER ADMIN
// Quản lý User & phân quyền · System Logs · Cấu hình tham số · Xem mọi module
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Settings, UserPlus, Users, ScrollText, SlidersHorizontal, Eye,
  ShieldCheck, ShieldOff, Trash2, Save, KeyRound, AlertTriangle,
} from 'lucide-react';
import {
  Card, PageHeader, Badge, EmptyState, AccessDenied, MockBadge,
  Modal, Field, inputCls, btnPrimary, btnGhost, thCls, tdCls, useToast, ToastView,
} from '@/components/ui';
import { useSession } from '@/lib/hooks';
import { canAccess, ROLE_LABEL, ROLE_HOME } from '@/lib/auth';
import { NAV_ITEMS } from '@/components/sidebar';
import { fetchTables, insertRow, updateRow, genId, subscribeTables } from '@/lib/supabase';
import { fetchStaff, type Staff } from '@/lib/staff';
import {
  createStaffAccount, setStaffActive, deleteStaffAccount, resetStaffPassword, fetchStaffEmails,
} from './actions';
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
  const { toast, showToast } = useToast();

  const [isMock, setIsMock] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [staffError, setStaffError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [fu, setFu] = useState({ email: '', password: '', name: '', employeeCode: '', role: 'md' as Role });
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    // Nhân sự đọc riêng khỏi fetchTables: fetchTables tự rơi về dữ liệu demo
    // khi lỗi, mà danh sách tài khoản hiện dữ liệu giả thì quản trị viên có thể
    // khoá nhầm hoặc xoá nhầm người không tồn tại.
    const [{ data, isMock }, staffRes] = await Promise.all([
      fetchTables(['system_logs', 'settings']),
      fetchStaff(),
    ]);
    setLogs((data.system_logs as SystemLog[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setSettings(data.settings as Setting[]);
    setIsMock(isMock);
    setStaff(staffRes.rows);
    setStaffError(staffRes.error);

    // Email nằm ở schema auth, trình duyệt không với tới -> lấy qua Server Action
    try {
      setEmails(await fetchStaffEmails());
    } catch {
      setEmails({});
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['system_logs'], () => { void load(); }), [load]);

  const writeLog = (action: string, detail: string) => {
    const row: SystemLog = { id: genId('SL'), user: session?.user.username ?? 'superadmin', action, detail, created_at: new Date().toISOString() };
    setLogs((prev) => [row, ...prev]);
    const { id: _omit, ...payload } = row;
    void insertRow('system_logs', payload);
  };

  const addUser = async () => {
    setBusy('create');
    const res = await createStaffAccount({
      email: fu.email, fullName: fu.name, role: fu.role,
      employeeCode: fu.employeeCode, password: fu.password,
    });
    setBusy(null);
    showToast(res.ok ? `✓ ${res.message}` : `⚠ ${res.message}`);
    if (res.ok) {
      setShowAdd(false);
      setFu({ email: '', password: '', name: '', employeeCode: '', role: 'md' });
      writeLog('TẠO USER', `${fu.email} (${ROLE_LABEL[fu.role]})`);
      await load();
    }
  };

  const toggleActive = async (u: Staff) => {
    setBusy(u.id);
    const res = await setStaffActive(u.id, !u.isActive);
    setBusy(null);
    showToast(res.ok ? `✓ ${res.message}` : `⚠ ${res.message}`);
    if (res.ok) {
      writeLog(u.isActive ? 'KHÓA USER' : 'MỞ KHÓA USER', u.fullName);
      await load();
    }
  };

  const removeUser = async (u: Staff) => {
    if (u.role === 'superadmin') { showToast('Không thể xóa tài khoản Super Admin'); return; }
    if (!window.confirm(`Xóa vĩnh viễn tài khoản "${u.fullName}"? Thao tác này không hoàn tác được.`)) return;
    setBusy(u.id);
    const res = await deleteStaffAccount(u.id);
    setBusy(null);
    showToast(res.ok ? `✓ ${res.message}` : `⚠ ${res.message}`);
    if (res.ok) { writeLog('XÓA USER', u.fullName); await load(); }
  };

  const resetPassword = async (u: Staff) => {
    const pw = window.prompt(`Mật khẩu mới cho "${u.fullName}" (tối thiểu 10 ký tự):`, 'Monica@2026');
    if (!pw) return;
    setBusy(u.id);
    const res = await resetStaffPassword(u.id, pw);
    setBusy(null);
    showToast(res.ok ? `✓ ${res.message}` : `⚠ ${res.message}`);
    if (res.ok) writeLog('ĐẶT LẠI MẬT KHẨU', u.fullName);
  };

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
    showToast('✓ Đã lưu cấu hình hệ thống');
  };

  if (!ready) return null;
  if (!session || !canAccess(session.user.role, MODULE_PATH)) return <AccessDenied />;

  return (
    <div>
      <PageHeader title="Super Admin" desc="Quản lý người dùng, phân quyền, log hệ thống và tham số vận hành"
        action={
          <div className="flex items-center gap-2">
            <MockBadge show={isMock} />
            <button className={btnPrimary} onClick={() => setShowAdd(true)}><UserPlus className="h-4 w-4" /> Tạo User</button>
          </div>
        } />

      {/* Chuyển nhanh góc nhìn */}
      <Card title="Xem nhanh với vai trò (Impersonate view)" icon={Eye}>
        <div className="flex flex-wrap gap-2 p-5">
          {NAV_ITEMS.map((n) => (
            <Link key={n.path} href={n.path}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600">
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Users */}
        <Card className="xl:col-span-2" title={`Nhân sự hệ thống (${staff.length})`} icon={Users}>
          {staffError && (
            <p role="alert" className="m-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              {staffError}
            </p>
          )}

          {!staffError && staff.length === 0 && (
            <EmptyState title="Chưa có nhân sự nào" sub="Chạy scripts/seed-users.mjs để tạo tài khoản cho các phòng ban." />
          )}

          {staff.length > 0 && (
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
                  {staff.map((u) => (
                    <tr key={u.id} className="transition hover:bg-slate-50/70">
                      <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{u.employeeCode ?? '—'}</td>
                      <td className={tdCls}>
                        <span className="flex items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">{u.avatar}</span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-800">{u.fullName}</span>
                            <span className="block truncate text-xs text-slate-400">{emails[u.id] ?? ''}</span>
                          </span>
                        </span>
                      </td>
                      <td className={tdCls}>
                        {u.role
                          ? <Badge tone={u.role === 'superadmin' ? 'rose' : 'indigo'}>{ROLE_LABEL[u.role]}</Badge>
                          : <Badge tone="amber" icon={AlertTriangle}>Chưa phân quyền</Badge>}
                      </td>
                      <td className={`${tdCls} text-xs text-slate-500`}>{u.departmentName ?? '—'}</td>
                      <td className={tdCls}>
                        {u.isActive
                          ? <Badge tone="emerald" icon={ShieldCheck}>Hoạt động</Badge>
                          : <Badge tone="slate" icon={ShieldOff}>Đã khóa</Badge>}
                      </td>
                      <td className={tdCls}>
                        <span className="flex gap-1.5">
                          <button title="Đặt lại mật khẩu" disabled={busy === u.id} onClick={() => void resetPassword(u)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-indigo-600 disabled:opacity-40">
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button title={u.isActive ? 'Khóa' : 'Mở khóa'} disabled={busy === u.id} onClick={() => void toggleActive(u)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-amber-600 disabled:opacity-40">
                            {u.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                          </button>
                          <button title="Xóa" disabled={busy === u.id || u.role === 'superadmin'} onClick={() => void removeUser(u)}
                            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-rose-600 disabled:opacity-40">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
        <div className="max-h-[360px] overflow-y-auto">
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
              {logs.length === 0 && <tr><td colSpan={4}><EmptyState title="Chưa có log" /></td></tr>}
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
      <Modal open={showAdd} title="Tạo tài khoản mới" onClose={() => setShowAdd(false)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email công ty" hint="dùng để đăng nhập">
            <input className={inputCls} type="email" value={fu.email}
              onChange={(e) => setFu({ ...fu, email: e.target.value })} placeholder="ten.ban@monicagarment.vn" />
          </Field>
          <Field label="Mã nhân viên">
            <input className={inputCls} value={fu.employeeCode}
              onChange={(e) => setFu({ ...fu, employeeCode: e.target.value })} placeholder="WH-003" />
          </Field>
          <Field label="Họ tên hiển thị">
            <input className={inputCls} value={fu.name} onChange={(e) => setFu({ ...fu, name: e.target.value })} />
          </Field>
          <Field label="Vai trò">
            <select className={inputCls} value={fu.role} onChange={(e) => setFu({ ...fu, role: e.target.value as Role })}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
          <Field label="Mật khẩu khởi tạo" hint="tối thiểu 10 ký tự">
            <input className={inputCls} value={fu.password}
              onChange={(e) => setFu({ ...fu, password: e.target.value })} placeholder="Monica@2026" />
          </Field>
        </div>
        <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] leading-relaxed text-indigo-800">
          Tài khoản được tạo qua Supabase Auth, mật khẩu lưu dưới dạng băm. Hệ thống tự bật cờ
          buộc đổi mật khẩu ở lần đăng nhập đầu tiên, nên mật khẩu khởi tạo chỉ sống đúng một phiên.
          Hãy gửi riêng cho từng người, đừng dán chung vào nhóm chat.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setShowAdd(false)}>Hủy</button>
          <button className={btnPrimary} disabled={busy === 'create'} onClick={() => void addUser()}>
            <UserPlus className="h-4 w-4" /> {busy === 'create' ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
