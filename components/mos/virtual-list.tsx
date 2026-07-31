'use client';

import { useCallback, useMemo, useRef, useState } from 'react';

// ============================================================================
// CUỘN ẢO — Điều XXII · Điều XVIII
//
// ─── VÌ SAO TỰ VIẾT CHỨ KHÔNG CÀI THƯ VIỆN ───────────────────────────────
// @tanstack/react-virtual là thư viện tốt, nhưng nó kéo thêm một phụ thuộc vào
// một dự án đã có 87,6 kB gói dùng chung, chỉ để làm một phép tính: hàng nào
// đang nằm trong khung nhìn. Ba mươi dòng dưới đây làm đúng chừng đó.
//
// ─── ĐIỀU XVIII: KHÔNG BIẾT NGHIỆP VỤ ────────────────────────────────────
// Không biết định mức, không biết cuộn vải, không biết PO. Nhận một mảng và
// một hàm vẽ dòng. Vì vậy đặt ở components/mos/ để mọi phân hệ dùng lại.
//
// ─── VÌ SAO CHIỀU CAO DÒNG PHẢI CỐ ĐỊNH ──────────────────────────────────
// Cuộn ảo cần biết TRƯỚC vị trí của mọi dòng để nhảy tới đúng chỗ. Dòng cao
// thấp khác nhau thì phải đo từng dòng sau khi vẽ, và mỗi lần đo là một lần
// bố cục bị tính lại — thanh cuộn sẽ giật. Cố định chiều cao là cái giá phải
// trả, và nó rẻ với một bảng dữ liệu.
//
// ⚠️ Dưới ngưỡng `threshold` thì KHÔNG cắt gì cả, vẽ thẳng toàn bộ: với hai
// mươi dòng, chi phí tính toán cuộn ảo lớn hơn chi phí vẽ, mà lại làm mất khả
// năng dùng Ctrl+F của trình duyệt.
// ============================================================================

/** Dưới ngần này dòng thì vẽ thẳng, không cắt */
const DEFAULT_THRESHOLD = 40;
/** Vẽ dư mấy dòng ngoài khung nhìn để cuộn nhanh không thấy khoảng trắng */
const OVERSCAN = 6;

export default function VirtualList<T>({
  items,
  rowHeight,
  height,
  renderRow,
  keyOf,
  threshold = DEFAULT_THRESHOLD,
  className = '',
}: {
  items: readonly T[];
  /** Chiều cao MỘT dòng, pixel. Phải khớp chiều cao thật của renderRow. */
  rowHeight: number;
  /** Chiều cao khung nhìn, pixel */
  height: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  keyOf: (item: T, index: number) => string;
  threshold?: number;
  className?: string;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const onScroll = useCallback(() => {
    if (ref.current) setScrollTop(ref.current.scrollTop);
  }, []);

  const virtual = items.length > threshold;

  const { slice, offset, total } = useMemo(() => {
    if (!virtual) return { slice: items as T[], offset: 0, total: items.length * rowHeight };
    const first = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
    const visible = Math.ceil(height / rowHeight) + OVERSCAN * 2;
    return {
      slice: items.slice(first, first + visible) as T[],
      offset: first * rowHeight,
      total: items.length * rowHeight,
    };
  }, [items, virtual, scrollTop, rowHeight, height]);

  if (!virtual) {
    return <div className={className}>{items.map((it, i) => renderRow(it, i))}</div>;
  }

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      style={{ height }}
      className={`overflow-y-auto ${className}`}
    >
      {/* Khối rỗng cao đúng bằng toàn bộ danh sách — thanh cuộn của trình duyệt
          phải dài đúng như khi vẽ đủ, nếu không người dùng kéo tới cuối mà danh
          sách vẫn còn. */}
      <div style={{ height: total, position: 'relative' }}>
        <div style={{ transform: `translateY(${offset}px)` }}>
          {slice.map((it, i) => {
            const realIndex = Math.floor(offset / rowHeight) + i;
            return (
              <div key={keyOf(it, realIndex)} style={{ height: rowHeight }}>
                {renderRow(it, realIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
