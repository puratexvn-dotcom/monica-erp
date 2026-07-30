'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getMdDashboardClient } from '@/app/(dashboard)/md/_actions/md4.client';
import type { MdDashboardData } from '@/app/(dashboard)/md/_services/dashboard.service';

// ============================================================================
// MỘT LẦN NẠP, HAI CHỖ DÙNG
//
// Khối chỉ số và khối biểu đồ nằm ở hai vị trí khác nhau trên trang nhưng dùng
// CHUNG một bộ số liệu. Mỗi khối tự gọi thì vừa tính lại toàn bộ hai lần cho
// mỗi lần mở trang, vừa có nguy cơ hai khối hiện hai con số lệch nhau nếu có ai
// đó ghi dữ liệu xen vào giữa hai lượt gọi — mà chúng lại đứng cạnh nhau trên
// cùng một màn hình.
//
// Hook giữ trạng thái ở component cha (md-client) rồi truyền xuống cả hai.
// ============================================================================

export interface MdDashboardState {
  data: MdDashboardData | null;
  loading: boolean;
  reload: () => void;
}

export function useMdDashboard(): MdDashboardState {
  const [data, setData] = useState<MdDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Bỏ qua kết quả về muộn sau khi component đã rời màn hình. Bấm "Tính lại"
  // nhiều lần rồi đóng trang mà vẫn setState là cảnh báo rò rỉ trong React.
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Mỗi lượt gọi mang một số thứ tự; chỉ lượt MỚI NHẤT được phép ghi kết quả.
  // Không có nó, hai lần bấm liên tiếp mà lượt đầu về sau sẽ ghi đè số cũ lên
  // số mới.
  const seqRef = useRef(0);

  const reload = useCallback(() => {
    const seq = ++seqRef.current;
    setLoading(true);
    void getMdDashboardClient().then((d) => {
      if (!aliveRef.current || seq !== seqRef.current) return;
      setData(d);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, reload };
}
