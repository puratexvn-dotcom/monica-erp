'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { GC_TIME, STALE_TIME } from '@/lib/mos/contracts/query-keys';

// ============================================================================
// QUERY CLIENT — PHẠM VI CHỈ TRONG /md/assignments
//
// ─── VÌ SAO KHÔNG ĐẶT Ở ROOT LAYOUT ──────────────────────────────────────
// Quyết định Kiến trúc sư: React Query **chỉ dùng cho /md/assignments**, sáu
// hook tự viết hiện có GIỮ NGUYÊN.
//
// Đặt Provider ở root layout là kéo nó vào cả 12 phân hệ — kể cả bốn phân hệ
// đang chạy thật và đã nghiệm thu (/md · Chất lượng · Xuất hàng · Bảng Giám
// đốc). Đặt ở đây thì mọi thứ ngoài nhánh này **không đổi một byte nào**, và
// gỡ ra chỉ là xoá một tệp.
//
// Đánh đổi đã biết: rời khỏi /md/assignments là bộ nhớ đệm bị bỏ. Chấp nhận
// được — đây là màn hình tác nghiệp, người dùng ở lại trong nhánh khi làm việc.
// Khi phân hệ thứ hai cần React Query, lúc đó mới nâng Provider lên một tầng,
// và đó là một quyết định có bằng chứng chứ không phải phòng xa.
// ============================================================================

export function AssignmentQueryProvider({ children }: { children: ReactNode }) {
  // ⚠️ `useState(() => ...)` chứ KHÔNG phải `new QueryClient()` ở thân hàm.
  // Viết trực tiếp thì mỗi lần render lại sinh một client mới, ném sạch bộ nhớ
  // đệm — triệu chứng là màn hình gọi lại mạng liên tục mà không ai hiểu vì sao.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ⚠️ Mặc định lấy TỪ BẢNG CHÍNH SÁCH, không gõ số ở đây. Hook nào
            // cần bậc khác thì CHỌN một bậc khác trong cùng bảng đó — không hook
            // nào được phép phát minh một con số.
            staleTime: STALE_TIME.TRANSACTION,
            gcTime: GC_TIME,

            // ⚠️ TẮT `refetchOnWindowFocus`. Xưởng may dùng máy tính bảng dùng
            // chung, người này đưa cho người kia — mỗi lần chạm màn hình là một
            // lượt gọi mạng. Làm mới xảy ra khi GHI XONG, đúng lúc và đúng chỗ.
            refetchOnWindowFocus: false,

            // Thử lại MỘT lần. Lỗi ở đây phần lớn là quyền hoặc ràng buộc —
            // thử lại năm lần chỉ làm người dùng chờ lâu hơn để nhận cùng câu
            // trả lời.
            retry: 1,
          },
          mutations: {
            // ⚠️ KHÔNG bao giờ tự thử lại lệnh GHI. Lập phần việc hai lần vì
            // mạng chập là tạo ra hai số nghiệp vụ thật, và không có gì gỡ lại
            // được ngoài xoá mềm bằng tay.
            retry: 0,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
