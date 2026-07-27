'use client';

// ============================================================================
// MODULE 1 — SUPER ADMIN
// Quản lý User & phân quyền · System Logs · Cấu hình tham số · Xem mọi module
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Settings, UserPlus, Users, ScrollText, SlidersHorizontal, Eye,
  ShieldCheck, ShieldOff, Trash2, Save,
} from 'lucide-react';
import {
  Card, PageHeader, Badge, EmptyState, AccessDenied, MockBadge,
  Modal, Field, inputCls, btnPrimary, btnGhost, thCls, tdCls, useToast, ToastView,
} from '@/components/ui';
import { useSession } from '@/lib/hooks';
import { canAccess, ROLE_LABEL, ROLE_HOME } from '@/lib/auth';
import { NAV_ITEMS } from '@/components/sidebar';
import { fetchTables, insertRow, updateRow, deleteRow, genId, subscribeTables } from '@/lib/supabase';
import { fmtDateTime } from '@/lib/garment-math';
import type { User, SystemLog, Setting, Role, Subcon } from '@/types/erp';

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
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [subcons, setSubcons] = useState<Subcon[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [fu, setFu] = useState({ username: '', password: '', name: '', role: 'md' as Role, subcon_id: '', buyer_brand: '' });
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data, isMock } = await fetchTables(['users', 'system_logs', 'settings', 'subcons']);
    setUsers(data.users as User[]);
    setLogs((data.system_logs as SystemLog[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    setSettings(data.settings as Setting[]);
    setSubcons(data.subcons as Subcon[]);
    setIsMock(isMock);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeTables(['users', 'system_logs'], () => { void load(); }), [load]);

  const writeLog = (action: string, detail: string) => {
    const row: SystemLog = { id: genId('SL'), user: session?.user.username ?? 'superadmin', action, detail, created_at: new Date().toISOString() };
    setLogs((prev) => [row, ...prev]);
    const { id: _omit, ...payload } = row;
    void insertRow('system_logs', payload);
  };

  const addUser = async () => {
    const row: User = {
      id: genId('U'), username: fu.username.trim().toLowerCase(), password: fu.password,
      role: fu.role, name: fu.name.trim(),
      avatar: fu.name.trim().split(' ').map((w) => w[0]).join('').slice(-2).toUpperCase() || 'ND',
      subcon_id: fu.role === 'subcon' ? (fu.subcon_id || null) : null,
      buyer_brand: fu.role === 'buyer' ? (fu.buyer_brand || null) : null,
      active: true,
    };
    setUsers((prev) => [...prev, row]);
    setShowAdd(false);
    const { id: _omit, ...payload } = row;
    const ok = await insertRow('users', payload);
    writeLog('TẠO USER', `Tạo tài khoản ${row.username} (${ROLE_LABEL[row.role]})`);
    showToast(ok ? `✓ Đã tạo user ${row.username}` : `Đã tạo user ${row.username} (offline)`);
    setFu({ username: '', password: '', name: '', role: 'md', subcon_id: '', buyer_brand: '' });
  };

  const toggleActive = async (u: User) => {
    const active = !u.active;
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active } : x)));
    await updateRow('users', u.id, { active });
    writeLog(active ? 'MỞ KHÓA USER' : 'KHÓA USER', `${u.username}`);
    showToast(`${active ? '✓ Đã mở khóa' : '⚠ Đã khóa'} tài khoản ${u.username}`);
  };

  const removeUser = async (u: User) => {
    if (u.role === 'superadmin') { showToast('Không thể xóa tài khoản Super Admin'); return; }
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    await deleteRow('users', u.id);
    writeLog('XÓA USER', `${u.username}`);
    showToast(`Đã xóa tài khoản ${u.username}`);
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
        <Card className="xl:col-span-2" title={`Người dùng hệ thống (${users.length})`} icon={Users}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thCls}>Tài khoản</th>
                  <th className={thCls}>Họ tên</th>
                  <th className={thCls}>Vai trò</th>
                  <th className={thCls}>Phạm vi dữ liệu</th>
                  <th className={thCls}>Trạng thái</th>
                  <th className={thCls}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-slate-50/70">
                    <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{u.username}</td>
                    <td className={tdCls}>
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[10px] font-bold text-white">{u.avatar}</span>
                        {u.name}
                      </span>
                    </td>
                    <td className={tdCls}><Badge tone={u.role === 'superadmin' ? 'rose' : 'indigo'}>{ROLE_LABEL[u.role]}</Badge></td>
                    <td className={`${tdCls} text-xs text-slate-500`}>
                      {u.subcon_id ? `Subcon: ${subcons.find((s) => s.id === u.subcon_id)?.name ?? u.subcon_id}` : u.buyer_brand ? `Brand: ${u.buyer_brand}` : 'Toàn hệ thống theo RBAC'}
                    </td>
                    <td className={tdCls}>
                      {u.active
                        ? <Badge tone="emerald" icon={ShieldCheck}>Hoạt động</Badge>
                        : <Badge tone="slate" icon={ShieldOff}>Đã khóa</Badge>}
                    </td>
                    <td className={tdCls}>
                      <span className="flex gap-1.5">
                        <button title={u.active ? 'Khóa' : 'Mở khóa'} onClick={() => void toggleActive(u)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-amber-600">
                          {u.active ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        </button>
                        <button title="Xóa" onClick={() => void removeUser(u)}
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <Field label="Tên đăng nhập" hint="chữ thường, viết liền không dấu">
            <input className={inputCls} value={fu.username} onChange={(e) => setFu({ ...fu, username: e.target.value })} />
          </Field>
          <Field label="Mật khẩu"><input className={inputCls} value={fu.password} onChange={(e) => setFu({ ...fu, password: e.target.value })} /></Field>
          <Field label="Họ tên hiển thị"><input className={inputCls} value={fu.name} onChange={(e) => setFu({ ...fu, name: e.target.value })} /></Field>
          <Field label="Vai trò">
            <select className={inputCls} value={fu.role} onChange={(e) => setFu({ ...fu, role: e.target.value as Role })}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
          {fu.role === 'subcon' && (
            <Field label="Gán xưởng Subcon">
              <select className={inputCls} value={fu.subcon_id} onChange={(e) => setFu({ ...fu, subcon_id: e.target.value })}>
                <option value="">— Chọn xưởng —</option>
                {subcons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </Field>
          )}
          {fu.role === 'buyer' && (
            <Field label="Gán nhãn hàng (Brand)"><input className={inputCls} value={fu.buyer_brand} onChange={(e) => setFu({ ...fu, buyer_brand: e.target.value })} placeholder="NORDIC EU" /></Field>
          )}
        </div>
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
          ⚠️ Demo: mật khẩu lưu dạng thường trong bảng users. Production phải chuyển sang Supabase Auth (bcrypt) + RLS.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className={btnGhost} onClick={() => setShowAdd(false)}>Hủy</button>
          <button className={btnPrimary} disabled={!fu.username.trim() || !fu.password || !fu.name.trim()} onClick={() => void addUser()}>
            <UserPlus className="h-4 w-4" /> Tạo tài khoản
          </button>
        </div>
      </Modal>

      <ToastView message={toast} />
    </div>
  );
}
