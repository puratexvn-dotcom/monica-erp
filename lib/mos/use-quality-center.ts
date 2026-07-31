'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getQualityCenterClient } from '@/app/(dashboard)/md/po/[poId]/_actions/quality.client';
import type { QualityCenter } from '@/app/(dashboard)/md/po/[poId]/_services/quality.service';

// ============================================================================
// HOOK CHO LÁT CẮT CHẤT LƯỢNG
//
// Cùng khuôn với ba hook trước — `loading` (chưa có gì) tách khỏi `refreshing`
// (đã có số cũ, đang lấy số mới): nếu gộp làm một thì mỗi lần realtime báo có
// thay đổi, cả tab sẽ chớp về khung xám dù số cũ vẫn đọc được.
//
// `seq` chống kết quả về muộn: người dùng bấm tải lại hai lần liên tiếp, lượt
// đầu về sau lượt sau thì phải BỎ, không được ghi đè dữ liệu mới bằng dữ liệu
// cũ hơn.
// ============================================================================

export interface QualityState {
  data: QualityCenter | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
}

export function useQualityCenter(poId: string, revision = 0): QualityState {
  const [data, setData] = useState<QualityCenter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const seq = useRef(0);

  const run = useCallback(async () => {
    const mine = ++seq.current;
    setBusy(true);
    const res = await getQualityCenterClient(poId);
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
