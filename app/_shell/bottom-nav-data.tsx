import { createClient } from '@/utils/supabase/server';
import { isRole, type Role } from '@/lib/rbac';
import AppBottomNav from '@/components/app-bottom-nav';
import type { ReportMetric } from '@/components/report-sheet';

// ============================================================================
// THANH ĐIỀU HƯỚNG DƯỚI — PHẦN CẦN DỮ LIỆU, TÁCH RA ĐỂ ⛔ KHÔNG CHẶN HTML
//
// ─── 🔴 LỖI HIỆU NĂNG ĐÃ ĐO ĐƯỢC, 07/08/2026 ────────────────────────────
// `app/layout.tsx` — layout **GỐC**, chạy cho **MỌI trang** — là một
// `async function` và bên trong nó:
//
//     await supabase.auth.getUser()                 ← một lượt đi–về mạng
//     await Promise.allSettled([ orders…, production_orders… ])   ← 2 truy vấn
//
// Layout gốc `await` thì React ⛔ **không có gì để gửi đi** cho tới khi nó
// xong. Nghĩa là **từng byte HTML của mọi trang** phải xếp hàng sau một lượt
// gọi Auth và hai câu truy vấn CSDL.
//
// Đo bằng `curl` trên chính máy chủ *(loại sạch nhiễu trình duyệt)*:
//
//     ⛔ không cookie phiên :  ttfb 0,026 – 0,056 s
//     có cookie phiên       :  ttfb 0,426 – 0,720 s     ← chậm gấp ~13 lần
//
// 🔑 Và `time_starttransfer == time_total` — tức máy chủ **⛔ không stream gì
// cả**, nó giữ toàn bộ trang. `<Suspense>` ở `app/page.tsx` ⛔ **vô tác dụng**
// khi thứ chặn nằm ở **layout gốc**, tức **phía trên** ranh giới đó.
//
// ─── 🔑 CÁCH SỬA ────────────────────────────────────────────────────────
// Layout gốc trở lại **đồng bộ**; phần cần dữ liệu dời xuống đây và được bọc
// `<Suspense>`. Khung trang bay đi ngay, thanh dưới điền vào sau.
//
// ⚠️ ⛔ KHÔNG mất chức năng nào: vẫn đúng vai, vẫn đúng số. Thứ duy nhất đổi là
// **thứ tự** — người dùng thấy trang trước, thấy thanh dưới sau vài trăm mili
// giây, thay vì ngồi nhìn màn hình trắng chờ cả hai.
//
// ⚠️ ⛔ KHÔNG phải hàng rào bảo mật. Thanh này chỉ **bày nút**; chặn thật vẫn ở
// `middleware` · `guard()` · RLS.
// ============================================================================

const DA_DONG = ['COMPLETED', 'CLOSED', 'CANCELLED', 'SHIPPED'];

export default async function BottomNavData() {
  let role: Role | null = null;
  let reportMetrics: ReportMetric[] = [];

  // Lỗi ở đây ⛔ không được làm sập ứng dụng: thiếu vai thì thanh vẫn hiện,
  // nút "Bàn làm việc" chỉ dẫn về `/login`.
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const raw = user?.app_metadata?.role;
    if (isRole(raw)) role = raw;

    if (role === 'md' || role === 'giamdoc') {
      // 🔴 ĐẾM BẰNG `count`, ⛔ KHÔNG kéo cả bảng về rồi `.filter().length`.
      // Bản trước `select('status')` lấy **mọi dòng** của `orders` và
      // `production_orders` chỉ để đếm — chi phí tăng tuyến tính theo số đơn,
      // và nó nằm trên đường chặn HTML của mọi trang.
      const [poRes, prodRes] = await Promise.allSettled([
        supabase.from('orders')
          .select('id', { count: 'exact', head: true })
          .not('status', 'in', `(${DA_DONG.join(',')})`),
        supabase.from('production_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'PENDING'),
      ]);

      // ⚠️ `null` ⇒ **⛔ chưa đọc được**, ⛔ KHÁC 0 — `V.1`. Panel sẽ hiện `—`.
      const running = poRes.status === 'fulfilled' && !poRes.value.error
        ? poRes.value.count ?? null : null;
      const pendingProd = prodRes.status === 'fulfilled' && !prodRes.value.error
        ? prodRes.value.count ?? null : null;

      const nf = new Intl.NumberFormat('vi-VN');
      reportMetrics = [
        {
          label: 'Tổng số PO đang chạy',
          value: running === null ? '—' : nf.format(running),
          unit: running === null ? undefined : 'PO',
        },
        {
          label: 'Lệnh sản xuất chờ xử lý',
          value: pendingProd === null ? '—' : nf.format(pendingProd),
          unit: pendingProd === null ? undefined : 'lệnh',
          tone: pendingProd && pendingProd > 0 ? 'amber' : 'emerald',
        },
      ];
    }
  } catch {
    role = null;
  }

  return <AppBottomNav role={role} reportMetrics={reportMetrics} />;
}
