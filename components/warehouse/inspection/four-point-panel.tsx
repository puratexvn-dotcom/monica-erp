'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CloudOff, Loader2, RefreshCw, Save, ScanLine, Ruler } from 'lucide-react';
import { toast } from 'sonner';

import { Badge, inputCls } from '@/components/ui';
import FourPointDefectGrid from '@/components/warehouse/inspection/four-point-defect-grid';
import FourPointVerdict from '@/components/warehouse/inspection/four-point-verdict';
import { useLanguage } from '@/lib/i18n';
import {
  DEFAULT_ACCEPTANCE_LIMIT, ENTRY_UOMS, scoreFourPoint,
  type DefectCounts, type EntryUom,
} from '@/lib/mos/four-point';
import { createInspectionClient, getFourPointDataClient } from '@/app/(dashboard)/kho/_actions/wh.client';
import { inspectionFormSchema, SHADE_VARIATIONS, type ShadeVariation } from '@/schemas/warehouse/inspection.schema';
import type { CustomerLimit, InspectionRow, RollForInspection } from '@/schemas/warehouse/inspection.schema';

// ============================================================================
// MÀN CHẤM ĐIỂM VẢI 4-POINT
//
// ─── ĐIỀU VII: KHÔNG CÓ NGHIỆP VỤ NÀO Ở ĐÂY ──────────────────────────────
// Component này chỉ thu thập số liệu và vẽ ra. Quy đổi đơn vị, sinh số phiếu,
// chọn ngưỡng, kết luận đạt/trượt — tất cả nằm ở inspection.service.ts và ở
// trigger của migration 020.
//
// Hàm scoreFourPoint() gọi ở đây CHỈ để xem trước trong lúc còn đang gõ, cho
// người kiểm thấy điểm nhảy theo từng lỗi vừa đếm. Kết luận thật lấy từ máy
// chủ sau khi lưu — và màn hình hiện đúng cái máy chủ trả về, không hiện lại
// cái mình vừa tự tính.
//
// ─── ĐIỀU XXI: KHÔNG MỘT CHUỖI TIẾNG VIỆT NÀO VIẾT CỨNG ─────────────────
// Mọi nhãn đi qua t(). Từ điển ở lib/dictionaries/warehouse.ts, đủ VN/EN/CN.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const dtf = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const ZERO: DefectCounts = { p1: 0, p2: 0, p3: 0, p4: 0 };

/** Số hoặc gạch ngang — 0 là 0, không đọc được là "—" (Điều XX) */
const show = (v: number | null): string => (v === null ? '—' : nf.format(v));

function Skeleton() {
  // Điều XX: đang tải thì hiện khung xám, KHÔNG hiện số 0 rồi nhảy sang số thật
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-32 w-full animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export default function FourPointPanel() {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rolls, setRolls] = useState<RollForInspection[]>([]);
  const [inspections, setInspections] = useState<InspectionRow[]>([]);
  const [customers, setCustomers] = useState<CustomerLimit[]>([]);

  const [rollId, setRollId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [entryUom, setEntryUom] = useState<EntryUom>('METERS');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [defects, setDefects] = useState<DefectCounts>(ZERO);
  const [shadeVariation, setShadeVariation] = useState<ShadeVariation | ''>('');
  const [shrinkage, setShrinkage] = useState('');
  const [fastness, setFastness] = useState('');
  const [yarnNote, setYarnNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const d = await getFourPointDataClient();
    setRolls(d.rolls);
    setInspections(d.inspections);
    setCustomers(d.customers);
    // Gộp lỗi của ba lượt đọc: hỏng cái nào cũng phải lộ ra, không nuốt cái nào
    setLoadError([d.rollsError, d.inspectionsError, d.customersError].filter(Boolean).join(' · ') || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const roll = useMemo(() => rolls.find((r) => r.id === rollId) ?? null, [rolls, rollId]);
  const customer = useMemo(() => customers.find((c) => c.id === customerId) ?? null, [customers, customerId]);

  // Ngưỡng: của khách nếu khách có khai riêng, không thì mức mặc định nhà máy.
  // Đúng thứ tự mà trigger ở migration 020 áp dụng — hai nơi phải khớp, nếu
  // không người kiểm thấy một ngưỡng trên màn hình rồi lưu ra kết quả theo
  // ngưỡng khác.
  const limitFromCustomer = customer?.fourPointLimit != null && customer.fourPointLimit > 0;
  const limit = limitFromCustomer ? (customer?.fourPointLimit as number) : DEFAULT_ACCEPTANCE_LIMIT;

  // Khi chọn cuộn, mồi sẵn khổ vải đã đo lúc nhập kho — bớt một lần nhập tay
  // (Điều XXVI câu 4: có giảm nhập liệu không?).
  useEffect(() => {
    if (roll?.widthM != null && width === '') setWidth(String(roll.widthM));
    if (roll?.currentLengthM != null && length === '') setLength(String(roll.currentLengthM));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollId]);

  const lengthNum = Number(length);
  const widthNum = Number(width);
  const preview = useMemo(
    () =>
      scoreFourPoint(
        defects,
        Number.isFinite(lengthNum) && lengthNum > 0
          ? entryUom === 'YARDS' ? lengthNum / 1.0936132983 : lengthNum
          : null,
        Number.isFinite(widthNum) && widthNum > 0
          ? entryUom === 'YARDS' ? widthNum / 1.0936132983 : widthNum
          : null,
        limit,
      ),
    [defects, lengthNum, widthNum, entryUom, limit],
  );

  async function save() {
    const parsed = inspectionFormSchema.safeParse({
      rollId,
      customerId: customerId || null,
      entryUom,
      length,
      width,
      p1: defects.p1, p2: defects.p2, p3: defects.p3, p4: defects.p4,
      shadeVariation: shadeVariation || null,
      shrinkagePct: shrinkage === '' ? null : shrinkage,
      colorFastness: fastness === '' ? null : fastness,
      yarnDefectNote: yarnNote || null,
    });

    if (!parsed.success) {
      // Thông báo của lược đồ là KHOÁ i18n, dịch ở đây mới ra câu người đọc
      const first = parsed.error.issues[0];
      toast.error(t(first.message as Parameters<typeof t>[0]));
      return;
    }

    setSaving(true);
    const res = await createInspectionClient(parsed.data);
    setSaving(false);

    if (!res.ok) {
      toast.error(t('wh_error_save'), { description: res.message });
      return;
    }

    // Hiện KẾT LUẬN CỦA MÁY CHỦ, không hiện lại cái vừa tự tính
    toast.success(t('wh_saved'), {
      description: `${res.inspectionNo} · ${res.result === 'PASSED' ? t('wh_passed') : res.result === 'FAILED' ? t('wh_failed') : t('wh_pending')}`,
    });
    setRollId(''); setLength(''); setWidth(''); setDefects(ZERO);
    setShadeVariation(''); setShrinkage(''); setFastness(''); setYarnNote('');
    void load();
  }

  if (loading) return <Skeleton />;

  return (
    <div className="min-w-0 space-y-4">
      {loadError && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-800">
          <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 break-words">{t('wh_error_load')} — {loadError}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="flex shrink-0 items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" /> {t('wh_retry')}
          </button>
        </div>
      )}

      {rolls.length === 0 && !loadError ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
          <ScanLine className="h-8 w-8" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-600">{t('wh_fp_no_roll')}</p>
          <p className="max-w-[20rem] text-xs">{t('wh_fp_no_roll_hint')}</p>
        </div>
      ) : (
        <>
          {/* ─── Chọn cuộn + khách hàng ─────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="min-w-0">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('wh_roll_select')}
              </span>
              <select
                value={rollId}
                onChange={(e) => setRollId(e.target.value)}
                className={`${inputCls} w-full text-base sm:text-sm`}
              >
                <option value="">—</option>
                {rolls.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.rollCode}
                    {r.materialName ? ` · ${r.materialName}` : ''}
                    {r.shadeCode ? ` · ${r.shadeCode}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-0">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('wh_customer')}
              </span>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={`${inputCls} w-full text-base sm:text-sm`}
              >
                <option value="">{t('wh_customer_none')}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.fourPointLimit != null ? ` · ${nf.format(c.fourPointLimit)}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {roll && (
            <div className="flex flex-wrap gap-1.5">
              {roll.lotNo && <Badge tone="slate">{t('wh_lot')}: {roll.lotNo}</Badge>}
              <Badge tone={roll.shadeCode ? 'indigo' : 'amber'}>
                {t('wh_shade')}: {roll.shadeCode ?? t('wh_shade_none')}
              </Badge>
              {roll.binPath && <Badge tone="slate">{t('wh_bin')}: {roll.binPath}</Badge>}
            </div>
          )}

          {/* ─── Đơn vị + kích thước ────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Ruler className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {t('wh_entry_uom')}
              </span>
              <div role="group" className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
                {ENTRY_UOMS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setEntryUom(u)}
                    aria-pressed={entryUom === u}
                    className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                      entryUom === u ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {u === 'METERS' ? t('wh_uom_meters') : t('wh_uom_yards')}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">{t('wh_length')}</span>
                <input
                  type="number" inputMode="decimal" min={0} step="0.001"
                  value={length} onChange={(e) => setLength(e.target.value)}
                  className={`${inputCls} w-full text-base tabular-nums sm:text-sm`}
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">{t('wh_width')}</span>
                <input
                  type="number" inputMode="decimal" min={0} step="0.001"
                  value={width} onChange={(e) => setWidth(e.target.value)}
                  className={`${inputCls} w-full text-base tabular-nums sm:text-sm`}
                />
              </label>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">{t('wh_convert_note')}</p>
          </div>

          <FourPointDefectGrid value={defects} onChange={setDefects} disabled={saving} />

          <FourPointVerdict score={preview} limitFromCustomer={limitFromCustomer} />

          {/* ─── Bốn phép thử còn lại ───────────────────────────────────── */}
          <details className="rounded-xl border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer select-none text-xs font-bold uppercase tracking-wider text-slate-600">
              {t('wh_extra_tests')}
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">{t('wh_shade_variation')}</span>
                <select
                  value={shadeVariation}
                  onChange={(e) => setShadeVariation(e.target.value as ShadeVariation | '')}
                  className={`${inputCls} w-full text-base sm:text-sm`}
                >
                  <option value="">—</option>
                  {SHADE_VARIATIONS.map((s) => (
                    <option key={s} value={s}>
                      {s === 'OK' ? t('wh_shade_ok') : s === 'SLIGHT' ? t('wh_shade_slight') : t('wh_shade_severe')}
                    </option>
                  ))}
                </select>
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">{t('wh_shrinkage')}</span>
                <input type="number" inputMode="decimal" step="0.01" value={shrinkage}
                  onChange={(e) => setShrinkage(e.target.value)}
                  className={`${inputCls} w-full text-base tabular-nums sm:text-sm`} />
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">{t('wh_color_fastness')}</span>
                <input type="number" inputMode="numeric" min={1} max={5} value={fastness}
                  onChange={(e) => setFastness(e.target.value)}
                  className={`${inputCls} w-full text-base tabular-nums sm:text-sm`} />
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">{t('wh_yarn_note')}</span>
                <input type="text" value={yarnNote} onChange={(e) => setYarnNote(e.target.value)}
                  className={`${inputCls} w-full text-base sm:text-sm`} />
              </label>
            </div>
          </details>

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !rollId}
            className="flex h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:opacity-40 sm:w-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {saving ? t('wh_saving') : t('wh_save')}
          </button>

          {/* ─── Lịch sử phiếu kiểm ─────────────────────────────────────── */}
          <section className="min-w-0">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              {t('wh_fp_history')}
            </h3>
            {inspections.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                {t('wh_fp_no_history')} — {t('wh_fp_no_history_hint')}
              </p>
            ) : (
              // overflow-x-auto trên chính bảng: bảng rộng cuộn trong khung của
              // nó, thân trang không bao giờ cuộn ngang (chuẩn UI_UX_STANDARDS).
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[40rem] text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">{t('wh_inspection_no')}</th>
                      <th className="px-3 py-2">{t('wh_roll')}</th>
                      <th className="px-3 py-2 text-right">{t('wh_total_points')}</th>
                      <th className="px-3 py-2 text-right">{t('wh_score')}</th>
                      <th className="px-3 py-2 text-right">{t('wh_limit')}</th>
                      <th className="px-3 py-2">{t('wh_verdict')}</th>
                      <th className="px-3 py-2">{t('wh_inspected_at')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inspections.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">{i.inspectionNo}</td>
                        <td className="px-3 py-2 text-slate-700">{i.rollCode ?? '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-700">{i.totalPoints}</td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums text-slate-900">
                          {show(i.pointsPer100SqYd)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                          {nf.format(i.acceptanceLimit)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge tone={i.result === 'PASSED' ? 'emerald' : i.result === 'FAILED' ? 'rose' : 'slate'}>
                            {i.result === 'PASSED' ? t('wh_passed')
                              : i.result === 'FAILED' ? t('wh_failed')
                              : i.result === 'CONDITIONAL' ? t('wh_qa_conditional')
                              : t('wh_pending')}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-500">
                          {i.inspectedAt ? dtf.format(new Date(i.inspectedAt)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
