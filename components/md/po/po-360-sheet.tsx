'use client';

import { useEffect, useState } from 'react';
import {
  LayoutDashboard, CalendarClock, Shirt, Layers, PackageSearch, Factory,
  ShieldCheck, Ship, TriangleAlert, MessageSquare, X, Loader2, type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui';
import { getPo360Client } from '@/app/(dashboard)/md/_actions/po360.client';
import type { Po360Data } from '@/app/(dashboard)/md/_services/po.service';
import { TabOverview, TabTimeline, TabSamples, TabBom, TabMaterials } from './tabs-planning';
import { TabProduction, TabQuality, TabPacking, TabRisk, TabCollaboration } from './tabs-execution';
import { PO_STATUS_LABEL, RISK_LEVEL_LABEL, labelOf, riskLevelOf } from './labels';
import { fmtDate, fmtNum } from './tab-kit';

// ============================================================================
// PO 360° — MÀN HÌNH TRƯỢT GOM 10 MODULE CON
//
// ─── VÌ SAO NẠP DỮ LIỆU KHI MỞ, KHÔNG NẠP SẴN CẢ DANH SÁCH ──────────────
// Mỗi PO cần 11 truy vấn. Bảng 500 PO mà nạp sẵn hết là 5.500 truy vấn cho một
// lần mở trang, trong khi người dùng chỉ xem một vài đơn. Nạp khi mở (lazy) là
// bắt buộc ở quy mô này.
//
// ─── VÌ SAO KHÔNG DÙNG NESTED TABS THẬT SỰ LỒNG NHAU ────────────────────
// Mười tab lồng trong một tab của trang cha, trên điện thoại sẽ thành hai hàng
// tab chồng nhau chiếm gần nửa màn hình. Ở đây dùng một hàng tab CUỘN NGANG
// bên trong sheet toàn màn hình — vẫn là nested về mặt điều hướng nhưng không
// ăn chỗ theo chiều dọc.
// ============================================================================

type TabKey =
  | 'overview' | 'timeline' | 'samples' | 'bom' | 'materials'
  | 'production' | 'quality' | 'packing' | 'risk' | 'collab';

const TABS: Array<{ key: TabKey; label: string; short: string; icon: LucideIcon }> = [
  { key: 'overview', label: 'Tổng quan', short: 'Tổng quan', icon: LayoutDashboard },
  { key: 'timeline', label: 'Lịch trình T&A', short: 'T&A', icon: CalendarClock },
  { key: 'samples', label: 'Mẫu duyệt', short: 'Mẫu', icon: Shirt },
  { key: 'bom', label: 'Cấu trúc NPL', short: 'BOM', icon: Layers },
  { key: 'materials', label: 'Trạng thái NPL', short: 'NPL', icon: PackageSearch },
  { key: 'production', label: 'Tiến độ sản xuất', short: 'Sản xuất', icon: Factory },
  { key: 'quality', label: 'Chất lượng', short: 'QA', icon: ShieldCheck },
  { key: 'packing', label: 'Đóng gói & Xuất hàng', short: 'Xuất hàng', icon: Ship },
  { key: 'risk', label: 'Rủi ro', short: 'Rủi ro', icon: TriangleAlert },
  { key: 'collab', label: 'Thảo luận & Tài liệu', short: 'Thảo luận', icon: MessageSquare },
];

export default function Po360Sheet({
  orderId,
  poNumber,
  onClose,
}: {
  orderId: string | null;
  poNumber: string | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabKey>('overview');
  const [data, setData] = useState<Po360Data | null>(null);
  const [loading, setLoading] = useState(false);

  // Nạp lại từ đầu mỗi lần mở một PO khác, và reset về tab Tổng quan: giữ tab
  // cũ khi đổi đơn khiến người dùng tưởng đang xem đơn trước.
  useEffect(() => {
    if (!orderId) return;
    let alive = true;
    setTab('overview');
    setData(null);
    setLoading(true);

    void getPo360Client(orderId).then((d) => {
      if (!alive) return;
      setData(d);
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [orderId]);

  // Esc để đóng + khoá cuộn nền. Thiếu khoá cuộn thì trên điện thoại người dùng
  // cuộn xuyên lớp phủ xuống bảng PO phía sau.
  useEffect(() => {
    if (!orderId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [orderId, onClose]);

  if (!orderId) return null;

  const h = data?.header;
  const risk = data?.risk ? riskLevelOf(Number(data.risk.total_score)) : null;

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết đơn hàng ${poNumber ?? ''}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full flex-col bg-slate-50 shadow-2xl duration-200 animate-in slide-in-from-right lg:max-w-6xl"
      >
        {/* ── Đầu trang: dính trên cùng để luôn thấy mã PO đang xem ────── */}
        <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Đơn hàng 360°
              </p>
              <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900">
                {poNumber ?? '—'}
              </h2>
              {h && (
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {h.style_no ? `${h.style_no} · ` : ''}
                  {h.customer_name} · {fmtNum(h.total_quantity)} sp · giao {fmtDate(h.delivery_date)}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {h && <Badge tone="indigo">{labelOf(PO_STATUS_LABEL, h.status)}</Badge>}
              {risk && (
                <Badge tone={risk === 'CRITICAL' || risk === 'HIGH' ? 'rose' : risk === 'MEDIUM' ? 'amber' : 'emerald'}>
                  {RISK_LEVEL_LABEL[risk]}
                </Badge>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Hàng tab cuộn ngang ─────────────────────────────────────── */}
          <div role="tablist" aria-label="Các mục của đơn hàng" className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1">
            {TABS.map((t) => {
              const on = t.key === tab;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    on
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="hidden sm:inline">{t.label}</span>
                  <span className="sm:hidden">{t.short}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ── Nội dung tab ─────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {loading || !data ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
              <p className="text-sm font-medium">Đang tải dữ liệu đơn hàng...</p>
            </div>
          ) : (
            <>
              {tab === 'overview' && <TabOverview data={data} />}
              {tab === 'timeline' && <TabTimeline data={data} />}
              {tab === 'samples' && <TabSamples data={data} />}
              {tab === 'bom' && <TabBom data={data} />}
              {tab === 'materials' && <TabMaterials data={data} />}
              {tab === 'production' && <TabProduction data={data} />}
              {tab === 'quality' && <TabQuality data={data} />}
              {tab === 'packing' && <TabPacking data={data} />}
              {tab === 'risk' && <TabRisk data={data} />}
              {tab === 'collab' && <TabCollaboration data={data} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
