'use server';

import { createClient } from '@/utils/supabase/server';
import { HAN_SIGNED_URL_GIAY, BANG_THEO_ENTITY, type EntityBangChung } from '@/lib/mos/evidence/access';

// ============================================================================
// 🔴 PHÁT URL CÓ HẠN CHO TỆP BẰNG CHỨNG — Board 08/08/2026 §2 · §3
//
//   > *"⛔ Không chỉ kiểm 'User đã đăng nhập chưa'. Phải kiểm: User có quyền
//   > trên entity ⛔ · có quyền xem record đó ⛔ · Evidence có thuộc đúng entity
//   > ⛔."*
//
// ─── 🔑 CÁCH KIỂM QUYỀN — DÙNG LẠI RLS, ⛔ KHÔNG VIẾT BỘ LUẬT THỨ HAI ───
// Hàm này **⛔ không** tự phán quyết ai được xem gì. Nó **hỏi CSDL**: đọc bản
// ghi cha bằng **chính phiên của người gọi**. Đọc được ⇒ được xem bằng chứng
// của nó. ⛔ Không đọc được ⇒ từ chối.
//
// 🔑 Vì sao đây là thiết kế đúng, ⛔ không phải đường tắt:
//   · RLS **đã là** nguồn chân lý về *"ai thấy đơn nào"* — 56 migration dựng
//     nên nó. Viết một bộ luật quyền thứ hai ở tầng ứng dụng là dựng **hai
//     nguồn sự thật**, và chúng sẽ lệch nhau đúng vào lúc ⛔ không ai để ý.
//   · Nhà thầu ngoài được khoanh vùng bằng **Assignment** *(Playbook Điều
//     XXX)*, và RLS đã thi hành điều đó. Hỏi RLS là tự động đúng luật ấy —
//     ⛔ không phải nhớ chép lại nó.
//
// ⚠️ **⛔ TUYỆT ĐỐI KHÔNG dùng `service_role` ở đây.** Nó mang `BYPASSRLS`, nên
// dùng nó là **vô hiệu hoá đúng phép kiểm mà hàm này tồn tại để làm**.
//
// ─── ⚠️ HAI PHÉP KIỂM, ⛔ KHÔNG PHẢI MỘT ────────────────────────────────
//   ① Tệp có **thuộc về** bản ghi đó ⛔ — tra `md_documents`, ⛔ không tin
//      đường dẫn client gửi lên. Thiếu bước này thì ai cũng xin được URL cho
//      **bất kỳ** tệp nào, chỉ cần kèm id một đơn họ có quyền.
//   ② Người gọi có đọc được **bản ghi cha** ⛔ — hỏi RLS.
//
// 🔑 Bỏ ① là mở toang: `layUrlBangChung('ORDER', <đơn của tôi>, '<path tệp
//    của người khác>')` sẽ chạy. Đó là lỗ hổng **IDOR** kinh điển, và nó ⛔
//    không lộ ra ở bất kỳ bài kiểm nào chỉ đo *"đúng người, đúng đơn"*.
// ============================================================================

export interface KetQuaUrl {
  ok: boolean;
  url?: string;
  /** Số giây URL còn sống — để tầng vẽ biết lúc nào phải xin lại. */
  hanGiay?: number;
  message: string;
}

export async function layUrlBangChung(
  entityType: string,
  entityId: string,
  storagePath: string,
): Promise<KetQuaUrl> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' };
  }

  const bang = BANG_THEO_ENTITY[entityType as EntityBangChung];
  if (!bang) {
    return { ok: false, message: `Loại đối tượng ⛔ không hợp lệ: ${entityType}` };
  }

  // ── ① Tệp có THUỘC VỀ bản ghi này ⛔ ────────────────────────────────────
  // ⚠️ Tra bảng, ⛔ **KHÔNG** tin `storagePath` client gửi lên. Đây là chốt
  //    chặn chống `IDOR`: thiếu nó thì một đường dẫn bất kỳ ghép với một
  //    `entityId` hợp lệ là đủ để lấy URL.
  const { data: tep } = await supabase
    .from('md_documents')
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('storage_path', storagePath)
    .is('deleted_at', null)
    .maybeSingle();

  if (!tep) {
    return {
      ok: false,
      message: 'Tệp này ⛔ không thuộc về bản ghi đã chỉ định, hoặc đã được lưu trữ.',
    };
  }

  // ── ② Người gọi có ĐỌC ĐƯỢC bản ghi cha ⛔ — hỏi RLS ────────────────────
  // 🔑 Truy vấn chạy bằng **phiên của chính người gọi**, nên policy RLS của
  //    bảng cha quyết định. ⛔ Không dòng nào trả về ⇒ họ ⛔ không có quyền
  //    thấy bản ghi ⇒ càng ⛔ không có quyền thấy bằng chứng của nó.
  const { data: cha } = await supabase.from(bang).select('id').eq('id', entityId).maybeSingle();
  if (!cha) {
    return {
      ok: false,
      message: 'Bạn ⛔ không có quyền xem bản ghi chứa tệp này.',
    };
  }

  // ── ③ Phát URL CÓ HẠN ──────────────────────────────────────────────────
  const { data, error } = await supabase.storage
    .from('evidences')
    .createSignedUrl(storagePath, HAN_SIGNED_URL_GIAY);

  if (error || !data?.signedUrl) {
    return { ok: false, message: `⛔ Không phát được đường dẫn: ${error?.message ?? 'lỗi ⛔ không rõ'}` };
  }

  return { ok: true, url: data.signedUrl, hanGiay: HAN_SIGNED_URL_GIAY, message: 'OK' };
}
