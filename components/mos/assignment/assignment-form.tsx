'use client';

import { useState } from 'react';
import { Info, Lock } from 'lucide-react';

import { Modal, Field, btnPrimary, btnGhost, inputCls } from '@/components/ui';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import { ASSIGNMENT_PRIORITIES, SCOPE_LEVELS, type ScopeLevel } from '@/lib/mos/domain/assignment';
import { DEFAULT_SCOPE_LEVEL } from '@/lib/mos/policies/scope-availability.policy';
import { useExecutionPartners, useScopeOptions } from '@/lib/mos/hooks/use-master-data';
import { useCreateAssignment } from '@/lib/mos/hooks/use-assignment-mutations';

// ============================================================================
// BIỂU MẪU LẬP PHẦN VIỆC
//
// ─── HAI THỨ BIỂU MẪU NÀY KHÔNG LÀM ──────────────────────────────────────
//   ✗ KHÔNG tự sinh `requestId`. Hook `useCreateAssignment` giữ độc quyền, và
//     sinh nó lúc hook GẮN VÀO — tức là lúc biểu mẫu mở. Để biểu mẫu tự sinh
//     thì sớm muộn có biểu mẫu sinh lúc BẤM, và cột `request_id` thành đồ trang
//     trí mà không ai nhận ra.
//   ✗ KHÔNG tự quyết cấp phạm vi nào dùng được. Đó là việc của
//     `policies/scope-availability.policy.ts`.
//
// ─── VÌ SAO Ô NGÀY ĐỂ TRỐNG ĐƯỢC ─────────────────────────────────────────
// Cột `planned_start`/`planned_finish` là nullable ở 029, cố ý. Lúc soạn nháp
// chưa biết ngày; ép nhập sẽ đẩy người dùng gõ ngày giả cho xong — đúng lỗi
// `etd_date DEFAULT CURRENT_DATE` của migration 024.
//
// Điều kiện "đủ hai ngày mới được giao việc" nằm ở `canTransition`, và nó sẽ
// chặn đúng lúc bấm "Giao việc".
// ============================================================================

export interface AssignmentFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: (assignmentId: string) => void;
}

export function AssignmentForm({ open, onClose, onCreated }: AssignmentFormProps) {
  const { t } = useLanguage();
  const partners = useExecutionPartners();
  const scope = useScopeOptions();
  const create = useCreateAssignment();

  const [partnerId, setPartnerId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [scopeLevel, setScopeLevel] = useState<ScopeLevel>(DEFAULT_SCOPE_LEVEL);
  const [siteId, setSiteId] = useState('');
  const [lineId, setLineId] = useState('');
  const [assignedQty, setAssignedQty] = useState('');
  const [uom, setUom] = useState('PCS');
  const [priority, setPriority] = useState('NORMAL');
  const [plannedStart, setPlannedStart] = useState('');
  const [plannedFinish, setPlannedFinish] = useState('');

  const levelInfo = scope.levels.find((l) => l.level === scopeLevel);
  const linesOfSite = (scope.data?.lines ?? []).filter((l) => l.siteId === siteId);

  // ⚠️ Chỉ những cột THUỘC cấp đã chọn mới được gửi đi. Gửi kèm `line_id` khi
  // cấp là `ORDER` sẽ bị `assignments_scope_shape` từ chối với mã 23514 —
  // ràng buộc kiểm CẢ HAI CHIỀU: thiếu cột và thừa cột.
  const needsSite = scopeLevel !== 'ORDER';
  const needsLine = scopeLevel === 'LINE' || scopeLevel === 'STYLE_OPERATION';

  const canSubmit =
    partnerId !== '' &&
    orderId !== '' &&
    (levelInfo?.available ?? false) &&
    (!needsSite || siteId !== '') &&
    (!needsLine || lineId !== '') &&
    !create.isRunning;

  async function submit() {
    const res = await create.run({
      partnerId,
      orderId,
      scopeLevel,
      siteId: needsSite ? siteId : null,
      lineId: needsLine ? lineId : null,
      styleOperationId: null,
      assignedQty: assignedQty === '' ? null : Number(assignedQty),
      uom: uom || null,
      priority,
      plannedStart: plannedStart || null,
      plannedFinish: plannedFinish || null,
    });
    if (res.ok && res.id) onCreated(res.id);
  }

  const loading = partners.isLoading || scope.isLoading;
  const loadError = partners.error ?? scope.error;

  return (
    <Modal open={open} title={t('asg_form_title')} onClose={onClose} wide>
      <div className="space-y-4">
        {/* ⚠️ Lỗi tải phải NÓI RA. Ô chọn rỗng vì lỗi và ô chọn rỗng vì không có
            dữ liệu là hai sự thật khác nhau (chuẩn UI 4.7). */}
        {loadError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('asg_f_partner')}>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              className={`${inputCls} text-base sm:text-sm`}
              disabled={loading}
            >
              <option value="">—</option>
              {partners.rows.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partnerCode ? `${p.partnerCode} · ` : ''}{p.name ?? p.id}
                </option>
              ))}
            </select>
            {!partners.isLoading && !partners.error && partners.rows.length === 0 && (
              <p className="mt-1 text-xs text-amber-800">{t('asg_partner_empty')}</p>
            )}
          </Field>

          <Field label={t('asg_f_order')}>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className={`${inputCls} text-base sm:text-sm`}
              disabled={loading}
            >
              <option value="">—</option>
              {(scope.data?.orders ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.poNumber ?? o.id}{o.styleCode ? ` · ${o.styleCode}` : ''}
                </option>
              ))}
            </select>
            {!scope.isLoading && !scope.error && (scope.data?.orders.length ?? 0) === 0 && (
              <p className="mt-1 text-xs text-amber-800">{t('asg_order_empty')}</p>
            )}
          </Field>
        </div>

        {/* ─── PHẠM VI ─────────────────────────────────────────────────── */}
        <Field label={t('asg_f_scope')}>
          <div className="flex flex-wrap gap-2">
            {SCOPE_LEVELS.map((lv) => {
              const info = scope.levels.find((l) => l.level === lv);
              const usable = info?.available ?? false;
              const active = scopeLevel === lv;
              return (
                <button
                  key={lv}
                  type="button"
                  // ⚠️ Cấp chưa dùng được vẫn HIỆN, ở trạng thái khoá. Ẩn hẳn thì
                  // người dùng không biết hệ thống có hỗ trợ và sẽ đi hỏi.
                  disabled={!usable || loading}
                  onClick={() => { setScopeLevel(lv); setSiteId(''); setLineId(''); }}
                  className={`min-h-[44px] touch-manipulation rounded-lg border px-3 py-2 text-sm font-medium transition
                    ${active
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}
                    disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span className="flex items-center gap-1.5">
                    {!usable && <Lock className="h-3.5 w-3.5" />}
                    {t(`asg_scope_${lv}` as DictionaryKey)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Nói RÕ vì sao cấp đang chọn chưa dùng được — thay vì để người dùng
              bấm Lưu rồi nhận lỗi 23514 không hiểu nổi. */}
          {levelInfo && !levelInfo.available && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{t(levelInfo.blockedBy as DictionaryKey)}</span>
            </p>
          )}
        </Field>

        {needsSite && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('asg_scope_SITE')}>
              <select
                value={siteId}
                onChange={(e) => { setSiteId(e.target.value); setLineId(''); }}
                className={`${inputCls} text-base sm:text-sm`}
              >
                <option value="">—</option>
                {(scope.data?.sites ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.siteCode ? `${s.siteCode} · ` : ''}{s.name ?? s.id}
                  </option>
                ))}
              </select>
            </Field>

            {needsLine && (
              <Field label={t('asg_scope_LINE')}>
                <select
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  className={`${inputCls} text-base sm:text-sm`}
                  disabled={siteId === ''}
                >
                  <option value="">—</option>
                  {linesOfSite.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.lineCode ? `${l.lineCode} · ` : ''}{l.lineName ?? l.id}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        )}

        {/* ─── SỐ LƯỢNG · ƯU TIÊN ──────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t('asg_f_qty')}>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={assignedQty}
              onChange={(e) => setAssignedQty(e.target.value)}
              className={`${inputCls} text-base sm:text-sm`}
            />
          </Field>
          <Field label={t('asg_f_uom')}>
            <input
              value={uom}
              onChange={(e) => setUom(e.target.value)}
              className={`${inputCls} text-base sm:text-sm`}
            />
          </Field>
          <Field label={t('asg_f_priority')}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`${inputCls} text-base sm:text-sm`}
            >
              {ASSIGNMENT_PRIORITIES.map((p) => (
                <option key={p} value={p}>{t(`asg_prio_${p}` as DictionaryKey)}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* ─── NGÀY KẾ HOẠCH ───────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('asg_f_start')}>
            <input
              type="date"
              value={plannedStart}
              onChange={(e) => setPlannedStart(e.target.value)}
              className={`${inputCls} text-base sm:text-sm`}
            />
          </Field>
          <Field label={t('asg_f_finish')} hint={t('asg_f_dates_hint')}>
            <input
              type="date"
              value={plannedFinish}
              onChange={(e) => setPlannedFinish(e.target.value)}
              className={`${inputCls} text-base sm:text-sm`}
            />
          </Field>
        </div>

        {create.error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {create.error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={`${btnGhost} min-h-[44px] touch-manipulation`}>
            {t('asg_cancel_btn')}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void submit()}
            className={`${btnPrimary} min-h-[44px] touch-manipulation`}
          >
            {create.isRunning ? t('asg_saving') : t('asg_new')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
