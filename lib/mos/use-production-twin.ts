'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getProductionTwinClient } from '@/app/(dashboard)/md/po/[poId]/_actions/production.client';
import type { ProductionTwin } from '@/app/(dashboard)/md/po/[poId]/_services/production.service';

// ============================================================================
// HOOK CHO LÁT CẮT SẢN XUẤT
//
// Cùng khuôn với useExecutiveOverview: phân biệt `loading` (chưa có gì, mới
// hiện khung xám) với `refreshing` (đã có số cũ, chỉ mờ đi). Realtime nảy vài
// lần mỗi phút — xoá trắng mỗi lần thì màn hình nhấp nháy không đọc nổi.
//
// Chống kết quả về muộn: hai lượt nạp chồng nhau thì lượt CHẬM có thể trả về
// SAU và ghi đè dữ liệu mới bằng dữ liệu cũ.
// ============================================================================

export interface ProductionState {
  data: ProductionTwin | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
}

export function useProductionTwin(poId: string, revision = 0): ProductionState {
  const [data, setData] = useState<ProductionTwin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const seq = useRef(0);

  const run = useCallback(async () => {
    const mine = ++seq.current;
    setBusy(true);
    const res = await getProductionTwinClient(poId);
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
