'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';

import PoCommandShell, { SliceComingSoon } from '@/components/md/po-command/po-command-shell';
import TabExecutive from '@/components/md/po-command/tabs/tab-executive';
// ⚠️ NẠP TRỄ, KHÔNG import thẳng.
//
// Lát cắt Sản xuất kéo theo Recharts. Import thẳng thì gói của route nhảy từ
// 8,65 kB lên 133 kB — GẤP MƯỜI LĂM LẦN — và MỌI người mở một PO đều phải tải
// chỗ đó, kể cả người chỉ xem Tổng quan rồi đóng. Trên mạng xưởng đó là vài
// giây chờ vô ích mỗi lần mở đơn.
//
// Nạp trễ: chỉ ai bấm sang Sản xuất mới tải. Khung xám giữ nguyên chiều cao để
// nội dung phía dưới không nhảy khi mã về tới.
const TabMaterial = dynamic(
  () => import('@/components/md/po-command/tabs/tab-material'),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />,
  },
);

const TabProduction = dynamic(
  () => import('@/components/md/po-command/tabs/tab-production'),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />,
  },
);

const TabQuality = dynamic(
  () => import('@/components/md/po-command/tabs/tab-quality'),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />,
  },
);

const TabShipment = dynamic(
  () => import('@/components/md/po-command/tabs/tab-shipment'),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />,
  },
);
import { getPoTwinHeaderClient } from './_actions/po-twin.client';
import type { PoTwinHeader, PoTwinResult, PoView } from '@/lib/mos/po-twin.contract';
import type { ExecutiveOverview } from './_services/executive.service';

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
  initialExecutive,
}: {
  poId: string;
  views: readonly PoView[];
  initialView: PoView;
  /** Kết quả nạp ở MÁY CHỦ — mã PO hiện ngay lượt vẽ đầu, không khung xám */
  initialData: PoTwinResult;
  /** Lát cắt 1 cũng nạp sẵn: nó là lát cắt mở đầu của mọi vai trò */
  initialExecutive: ExecutiveOverview | null;
}) {
  // useCallback để khung không coi đây là hàm mới mỗi lượt vẽ — nếu không,
  // effect nạp dữ liệu trong khung sẽ chạy lại vô tận.
  const load = useCallback(() => getPoTwinHeaderClient(poId), [poId]);

  const renderSlice = useCallback((view: PoView, head: PoTwinHeader, revision: number) => {
    void head; // Lát cắt tự nạp phần dữ liệu riêng qua service của nó
    switch (view) {
      case 'executive':
        return <TabExecutive poId={poId} revision={revision} initial={initialExecutive} />;
      case 'material':
        return <TabMaterial poId={poId} revision={revision} />;
      case 'production':
        // Lát cắt này KHÔNG nạp sẵn ở máy chủ: nó không phải lát cắt mở đầu, nạp
        // trước nghĩa là mọi lần mở trang đều trả giá cho thứ có thể không ai xem.
        return <TabProduction poId={poId} revision={revision} />;
      case 'quality':
        return <TabQuality poId={poId} revision={revision} />;
      case 'shipment':
        return <TabShipment poId={poId} revision={revision} />;
      default:
        return <SliceComingSoon view={view} />;
    }
  }, [poId, initialExecutive]);

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
