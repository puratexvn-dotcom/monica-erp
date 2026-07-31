'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Boxes, ClipboardCheck, History, Loader2, Lock, PackageCheck, PackageMinus,
  PackagePlus, ScanLine, Scroll, ShieldAlert, Truck, type LucideIcon,
} from 'lucide-react';

import { Card } from '@/components/ui';
import { NoData } from '@/components/data-state';
import MosTaskInbox from '@/components/mos/command-center/mos-task-inbox';
import MosKpiGrid from '@/components/mos/command-center/mos-kpi-grid';
import MosAlertPanel from '@/components/mos/command-center/mos-alert-panel';
import {
  whTasks, whKpis, whAlerts, WH_URGENCY, WH_WATCHING_HINT, WH_TASK_EMPTY_HINT,
  type WhTabTarget,
} from '@/components/warehouse/command-center/wh-feed';
import StockTable from '@/components/warehouse/stock/stock-table';
import Material360Sheet from '@/components/warehouse/stock/material-360-sheet';
import KhoLegacyPanels from './kho-client';
import { getWhCommandCenterClient, listStockClient, listRollsClient } from './_actions/wh.client';
import type { WhCommandCenter } from './_services/command-center.service';
import type { MaterialRow, TxRow, PoOption } from './wh-schema';
import type { StockRow, RollRow } from '@/schemas/warehouse';

// ============================================================================
// TRUNG TÂM ĐIỀU HÀNH KHO — BỐ CỤC
//
// Thứ tự giống hệt Merchandiser Command Center, theo docs/UI_UX_STANDARDS.md:
//   ba cột điều hành → khối tab nghiệp vụ (LIỀN MẠCH, không bọc accordion)
//
// ─── VÌ SAO BA CỘT ────────────────────────────────────────────────────────
// Thủ kho mở màn hình lúc 7 giờ sáng cần đúng ba câu trả lời: hôm nay phải làm
// gì, kho đang có bao nhiêu, và chỗ nào sắp cháy. Ba cột trả lời đúng ba câu
// đó mà không phải bấm đi đâu.
//
// Máy bàn chia 5 phần: 2 cho nhiệm vụ, 2 cho tồn kho, 1 cho cảnh báo. Điện
// thoại xếp dọc theo đúng thứ tự khẩn.
// ============================================================================

type TabKey =
  | 'stock' | 'inbound' | 'inspect' | 'reserve' | 'outbound'
  | 'transfer' | 'return' | 'count' | 'risk';

const GROUPS = ['Tồn kho', 'Nhập – Kiểm', 'Cấp phát', 'Kiểm soát'] as const;
type Group = (typeof GROUPS)[number];

const TABS: Array<{ key: TabKey; label: string; icon: LucideIcon; group: Group }> = [
  { key: 'stock', label: 'Bảng tồn kho', icon: Boxes, group: 'Tồn kho' },
  { key: 'inbound', label: 'Nhập hàng', icon: PackagePlus, group: 'Nhập – Kiểm' },
  { key: 'inspect', label: 'Kiểm hàng (QA)', icon: ClipboardCheck, group: 'Nhập – Kiểm' },
  { key: 'reserve', label: 'Giữ chỗ / Phân bổ', icon: Lock, group: 'Cấp phát' },
  { key: 'outbound', label: 'Xuất kho', icon: PackageMinus, group: 'Cấp phát' },
  { key: 'transfer', label: 'Chuyển kho', icon: Truck, group: 'Cấp phát' },
  { key: 'return', label: 'Nhập lại', icon: PackageCheck, group: 'Cấp phát' },
  { key: 'count', label: 'Kiểm kê', icon: ScanLine, group: 'Kiểm soát' },
  { key: 'risk', label: 'Báo cáo rủi ro', icon: ShieldAlert, group: 'Kiểm soát' },
];

/** Tab nào đã dựng xong giao diện. Tab chưa dựng hiện trạng thái nói THẬT là
 *  chưa có, thay vì một bảng rỗng khiến người dùng tưởng kho không có dữ liệu. */
const READY: ReadonlySet<TabKey> = new Set<TabKey>(['stock', 'inbound', 'outbound', 'risk']);

export default function WarehouseClient({
  initialStock,
  initialStockError,
  initialRolls,
  initialRollError,
  initialMaterials,
  initialMatError,
  initialTx,
  initialTxError,
  poOptions,
  initialPoError,
}: {
  initialStock: StockRow[];
  initialStockError: string | null;
  initialRolls: RollRow[];
  initialRollError: string | null;
  initialMaterials: MaterialRow[];
  initialMatError: string | null;
  initialTx: TxRow[];
  initialTxError: string | null;
  poOptions: PoOption[];
  initialPoError: string | null;
}) {
  const [tab, setTab] = useState<TabKey>('stock');
  const [stock, setStock] = useState(initialStock);
  const [stockError, setStockError] = useState(initialStockError);
  const [rolls, setRolls] = useState(initialRolls);
  const [rollError, setRollError] = useState(initialRollError);
  const [cc, setCc] = useState<WhCommandCenter | null>(null);
  const [ccLoading, setCcLoading] = useState(true);
  const [open360, setOpen360] = useState<StockRow | null>(null);

  const tabBarRef = useRef<HTMLDivElement>(null);

  const loadCc = useCallback(() => {
    setCcLoading(true);
    void getWhCommandCenterClient().then((d) => {
      setCc(d);
      setCcLoading(false);
    });
  }, []);
  useEffect(loadCc, [loadCc]);

  const reloadStock = useCallback(async () => {
    const [s, r] = await Promise.all([listStockClient(), listRollsClient()]);
    setStock(s.rows);
    setStockError(s.error);
    setRolls(r.rows);
    setRollError(r.error);
  }, []);

  // Ô chỉ số nằm ở giữa trang, thanh tab nằm dưới — bấm một ô phải cuộn tới
  // thanh tab, không thì người dùng đổi tab mà màn hình không đổi gì.
  const goTab = useCallback((target: TabKey) => {
    setTab(target);
    tabBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Ba khu đều nhảy tới tab bằng CÙNG một hàm. Trước đây mỗi khu có một bảng
  // tra riêng nằm rải rác; gom lại đây thì thêm loại việc mới chỉ phải sửa
  // đúng một chỗ.
  const goWh = useCallback((t: WhTabTarget) => goTab(t as TabKey), [goTab]);

  const feed = useMemo(
    () => (cc === null ? null : {
      tasks: whTasks(cc, goWh),
      kpis: whKpis(cc, goWh),
      alerts: whAlerts(cc, goWh),
    }),
    [cc, goWh],
  );

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  const counts = useMemo<Partial<Record<TabKey, number>>>(
    () => ({ stock: stock.length, risk: cc?.alerts.length ?? 0 }),
    [stock.length, cc],
  );

  return (
    <>
      {/* ═══ BA CỘT ĐIỀU HÀNH ══════════════════════════════════════════════ */}
      {cc === null ? (
        <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-14 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium">Đang tổng hợp tình hình kho...</span>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <MosTaskInbox
              title="Nhiệm vụ hôm nay"
              tasks={feed?.tasks ?? []}
              error={cc.errors.all}
              wording={WH_URGENCY}
              emptyTitle="Không có nhiệm vụ nào đang chờ"
              emptyHint={WH_TASK_EMPTY_HINT}
            />
          </div>
          <div className="lg:col-span-2">
            <MosKpiGrid
              title="Tổng quan tồn kho"
              kpis={feed?.kpis ?? null}
              loading={ccLoading}
              onReload={loadCc}
            />
          </div>
          <div className="lg:col-span-1">
            <MosAlertPanel
              title="Cảnh báo rủi ro"
              alerts={feed?.alerts ?? []}
              error={cc.errors.all}
              emptyTitle="Kho đang an toàn"
              watchingHint={WH_WATCHING_HINT}
            />
          </div>
        </div>
      )}

      {/* ═══ KHỐI TAB NGHIỆP VỤ — LIỀN MẠCH, KHÔNG BỌC ═════════════════════
          Theo docs/UI_UX_STANDARDS.md §1.2: gấp lại thì mỗi lần mở một tab mất
          thêm một cú bấm, với người vào hàng chục lần mỗi ngày là hàng chục cú
          bấm thừa. */}
      <div ref={tabBarRef} className="-mx-1 mb-5 space-y-2 px-1 pt-1">
        {GROUPS.map((g) => (
          <div key={g} className="flex items-center gap-2">
            <span className="hidden w-20 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:block">
              {g}
            </span>
            <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
              {TABS.filter((t) => t.group === g).map((t) => {
                const Icon = t.icon;
                const on = tab === t.key;
                const n = counts[t.key];
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-current={on ? 'page' : undefined}
                    className={`flex shrink-0 touch-manipulation select-none items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition active:scale-95 ${
                      on
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 shadow-sm hover:text-blue-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t.label}
                    {n !== undefined && n > 0 && (
                      <span
                        className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                          on ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {n}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Card title={active.label} icon={active.icon}>
        {tab === 'stock' && (
          <StockTable rows={stock} error={stockError} onOpenMaterial={setOpen360} />
        )}

        {/* Hai form nhập/xuất CŨ giữ nguyên vẹn, chỉ chuyển vào đúng tab. Chúng
            đang phục vụ người dùng thật; thay bằng luồng mới khi luồng mới chưa
            xong là lấy đi công cụ đang dùng được. */}
        {(tab === 'inbound' || tab === 'outbound') && (
          <KhoLegacyPanels
            mode={tab === 'inbound' ? 'inbound' : 'outbound'}
            initialMaterials={initialMaterials}
            initialTx={initialTx}
            poOptions={poOptions}
            initialMatError={initialMatError}
            initialTxError={initialTxError}
            initialPoError={initialPoError}
            onChanged={reloadStock}
          />
        )}

        {tab === 'risk' && (
          <div className="space-y-3">
            {cc === null ? (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tổng hợp...
              </p>
            ) : (
              <MosAlertPanel
                title="Cảnh báo rủi ro"
                alerts={feed?.alerts ?? []}
                error={cc.errors.all}
                emptyTitle="Kho đang an toàn"
                watchingHint={WH_WATCHING_HINT}
              />
            )}
          </div>
        )}

        {/* Tab chưa dựng: nói THẬT là chưa có, kèm việc cụ thể còn thiếu. Một
            bảng rỗng ở đây sẽ khiến người dùng tưởng kho không có dữ liệu. */}
        {!READY.has(tab) && (
          <NoData
            title={`Màn hình "${active.label}" chưa dựng xong`}
            sub={
              tab === 'inspect'
                ? 'Bảng chấm điểm 4 point đã có đủ cấu trúc dữ liệu (bảng material_inspections và view v_inspection_score). Giao diện nhập điểm sẽ làm ở bước tiếp theo.'
                : tab === 'reserve'
                  ? 'Bảng stock_reservations đã sẵn sàng. Màn hình giữ chỗ và phân bổ theo tông màu sẽ làm ở bước tiếp theo.'
                  : tab === 'count'
                    ? 'Bảng stock_counts và stock_adjustments đã sẵn sàng. Màn hình đếm và đối chiếu chênh lệch sẽ làm ở bước tiếp theo.'
                    : 'Cấu trúc dữ liệu đã có trong migration 017. Giao diện sẽ làm ở bước tiếp theo.'
            }
          />
        )}
      </Card>

      {/* Cuộn vải: hiện tạm dưới bảng tồn kho cho tới khi có tab riêng */}
      {tab === 'stock' && rolls.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Scroll className="h-4 w-4" aria-hidden="true" />
            </span>
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
              Cuộn vải trong kho ({rolls.length})
            </h3>
          </div>
          {rollError ? (
            <p role="alert" className="py-4 text-center text-sm font-semibold text-red-700">{rollError}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 760 }}>
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Mã cuộn', 'Vật tư', 'Tông màu', 'Còn lại (m)', 'Khổ', 'Điểm 4P', 'QA', 'Vị trí'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rolls.map((r) => (
                    <tr key={r.id} className="transition hover:bg-slate-50/70">
                      <td className="px-3 py-2 font-mono text-xs font-bold text-slate-800">{r.roll_code}</td>
                      <td className="px-3 py-2 text-sm text-slate-700">{r.material_name ?? '—'}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{r.shade_lot ?? '—'}</td>
                      <td className="px-3 py-2 text-sm tabular-nums text-slate-700">{r.current_length_m}</td>
                      <td className="px-3 py-2 text-xs tabular-nums text-slate-600">{r.width_m ?? '—'}</td>
                      <td className="px-3 py-2 text-xs tabular-nums text-slate-600">{r.four_point_score ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            r.qa_status === 'PASSED' ? 'bg-emerald-100 text-emerald-800'
                            : r.qa_status === 'FAILED' ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.qa_status === 'PASSED' ? 'Đạt' : r.qa_status === 'FAILED' ? 'Không đạt' : 'Chờ kiểm'}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{r.bin_path ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Material360Sheet stock={open360} onClose={() => setOpen360(null)} />
    </>
  );
}
