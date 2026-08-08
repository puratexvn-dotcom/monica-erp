'use server';

// ============================================================================
// 🔴 NGUỒN DỮ LIỆU CỦA GLOBAL SEARCH — **MỘT** LỜI GỌI, BA BẢNG
//
// 📐 Board Directive *GLOBAL SEARCH* 08/08/2026 §14:
//   > *"⛔ Không được tạo một loạt request riêng chỉ để Search… ⛔ Không tạo
//   > **10 module = 10 API calls**. Ưu tiên **1 unified search source**."*
//
// ─── ⚠️ ĐÂY LÀ MỘT ENDPOINT CÔNG KHAI GỌI THẲNG ĐƯỢC ───────────────────
// Server Action ⛔ **không** phải hàm nội bộ. Vì vậy hàm này:
//   ① tự xác thực bằng `getUser()` — ⛔ KHÔNG `getSession()` *(cookie giả mạo
//      được)*;
//   ② ⛔ **không** dùng `service_role` — nó chạy dưới **quyền của chính người
//      gọi**, nên **RLS là hàng rào thật**. Người ⛔ không được đọc `orders`
//      thì truy vấn trả rỗng, ⛔ không phải trả dữ liệu rồi mới lọc.
//
// 🔑 Nhờ đó Search ⛔ **không** thành lỗ rò: nó ⛔ không thấy được gì nhiều hơn
// những gì người dùng mở đúng màn hình ra cũng thấy.
//
// ⚠️ ⛔ KHÔNG ghi nhật ký cho lượt tìm. Đây là thao tác **ĐỌC**, và một sổ
// kiểm toán đầy dòng *"đã gõ chữ u"* là sổ ⛔ không ai đọc nổi nữa.
// ============================================================================
import { createClient } from '@/utils/supabase/server';

export interface KetQuaTim {
  id: string;
  loai: 'PO' | 'KHACH_HANG' | 'MA_HANG';
  /** Chuỗi người dùng nhận ra — mã PO · tên khách · mã hàng. */
  ma: string;
  /** Dòng phụ giải nghĩa. */
  phu: string;
  /** Đường đi khi bấm. */
  di: string;
  sac: string;
}

/** Số dòng mỗi bảng. ⚠️ Nhỏ **có chủ ý**: bảng kết quả chỉ bày 12 mục, nên kéo
 *  về 200 dòng là trả tiền băng thông cho thứ ⛔ không ai nhìn. */
const MOI_BANG = 6;

/** Chặn ký tự có nghĩa đặc biệt trong toán tử `ilike` của PostgREST.
 *
 *  ⚠️ ⛔ KHÔNG phải phòng SQL injection — Supabase đã tham số hoá. Đây là phòng
 *  **kết quả sai**: người gõ `%` mà ⛔ không thoát sẽ khớp **mọi dòng**, và một
 *  Search trả về cả bảng đọc ra là hỏng. */
function thoat(s: string): string {
  return s.replace(/[%_,()]/g, ' ').trim().slice(0, 60);
}

export async function timKiemToanCuc(tu: string): Promise<KetQuaTim[]> {
  const q = thoat(tu);
  if (q.length < 2) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // ⚠️ Chưa đăng nhập ⇒ **rỗng**, ⛔ không ném lỗi: trang chủ là lối vào CÔNG
  // KHAI, và một hộp tìm kiếm nổ đỏ với khách vãng lai là lỗi trải nghiệm chứ
  // ⛔ không phải cảnh báo bảo mật. Module và Thao tác vẫn tìm được ở client.
  if (!user) return [];

  const nhu = `%${q}%`;

  // 🔑 **Ba truy vấn CHẠY SONG SONG trong MỘT lượt gọi máy chủ.** Đây đúng
  // tinh thần *"1 unified search source"* của Board: người dùng gõ một lần,
  // trình duyệt đi một lượt.
  const [po, kh, mh] = await Promise.all([
    supabase.from('orders')
      .select('id, po_number, customer_name')
      .ilike('po_number', nhu).limit(MOI_BANG),
    supabase.from('customers')
      .select('id, customer_code, name')
      .or(`name.ilike.${nhu},customer_code.ilike.${nhu}`)
      .eq('is_active', true).limit(MOI_BANG),
    supabase.from('styles')
      .select('id, style_no, style_name')
      .or(`style_no.ilike.${nhu},style_name.ilike.${nhu}`)
      .limit(MOI_BANG),
  ]);

  const ra: KetQuaTim[] = [];

  for (const r of (po.data ?? []) as Array<{ id: string; po_number: string; customer_name: string | null }>) {
    ra.push({
      id: r.id, loai: 'PO', ma: r.po_number,
      phu: r.customer_name || '⚪ chưa gán khách hàng',
      di: `/md?po=${r.id}`, sac: 'blue',
    });
  }
  for (const r of (kh.data ?? []) as Array<{ id: string; customer_code: string; name: string }>) {
    ra.push({
      id: r.id, loai: 'KHACH_HANG', ma: r.name,
      phu: `Khách hàng · ${r.customer_code}`,
      di: `/md?tab=customers&id=${r.id}`, sac: 'emerald',
    });
  }
  for (const r of (mh.data ?? []) as Array<{ id: string; style_no: string; style_name: string | null }>) {
    ra.push({
      id: r.id, loai: 'MA_HANG', ma: r.style_no,
      phu: r.style_name || '⚪ chưa đặt tên',
      di: `/md?tab=styles&id=${r.id}`, sac: 'rose',
    });
  }

  return ra;
}
