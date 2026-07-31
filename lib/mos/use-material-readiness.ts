'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getMaterialReadinessClient, getRollTraceClient,
} from '@/app/(dashboard)/md/po/[poId]/_actions/material.client';
import type {
  MaterialReadiness, RollTrace,
} from '@/app/(dashboard)/md/po/[poId]/_services/material.service';

// ============================================================================
// HOOK CHO LÁT CẮT NGUYÊN PHỤ LIỆU
//
// ─── MỘT LƯỢT ĐI-VỀ CHO BẢNG, MỘT LƯỢT RIÊNG CHO CUỘN ────────────────────
// Bảng định mức: đúng MỘT truy vấn vào view v_po_material_readiness.
// Danh sách cuộn: chỉ gọi khi người dùng bấm vào một mã vải — và nhớ lại kết
// quả, bấm lại cùng mã vải không gọi lần hai.
//
// Không có N+1 nào ở đây: số lượt đi-về KHÔNG phụ thuộc số dòng định mức.
//
// Cùng khuôn với hai hook trước: `loading` (chưa có gì) khác `refreshing` (đã
// có số cũ), và chống kết quả về muộn ghi đè dữ liệu mới.
// ============================================================================

export interface MaterialState {
  data: MaterialReadiness | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => void;
  /** Cuộn của vật tư đang mở. null = chưa mở mã nào */
  trace: { materialId: string; rolls: RollTrace[] } | null;
  traceLoading: boolean;
  traceError: string | null;
  openTrace: (materialId: string) => void;
  closeTrace: () => void;
}

export function useMaterialReadiness(poId: string, revision = 0): MaterialState {
  const [data, setData] = useState<MaterialReadiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const seq = useRef(0);

  const [trace, setTrace] = useState<{ materialId: string; rolls: RollTrace[] } | null>(null);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  // Nhớ kết quả đã tải. Người dùng thường bấm qua bấm lại vài mã để so sánh;
  // gọi lại máy chủ mỗi lần là mỗi lần chờ 200ms cho dữ liệu vừa xem xong.
  const cache = useRef(new Map<string, RollTrace[]>());

  const run = useCallback(async () => {
    const mine = ++seq.current;
    setBusy(true);
    const res = await getMaterialReadinessClient(poId);
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

  // Kho thay đổi thì số liệu cuộn cũ không còn đúng — xoá bộ nhớ tạm, nếu không
  // người dùng mở lại đúng mã vừa xem sẽ thấy con số của lần trước.
  useEffect(() => {
    cache.current.clear();
  }, [revision]);

  const openTrace = useCallback((materialId: string) => {
    const hit = cache.current.get(materialId);
    if (hit) {
      setTrace({ materialId, rolls: hit });
      setTraceError(null);
      return;
    }
    setTraceLoading(true);
    setTraceError(null);
    void (async () => {
      const res = await getRollTraceClient(materialId);
      if (res.ok) {
        cache.current.set(materialId, res.rolls);
        setTrace({ materialId, rolls: res.rolls });
      } else {
        setTrace(null);
        setTraceError(res.message);
      }
      setTraceLoading(false);
    })();
  }, []);

  return {
    data,
    loading: busy && data === null,
    refreshing: busy && data !== null,
    error,
    reload: () => void run(),
    trace,
    traceLoading,
    traceError,
    openTrace,
    closeTrace: () => { setTrace(null); setTraceError(null); },
  };
}
