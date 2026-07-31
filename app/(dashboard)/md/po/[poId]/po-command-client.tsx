'use client';

import { useCallback } from 'react';

import PoCommandShell, { SliceComingSoon } from '@/components/md/po-command/po-command-shell';
import { getPoTwinHeaderClient } from './_actions/po-twin.client';
import type { PoTwinHeader, PoTwinResult, PoView } from '@/lib/mos/po-twin.contract';

// ============================================================================
// BỘ ĐIỀU PHỐI PHÍA CLIENT — Điều XIX (Adapter Pattern)
//
// Khung `PoCommandShell` không biết gì về đơn hàng: nó nhận một hàm nạp dữ liệu
// và một hàm vẽ lát cắt. Tệp này là ADAPTER nối khung dùng chung với nghiệp vụ
// PO — đúng mô hình đã áp dụng cho Command Center của MD và Kho.
//
// Giai đoạn 1 mọi lát cắt đều là khung rỗng NÓI THẬT là chưa dựng. Giai đoạn 2
// chỉ cần thay đúng một dòng `case 'executive'` — khung, phân quyền, phím tắt
// và realtime không phải đụng lại.
// ============================================================================

export default function PoCommandClient({
  poId,
  views,
  initialView,
  initialData,
}: {
  poId: string;
  views: readonly PoView[];
  initialView: PoView;
  /** Kết quả nạp ở MÁY CHỦ — mã PO hiện ngay lượt vẽ đầu, không khung xám */
  initialData: PoTwinResult;
}) {
  // useCallback để khung không coi đây là hàm mới mỗi lượt vẽ — nếu không,
  // effect nạp dữ liệu trong khung sẽ chạy lại vô tận.
  const load = useCallback(() => getPoTwinHeaderClient(poId), [poId]);

  const renderSlice = useCallback((view: PoView, head: PoTwinHeader) => {
    void head; // Giai đoạn 2 trở đi mới dùng tới
    switch (view) {
      // case 'executive': return <TabExecutive head={head} />;   ← Giai đoạn 2
      default:
        return <SliceComingSoon view={view} />;
    }
  }, []);

  return (
    <PoCommandShell
      poId={poId}
      views={views}
      initialView={initialView}
      initialData={initialData}
      load={load}
      renderSlice={renderSlice}
    />
  );
}
