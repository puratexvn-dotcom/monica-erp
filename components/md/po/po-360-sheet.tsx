'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard, CalendarClock, Shirt, Layers, PackageSearch, Factory,
  ShieldCheck, Ship, TriangleAlert, MessageSquare, X, Loader2, Paperclip, Pencil, Lock,
  type LucideIcon,
} from 'lucide-react';

import { toast } from 'sonner';

import { Badge, btnPrimary, btnGhost, inputCls } from '@/components/ui';
import { uploadEvidence } from '@/app/actions/upload-action';
import { updatePo, attachToPo, listPoAttachments, docKhoaPo } from '@/app/(dashboard)/md/_actions/po.actions';
import { PO_TIEN_DO, PO_TIEN_DO_LABEL } from '@/lib/mos/md/po-edit';
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

// ════════════════════════════════════════════════════════════════════════════
// SỬA ĐƠN HÀNG + TỆP ĐÍNH KÈM — Board 06/08/2026
//
// *"PO phải upload được **hình ảnh mẫu và tài liệu đi kèm**; PD và MD **sửa
// được số lượng và tiến độ** của PO đó."*
//
// ⚠️ Hai khối này đặt **trong tệp này**, ⛔ không tách ra tệp mới — `arch.test`
// ⑨/⑩ là bánh cóc: tệp MỚI viết màu/cỡ chữ thẳng thì HỎNG, mà thêm tên vào sổ
// nợ là việc **cần Board duyệt**. Tệp này đã nằm sẵn trong cả hai sổ.
// ════════════════════════════════════════════════════════════════════════════

/**
 * 🔴 **BUG-4 · KHOÁ THEO WORKFLOW** — Board Decision 07/08/2026.
 *
 * ─── ⚠️ LỖ HỔNG ĐANG VÁ, ĐO ĐƯỢC TRONG UAT ──────────────────────────────
 * Trước bản này, form dưới đây bày ô nhập cho **mọi** PO — kể cả đơn đã
 * `COMPLETED`. Người dùng sửa được số lượng của một đơn đã hoàn thành, và cả
 * giao diện lẫn tầng luật đều ⛔ không nói gì.
 *
 * ─── 🔑 HỎI MÁY CHỦ, ⛔ KHÔNG TỰ SUY TỪ `status` ────────────────────────
 * Board nói rõ: *"⛔ Không khóa theo Status đơn thuần … PO đã sinh Production
 * Order thì phải khóa."* Phép thử ấy cần đếm bảng `production_orders` — thứ
 * màn hình này **⛔ không có**. Nên nó gọi `docKhoaPo()` và **hiển thị đúng
 * phán quyết của máy chủ**, thay vì dựng một bộ luật thứ hai ở client rồi để
 * hai bên lệch nhau.
 *
 * ⚠️ Đây vẫn chỉ là **phép lịch sự với giao diện**. `updatePo` tự kiểm lại ở
 * máy chủ — Server Action là endpoint gọi thẳng được *(CLAUDE.md §2.1)*.
 */
function SuaPoForm({ orderId, h, onXong }: {
  orderId: string;
  h: { total_quantity: number; status: string; delivery_date: string };
  onXong: () => void;
}) {
  const [sl, setSl] = useState(String(h.total_quantity));
  const [tt, setTt] = useState(h.status);
  const [ngay, setNgay] = useState((h.delivery_date ?? '').slice(0, 10));
  const [dang, setDang] = useState(false);
  const [canhBao, setCanhBao] = useState<string | null>(null);
  const [khoa, setKhoa] = useState<{ muc: string; vi: string; loiRa: string | null } | null>(null);
  const [dangDoKhoa, setDangDoKhoa] = useState(true);

  useEffect(() => {
    let boQua = false;
    setDangDoKhoa(true);
    void docKhoaPo(orderId).then((r) => {
      if (boQua) return;
      setKhoa(r.muc === 'SUA' ? null : { muc: r.muc, vi: r.vi, loiRa: r.loiRa });
      setDangDoKhoa(false);
    });
    return () => { boQua = true; };
  }, [orderId]);

  const luu = (xacNhan: boolean) => {
    setDang(true);
    void updatePo(orderId, { total_quantity: Number(sl), status: tt, delivery_date: ngay }, xacNhan)
      .then((r) => {
        // 🔴 Máy chủ trả cảnh báo khi số lượng mới THẤP HƠN số đã sản xuất.
        // Hiện nó ra và bắt bấm lần nữa — ⛔ không tự ghi đè, cũng ⛔ không
        // chặn cứng: có khi khách thật sự cắt đơn.
        if (!r.ok && r.data?.canhBao) { setCanhBao(r.data.canhBao); return; }
        if (r.ok) { toast.success(r.message ?? 'Đã lưu.'); setCanhBao(null); onXong(); }
        else toast.error(r.message ?? 'Không lưu được.');
      })
      .finally(() => setDang(false));
  };

  if (dangDoKhoa) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Đang kiểm tra chứng từ này có sửa được không...
      </div>
    );
  }

  // 🔴 KHOÁ ⇒ ⛔ **KHÔNG bày ô nhập nào**. Bày ô rồi để người dùng gõ xong mới
  // báo *"đơn đã khoá"* là bắt họ làm việc vô ích — và tệ hơn, nó gợi ý rằng
  // chứng từ **có thể** sửa được, trong khi luật nói ⛔ không.
  if (khoa) {
    const dam = khoa.muc === 'KHOA_TUYET_DOI';
    return (
      <div
        className={`space-y-1.5 rounded-xl border p-3 ${
          dam ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'
        }`}
      >
        <p className={`flex items-start gap-1.5 text-xs font-bold ${dam ? 'text-rose-800' : 'text-amber-900'}`}>
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{khoa.vi}</span>
        </p>
        {khoa.loiRa && (
          <p className={`pl-5 text-xs font-semibold ${dam ? 'text-rose-700' : 'text-amber-800'}`}>
            → {khoa.loiRa}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Số lượng (sp)</span>
          <input type="number" min={1} step={1} value={sl} onChange={(e) => setSl(e.target.value)}
            className={inputCls} aria-label="Số lượng đơn hàng" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Tiến độ</span>
          <select value={tt} onChange={(e) => setTt(e.target.value)} className={inputCls} aria-label="Tiến độ đơn hàng">
            {PO_TIEN_DO.map((s) => <option key={s} value={s}>{PO_TIEN_DO_LABEL[s]}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Ngày giao</span>
          <input type="date" value={ngay} onChange={(e) => setNgay(e.target.value)}
            className={inputCls} aria-label="Ngày giao hàng" />
        </label>
      </div>

      {canhBao && (
        <p className="rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
          ⚠️ {canhBao}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btnPrimary} disabled={dang} onClick={() => luu(Boolean(canhBao))}>
          {dang ? 'Đang lưu…' : canhBao ? 'Vẫn lưu — tôi xác nhận' : 'Lưu thay đổi'}
        </button>
        {canhBao && (
          <button type="button" className={btnGhost} onClick={() => setCanhBao(null)}>Huỷ</button>
        )}
      </div>
    </div>
  );
}

function TepDinhKem({ orderId }: { orderId: string }) {
  const [rows, setRows] = useState<Array<{ id: string; file_url: string; created_at: string }>>([]);
  const [dang, setDang] = useState(false);

  const nap = useCallback(() => {
    void listPoAttachments(orderId).then((r) => setRows(r.rows));
  }, [orderId]);
  useEffect(nap, [nap]);

  const chon = (f: File | null) => {
    if (!f) return;
    setDang(true);
    const fd = new FormData();
    fd.append('file', f);
    fd.append('folder', 'po');
    // ⚠️ HAI BƯỚC có chủ ý: tải tệp lên trước, ghi mối liên hệ sau. Gộp lại thì
    // một lần tải hỏng sẽ để lại bản ghi trỏ tới tệp ⛔ không tồn tại.
    void uploadEvidence(fd)
      .then((u) => {
        // `url` chỉ có khi `ok` — TypeScript ⛔ không suy ra được điều đó từ
        // kiểu `UploadResult`, nên kiểm tường minh thay vì ép kiểu.
        if (!u.ok || !u.url) { toast.error(u.message); return null; }
        return attachToPo(orderId, u.url, f.name);
      })
      .then((a) => {
        if (!a) return;
        if (a.ok) { toast.success('Đã đính kèm.'); nap(); } else toast.error(a.message);
      })
      .finally(() => setDang(false));
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-700">
        <Paperclip className="h-4 w-4" aria-hidden="true" />
        {dang ? 'Đang tải lên…' : 'Thêm ảnh mẫu hoặc tài liệu (PDF)'}
        <input type="file" className="sr-only" disabled={dang}
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          onChange={(e) => chon(e.target.files?.[0] ?? null)} />
      </label>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">Chưa có tệp nào đính kèm đơn này.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => (
            <li key={r.id} className="truncate text-xs">
              <a href={r.file_url} target="_blank" rel="noopener noreferrer"
                className="font-semibold text-blue-700 underline">
                {r.file_url.split('/').pop()}
              </a>
              <span className="text-slate-400"> · {fmtDate(r.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
    // Lớp phủ dừng TRÊN dải thanh điều hướng (biến --nav-h) để thanh vừa luôn
    // thấy vừa bấm được trong lúc đang xem PO — người dùng thoát ra được mà
    // không cần tìm nút đóng.
    <div
      className="fixed inset-x-0 top-0 z-[70] flex justify-end bg-slate-900/50 backdrop-blur-sm"
      style={{
        bottom: 'var(--nav-h, 3.5rem)',
        height: 'calc(100dvh - var(--nav-h, 3.5rem))',
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết đơn hàng ${poNumber ?? ''}`}
        onClick={(e) => e.stopPropagation()}
        // ─── 100% TRÊN ĐIỆN THOẠI, ~40% TRÊN MÀN RỘNG ────────────────────
        // Trên điện thoại panel chiếm trọn: nội dung PO 360° có bảng nhiều
        // cột, để hở một dải nền phía sau chỉ tổ chật thêm.
        // Từ lg trở lên lấy 40% bề ngang (min-w để không co quá hẹp trên màn
        // 1280px, max-w để không kéo dài lê thê trên màn siêu rộng). Chừa lại
        // 60% cho Command Center phía sau: xử lý xong đóng panel là mắt đã ở
        // sẵn chỗ cũ, không phải định vị lại.
        className="flex h-full w-full min-w-0 flex-col bg-slate-50 shadow-2xl duration-200 animate-in slide-in-from-right lg:w-[40vw] lg:min-w-[560px] lg:max-w-3xl"
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
              {tab === 'overview' && (
                <div className="space-y-4">
                  <TabOverview data={data} />

                  {/* 🔑 Sửa PO và tệp đính kèm nằm ở tab TỔNG QUAN, ⛔ không tách
                      tab riêng: đây là hai việc người dùng làm NGAY khi đang
                      nhìn thông tin đơn, ⛔ không phải hai màn hình riêng. */}
                  {h && (
                    <section className="space-y-2">
                      <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                        <Pencil className="h-4 w-4" aria-hidden="true" /> Sửa số lượng · tiến độ · ngày giao
                      </h3>
                      <SuaPoForm
                        orderId={orderId}
                        h={{
                          total_quantity: h.total_quantity,
                          status: h.status,
                          delivery_date: h.delivery_date,
                        }}
                        onXong={() => { void getPo360Client(orderId).then(setData); }}
                      />
                    </section>
                  )}

                  <section className="space-y-2">
                    <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                      <Paperclip className="h-4 w-4" aria-hidden="true" /> Ảnh mẫu &amp; tài liệu
                    </h3>
                    <TepDinhKem orderId={orderId} />
                  </section>
                </div>
              )}
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
