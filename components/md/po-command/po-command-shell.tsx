'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CloudOff, Construction, Loader2, RefreshCw } from 'lucide-react';

import PoHeader from '@/components/md/po-command/po-header';
import PoTabNav from '@/components/md/po-command/po-tab-nav';
import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import { usePoRealtime } from '@/lib/mos/use-po-realtime';
import type { PoTwinHeader, PoTwinResult, PoView } from '@/lib/mos/po-twin.contract';

// ============================================================================
// KHUNG CỦA PO DIGITAL TWIN
//
// Đây KHÔNG phải "màn hình chi tiết PO". Đây là trung tâm điều hành của toàn
// bộ vòng đời một đơn hàng: người dùng ở lại đây và điều hành, không phải ghé
// qua xem rồi quay ra.
//
// ─── ĐIỀU VII: KHUNG NÀY KHÔNG BIẾT NGHIỆP VỤ ────────────────────────────
// Nó không đọc cơ sở dữ liệu, không tính gì. Nó nhận một hàm nạp dữ liệu, một
// danh sách lát cắt đã lọc quyền, và một bộ hiển thị cho từng lát cắt.
// Toàn bộ nghiệp vụ nằm ở _services/.
//
// ─── VÌ SAO TẢI LẠI TOÀN BỘ KHI CÓ THAY ĐỔI ──────────────────────────────
// Thanh đầu là kết quả cộng từ chín nguồn. Vá một dòng vừa đổi vào đó sẽ khiến
// các con số lệch nhau ngay lần đầu. Hook realtime chỉ báo "có gì đó đổi",
// việc tính lại để service làm — một nguồn công thức duy nhất.
//
// ─── VÌ SAO KHÔNG XOÁ MÀN HÌNH LÚC ĐANG TẢI LẠI ──────────────────────────
// Realtime có thể nảy vài lần mỗi phút. Mỗi lần lại xoá trắng rồi vẽ lại thì
// người dùng không đọc nổi gì. Lần đầu mới hiện khung xám; các lần sau giữ
// nguyên số cũ và chỉ hiện một vòng xoay nhỏ ở góc.
// ============================================================================

function Skeleton() {
  return (
    <div className="mx-auto max-w-[110rem] space-y-3 px-4 py-6 sm:px-6" aria-hidden="true">
      <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      <div className="grid gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

/** Lát cắt chưa dựng: nói THẬT là chưa có, không dựng bảng rỗng giả vờ. */
export function SliceComingSoon({ view }: { view: PoView }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center text-slate-400">
      <Construction className="h-8 w-8" aria-hidden="true" />
      <p className="text-sm font-bold text-slate-700">
        {t(`po_view_${view}` as DictionaryKey)} — {t('po_soon')}
      </p>
      <p className="max-w-[28rem] px-4 text-xs leading-relaxed">{t('po_soon_hint')}</p>
    </div>
  );
}

export default function PoCommandShell({
  poId,
  views,
  initialView,
  initialData,
  load,
  renderSlice,
}: {
  poId: string;
  /** Đã lọc theo quyền ở tầng máy chủ — khung này không tự quyết định */
  views: readonly PoView[];
  initialView: PoView;
  /** Nạp sẵn ở máy chủ. Khung dùng ngay, chỉ nạp lại khi realtime báo có đổi. */
  initialData: PoTwinResult;
  load: () => Promise<{ ok: true; data: PoTwinHeader; partial: string[] } | { ok: false; message: string }>;
  renderSlice: (view: PoView, head: PoTwinHeader) => React.ReactNode;
}) {
  const { t } = useLanguage();
  const [view, setView] = useState<PoView>(initialView);
  const [head, setHead] = useState<PoTwinHeader | null>(initialData.ok ? initialData.data : null);
  const [partial, setPartial] = useState<string[]>(initialData.ok ? initialData.partial : []);
  const [error, setError] = useState<string | null>(initialData.ok ? null : initialData.message);
  const [busy, setBusy] = useState(false);

  const { revision, live } = usePoRealtime(poId);

  const refresh = useCallback(async () => {
    setBusy(true);
    const res = await load();
    if (res.ok) {
      setHead(res.data);
      setPartial(res.partial);
      setError(null);
    } else {
      setError(res.message);
    }
    setBusy(false);
  }, [load]);

  // Bỏ qua lượt đầu: dữ liệu máy chủ vừa giao còn nóng, gọi lại ngay là một
  // vòng đi-về thừa cho MỌI lần mở trang.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    void refresh();
  }, [refresh, revision]);

  // Người dùng đổi vai trò hoặc quyền đổi giữa chừng thì lát cắt đang mở có thể
  // không còn được phép. Kéo về lát cắt đầu tiên còn hợp lệ thay vì hiện một
  // trang trắng không giải thích gì.
  useEffect(() => {
    if (views.length > 0 && !views.includes(view)) setView(views[0]);
  }, [views, view]);

  const partialMsg = useMemo(
    () => (partial.length === 0 ? null : t('po_partial').replace('{list}', partial.join(', '))),
    [partial, t],
  );

  if (error !== null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
          <CloudOff className="h-8 w-8 text-rose-500" aria-hidden="true" />
          <p className="text-sm font-bold text-rose-800">{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {t('wh_retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!head) return <Skeleton />;

  return (
    <div className="min-w-0">
      <PoHeader
        head={head}
        live={live}
        action={
          busy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-500" aria-hidden="true" />
          ) : null
        }
      />

      <PoTabNav views={views} active={view} onChange={setView} />

      {partialMsg && (
        <p className="mx-auto max-w-[110rem] px-4 pt-3 sm:px-6">
          <span className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-900">
            <CloudOff className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {partialMsg}
          </span>
        </p>
      )}

      <main className="mx-auto min-w-0 max-w-[110rem] px-4 py-4 sm:px-6">
        {renderSlice(view, head)}
      </main>
    </div>
  );
}
