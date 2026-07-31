import { redirect } from 'next/navigation';

import { createClient } from '@/utils/supabase/server';
import { canAccess, isRole } from '@/lib/rbac';
import { defaultViewFor, viewsFor } from './_services/po-rbac';
import { getExecutiveOverview } from './_services/executive.service';
import PoCommandClient from './po-command-client';

// ============================================================================
// PO COMMAND CENTER — TRANG TOÀN MÀN HÌNH
//
// ─── VÌ SAO LÀ MỘT ROUTE THẬT, KHÔNG PHẢI LỚP PHỦ ────────────────────────
// Chuyển LÁT CẮT không tải lại gì (toàn bộ ở client). Nhưng bản thân PO phải có
// địa chỉ riêng, vì ba việc hằng ngày phụ thuộc vào điều đó:
//   • Trưởng phòng dán link PO vào Chat, người nhận mở đúng đơn đó
//   • Nút Back của trình duyệt hoạt động đúng
//   • Buyer nhận link, mở ra thấy đúng đơn của mình (RLS chặn sẵn từ 018)
// Nhét vào một lớp phủ không có URL là mất cả ba — mà cả ba đều phục vụ Điều II:
// giảm Email/Zalo.
//
// ─── HAI TẦNG CHẶN QUYỀN ─────────────────────────────────────────────────
//   1. canAccess()  — vai trò này có được vào khu vực /md không
//   2. viewsFor()   — trong đó, xem được những lát cắt nào
// Cả hai đều là hàng rào GIAO DIỆN. Hàng rào thật vẫn là RLS trong Postgres.
//
// ─── VÌ SAO NẠP SẴN LƯỢT ĐẦU Ở MÁY CHỦ ───────────────────────────────────
// Bản đầu tôi để khung tự nạp hết ở client. Kết quả: mở link PO dán trong Chat
// thì lượt đầu chỉ thấy khung xám, mã PO và điểm rủi ro xuất hiện sau một vòng
// đi-về mạng. Với một trung tâm điều hành mà người ta mở hàng chục lần mỗi
// ngày, đó là hàng chục lần chờ vô ích.
//
// Nạp sẵn ở đây KHÔNG tạo ra hai đường nạp: vẫn đúng MỘT service
// `getPoTwinHeader`, chỉ là có hai người gọi — máy chủ gọi trực tiếp cho lượt
// đầu, client gọi qua Server Action cho các lượt làm mới sau. Một nguồn công
// thức, không có chỗ cho hai kết quả lệch nhau.
// ============================================================================

export default async function PoCommandPage({ params }: { params: { poId: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/md');

  const raw = user.app_metadata?.role;
  if (!isRole(raw) || !canAccess(raw, '/md')) redirect('/unauthorized');

  const views = viewsFor(raw);
  const initial = defaultViewFor(raw);
  // Vai trò vào được /md nhưng không được xem lát cắt nào là một cấu hình sai;
  // đưa về bàn làm việc còn hơn hiện một trang trắng không giải thích gì.
  if (!initial || views.length === 0) redirect('/md');

  // MỘT lượt gọi duy nhất cho cả thanh đầu lẫn lát cắt 1.
  //
  // ⚠️ Bản đầu gọi getPoTwinHeader ở đây, rồi lát cắt 1 lại gọi
  // getExecutiveOverview — mà hàm đó BÊN TRONG gọi getPoTwinHeader lần nữa.
  // Tức mỗi lần mở trang là hai lượt đọc y hệt nhau, mười hai truy vấn thừa.
  // Nay gọi một lần, chia kết quả cho cả hai nơi.
  //
  // Lát cắt 1 luôn là lát cắt mở đầu của MỌI vai trò (xem po-rbac.ts), nên nạp
  // sẵn nó không bao giờ là công thừa.
  const exec = await getExecutiveOverview(params.poId);
  const initialData = exec.ok
    ? ({ ok: true, data: exec.data.head, partial: exec.data.partial } as const)
    : ({ ok: false, message: exec.message } as const);

  return (
    <PoCommandClient
      poId={params.poId}
      views={views}
      initialView={initial}
      initialData={initialData}
      initialExecutive={exec.ok ? exec.data : null}
    />
  );
}
