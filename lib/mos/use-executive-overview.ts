'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getExecutiveOverviewClient } from '@/app/(dashboard)/md/po/[poId]/_actions/executive.client';
import type { ExecutiveOverview } from '@/app/(dashboard)/md/po/[poId]/_services/executive.service';

// ============================================================================
// HOOK CHO LÁT CẮT TỔNG QUAN ĐIỀU HÀNH
//
// Tách trạng thái tải/lỗi/dữ liệu ra khỏi component, đúng thứ tự đã phê duyệt:
// Service → Hook → Component.
//
// ─── VÌ SAO GIỮ DỮ LIỆU CŨ TRONG LÚC NẠP LẠI ─────────────────────────────
// Realtime có thể nảy vài lần mỗi phút. Mỗi lần lại xoá trắng rồi vẽ lại thì
// màn hình nhấp nháy và không ai đọc nổi. Chỉ LẦN ĐẦU mới có khung xám; các
// lần sau giữ nguyên số cũ và bật cờ `refreshing`.
//
// ─── VÌ SAO CHỐNG KẾT QUẢ VỀ MUỘN ────────────────────────────────────────
// Hai lượt nạp chồng nhau thì lượt CHẬM hơn có thể trả về SAU và ghi đè kết
// quả mới bằng dữ liệu cũ. Đếm số thứ tự lượt gọi và chỉ nhận lượt mới nhất.
// ============================================================================

export interface ExecutiveState {
  data: ExecutiveOverview | null;
  /** Lần đầu, chưa có gì để vẽ — đây mới là lúc hiện khung xám */
  loading: boolean;
  /** Đang nạp lại nhưng đã có dữ liệu cũ trên màn hình */
  refreshing: boolean;
  error: string | null;
  reload: () => void;
}

export function useExecutiveOverview(
  poId: string,
  revision = 0,
  /** Nạp sẵn ở máy chủ. Có nó thì lượt đầu KHÔNG gọi lại — trước đây trang gọi
   *  getPoTwinHeader hai lần cho mỗi lần mở, một lần cho thanh đầu và một lần
   *  nữa bên trong getExecutiveOverview. */
  initial?: ExecutiveOverview | null,
): ExecutiveState {
  const [data, setData] = useState<ExecutiveOverview | null>(initial ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(!initial);
  const seq = useRef(0);
  const first = useRef(true);

  const run = useCallback(async () => {
    const mine = ++seq.current;
    setBusy(true);
    const res = await getExecutiveOverviewClient(poId);
    if (mine !== seq.current) return; // Lượt cũ về muộn — bỏ qua
    if (res.ok) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.message);
    }
    setBusy(false);
  }, [poId]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (initial) return; // Dữ liệu máy chủ vừa giao còn nóng
    }
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, revision]);

  return {
    data,
    loading: busy && data === null,
    refreshing: busy && data !== null,
    error,
    reload: () => void run(),
  };
}
