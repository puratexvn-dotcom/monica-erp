'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getShipmentCenterClient } from '@/app/(dashboard)/md/po/[poId]/_actions/shipment.client';
import type { ShipmentCenter } from '@/app/(dashboard)/md/po/[poId]/_services/shipment.service';

// ============================================================================
// HOOK CHO LÁT CẮT XUẤT HÀNG
//
// Cùng khuôn với bốn hook trước — `loading` (chưa có gì) tách khỏi `refreshing`
// (đã có số cũ, đang lấy số mới). Gộp làm một thì mỗi lần realtime báo có thay
// đổi, cả tab sẽ chớp về khung xám dù số cũ vẫn đọc được.
//
// `seq` chống kết quả về muộn ghi đè dữ liệu mới.
// ============================================================================

export interface ShipmentState {
  data: ShipmentCenter | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
}

export function useShipmentCenter(poId: string, revision = 0): ShipmentState {
  const [data, setData] = useState<ShipmentCenter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const seq = useRef(0);

  const run = useCallback(async () => {
    const mine = ++seq.current;
    setBusy(true);
    const res = await getShipmentCenterClient(poId);
    if (mine !== seq.current) return;
    if (res.ok) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.message);
    }
    setBusy(false);
  }, [poId]);

  useEffect(() => {
    void run();
  }, [run, revision]);

  return {
    data,
    loading: busy && data === null,
    refreshing: busy && data !== null,
    error,
    reload: () => void run(),
  };
}
