// ============================================================================
// SỔ PHIÊN BẢN — KHOÁ KỸ THUẬT + PHÉP ĐỌC
//
// 📐 **Board Decision 07/08/2026**, mục *"Bổ sung thêm ①"*: *"Các chứng từ phải
// lưu Version. ⛔ Không overwrite dữ liệu."* Cách thi hành và **cái giá** của
// nó ghi ở `app/(dashboard)/md/_actions/audit.ts`.
//
// ─── ⚠️ VÌ SAO TỆP NÀY TỒN TẠI RIÊNG ─────────────────────────────────────
// `audit.ts` mang `'use server'`. Next.js **⛔ chỉ cho phép export hàm async**
// từ một tệp như vậy — export một hằng chuỗi ở đó làm **gãy build**, ⛔ không
// phải cảnh báo. Nên hằng và phép đọc thuần nằm ở đây, nơi **cả máy chủ lẫn
// trình duyệt** đều nhập được.
//
// ⛔ Không React · ⛔ không Supabase — chỉ dữ liệu vào, dữ liệu ra.
// ============================================================================

/** Sáu hành động `activity_log.action` chấp nhận — khớp `AUDIT_ACTION_LABEL`
 *  ở `schemas/md/collaboration.schema.ts`.
 *
 *  ⚠️ Khai ở đây chứ ⛔ không ở `audit.ts`: tệp đó mang `'use server'`. */
export type HanhDongNhatKy =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'EXPORT';

/** Số thứ tự phiên bản. `{ from: n, to: n+1 }`. */
export const KHOA_PHIEN_BAN = '__phien_ban';

/** Ảnh chụp **nguyên bản ghi** trước và sau. `{ from: truoc, to: sau }`. */
export const KHOA_ANH_CHUP = '__anh_chup';

/** Mọi khoá kỹ thuật — màn hình Nhật ký phải lọc chúng khỏi danh sách ô-đã-đổi. */
export const KHOA_KY_THUAT: readonly string[] = [KHOA_PHIEN_BAN, KHOA_ANH_CHUP];

export type OThayDoi = { from: unknown; to: unknown };

export interface PhienBanDoc {
  /** Số phiên bản tạo ra bởi lượt ghi này. `null` ⇒ dòng nhật ký kiểu cũ. */
  so: number | null;
  /** Ảnh chụp TRƯỚC. `null` ⇒ bản ghi mới, hoặc dòng nhật ký kiểu cũ. */
  truoc: Record<string, unknown> | null;
  /** Ảnh chụp SAU. `null` ⇒ chứng từ đã lưu trữ, hoặc dòng nhật ký kiểu cũ. */
  sau: Record<string, unknown> | null;
  /** Các ô THỰC SỰ đổi — đã bỏ khoá kỹ thuật. */
  o: Array<[string, OThayDoi]>;
}

function laBanGhi(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Tách một ô `changes` của `activity_log` thành phần **đọc được**.
 *
 * ⚠️ Chịu được **cả hai đời bản ghi**: dòng ghi trước 07/08/2026 ⛔ không có
 * khoá kỹ thuật nào, và phải hiện y như cũ chứ ⛔ không được rỗng. Nhật ký là
 * sổ **chỉ-ghi-thêm** *(`041`)* — ⛔ không có đường nào nâng cấp dòng cũ, nên
 * phép đọc phải nhận cả hai. Đây ⛔ không phải mã tạm.
 */
export function docPhienBan(changes: Record<string, OThayDoi> | null | undefined): PhienBanDoc {
  const c = changes ?? {};

  const pb = c[KHOA_PHIEN_BAN];
  const so = typeof pb?.to === 'number' ? pb.to : null;

  const ac = c[KHOA_ANH_CHUP];
  const truoc = laBanGhi(ac?.from) ? ac.from : null;
  const sau = laBanGhi(ac?.to) ? ac.to : null;

  const o = Object.entries(c).filter(([k]) => !KHOA_KY_THUAT.includes(k));

  return { so, truoc, sau, o };
}
