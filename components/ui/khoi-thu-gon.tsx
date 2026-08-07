'use client';

// ============================================================================
// KHỐI THU GỌN — "Xem thêm" cho mọi Card / Box / Panel
//
// Board Directive 07/08/2026 *(MD V2 Final)* §10:
//
//   > *"Tất cả Card / Box / Panel chỉ hiển thị mặc định **3–4 dòng**. Nếu
//   > nhiều hơn: nút **Xem thêm** → Expand → hiện toàn bộ. **⛔ Không render
//   > sẵn 30–100 dòng.**"*
//
// ─── 🔑 KẸP CHIỀU CAO, ⛔ KHÔNG CẮT MẢNG ────────────────────────────────
// Cách hiển nhiên là `rows.slice(0, 4)`. Nhưng nó buộc **mọi nơi gọi** phải
// biết cấu trúc dữ liệu của mình, và với **bảng** *(`<table>` có `<thead>`)*
// thì cắt mảng còn làm hỏng cả phần đầu bảng.
//
// ⇒ Khối này kẹp **chiều cao hiển thị**, ⛔ không đụng dữ liệu. Nhờ vậy nó
// dùng được cho bảng, danh sách, lưới thẻ — bất cứ thứ gì.
//
// ⚠️ ĐÁNH ĐỔI ĐÃ BIẾT VÀ CHẤP NHẬN: nội dung **vẫn được dựng** trong DOM, chỉ
// bị che. Nó ⛔ **không** giảm chi phí render. Nó giảm đúng thứ Board đòi —
// **chiều cao và số lần cuộn**. Giảm chi phí render đòi ảo hoá danh sách, và
// đó là thay đổi kiến trúc, ⛔ không phải một vòng UX.
//
// ⚠️ ⛔ KHÔNG che khi nội dung vốn đã ngắn — một nút *"Xem thêm"* mở ra đúng
// thứ đang thấy là **lời hứa suông của giao diện**.
// ============================================================================
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { loiDiChu } from '@/components/ui';

export default function KhoiThuGon({
  caoToiDa = 232,
  nhan = 'Xem thêm',
  children,
}: {
  /** Chiều cao mở sẵn, px. Mặc định ~4 dòng bảng. */
  caoToiDa?: number;
  nhan?: string;
  children: React.ReactNode;
}) {
  const [mo, setMo] = useState(false);
  const [canThuGon, setCanThuGon] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Đo SAU khi dựng: chỉ hiện nút khi nội dung **thật sự** dài hơn.
    const do1 = () => setCanThuGon(el.scrollHeight > caoToiDa + 24);
    do1();
    const ro = new ResizeObserver(do1);
    ro.observe(el);
    return () => ro.disconnect();
  }, [caoToiDa, children]);

  return (
    <div>
      <div
        ref={ref}
        style={!mo && canThuGon ? { maxHeight: caoToiDa, overflow: 'hidden' } : undefined}
        className="relative"
      >
        {children}
        {/* Dải mờ ở đáy — dấu hiệu **thị giác** rằng còn nội dung bên dưới.
            Thiếu nó thì khối bị cắt trông như **kết thúc thật**. */}
        {!mo && canThuGon && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>

      {canThuGon && (
        <button
          type="button"
          onClick={() => setMo((v) => !v)}
          aria-expanded={mo}
          className={`mt-1 inline-flex items-center gap-1 px-2 py-1 ${loiDiChu} ${TYPE.caption} ${FONT_WEIGHT.semibold}`}
        >
          {mo
            ? <>Thu gọn <ChevronUp className="h-3 w-3" aria-hidden="true" /></>
            : <>{nhan} <ChevronDown className="h-3 w-3" aria-hidden="true" /></>}
        </button>
      )}
    </div>
  );
}
