'use client';

import { useEffect, useState } from 'react';

import { docDeSua } from '@/app/(dashboard)/md/_actions/revisions.actions';
import type { LoaiChungTu } from '@/lib/mos/md/document-lock';

// ============================================================================
// NẠP BẢN GHI ĐẦY ĐỦ CHO HỘP THOẠI **SỬA**
//
// 🔴 Board Decision 07/08/2026 · `BUG-5` — *"Bổ sung đầy đủ Update cho …"*.
//
// ─── 🔑 VÌ SAO CÓ HOOK NÀY THAY VÌ ĐỔ TỪ DÒNG DANH SÁCH ──────────────────
// Dòng trong danh sách là **phép CHIẾU** — `CustomerRow` ⛔ không mang `phone`,
// `email`, `address`, `tax_code`. Đổ form từ nó rồi lưu là **ghi `null` đè lên
// mọi ô ⛔ không có trong phép chiếu**: sửa một chữ trong tên khách hàng thì
// **mất sạch** số điện thoại và địa chỉ, mà màn hình vẫn báo *"Đã cập nhật"*.
// Lý lẽ đầy đủ ở `docDeSua()` trong `revisions.actions.ts`.
//
// ⚠️ **BỐN hộp thoại dùng chung MỘT hook.** Viết bốn lần là bốn cơ hội để một
// trong bốn quên chờ dữ liệu về rồi bày ô nhập rỗng — và cái quên đó dẫn thẳng
// tới mất dữ liệu.
// ============================================================================

export interface TrangThaiSua {
  /** `true` khi đang mở ở chế độ **Sửa** *(⛔ không phải Tạo mới)*. */
  laSua: boolean;
  /** Bản ghi ĐẦY ĐỦ. `null` khi đang tạo mới, hoặc ⛔ chưa nạp xong. */
  row: Record<string, unknown> | null;
  dangNap: boolean;
  loi: string | null;
}

/**
 * Nạp bản ghi đầy đủ khi hộp thoại mở ở chế độ Sửa.
 *
 * ⚠️ **Chống "kết quả về muộn".** Người dùng mở Sửa bản A, đóng, mở Sửa bản B
 * ⇒ hai lời gọi chạy song song và **⛔ không có gì bảo đảm A về trước B**. Cờ
 * `boQua` cắt kết quả của lượt đã hết hiệu lực — thiếu nó thì form của B có
 * thể bị đổ dữ liệu của A, rồi lưu đè lên B.
 */
export function useSuaChungTu(
  loai: LoaiChungTu,
  open: boolean,
  suaId: string | null | undefined,
): TrangThaiSua {
  const laSua = Boolean(suaId);
  const [row, setRow] = useState<Record<string, unknown> | null>(null);
  const [dangNap, setDangNap] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !suaId) {
      setRow(null);
      setLoi(null);
      setDangNap(false);
      return;
    }

    let boQua = false;
    setDangNap(true);
    setLoi(null);
    void docDeSua(loai, suaId).then((r) => {
      if (boQua) return;
      setRow(r.row);
      setLoi(r.error);
      setDangNap(false);
    });
    return () => { boQua = true; };
  }, [loai, open, suaId]);

  return { laSua, row, dangNap, loi };
}

// ─── PHÉP ĐỌC Ô ────────────────────────────────────────────────────────────
//
// Bản ghi về từ CSDL là `Record<string, unknown>` — cố ý, vì `select('*')` ⛔
// không có kiểu tĩnh và `types/erp.ts` **đã từng nói dối** về cột nào tồn tại
// *(khai nhiều cột ⛔ không có trong CSDL, `tsc` vẫn sạch)*. Ba hàm dưới đây ép
// kiểu **đúng một chỗ**, và chịu được cột thiếu thay vì nổ.

/** Ô chữ. `null`/thiếu ⇒ `''` — form dùng chuỗi rỗng cho "chưa điền". */
export function oChu(row: Record<string, unknown> | null, k: string): string {
  const v = row?.[k];
  return v === null || v === undefined ? '' : String(v);
}

/** Ô số. `null`/thiếu/⛔ không phải số ⇒ `undefined` — form phân biệt được
 *  "chưa điền" với "bằng 0", và `0` là con số **có nghĩa** ở nhiều cột. */
export function oSo(row: Record<string, unknown> | null, k: string): number | undefined {
  const v = row?.[k];
  if (v === null || v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Ô ngày `YYYY-MM-DD`. CSDL trả `DATE` dạng chuỗi, `TIMESTAMPTZ` dạng ISO —
 *  cắt 10 ký tự đầu là đúng cho cả hai. */
export function oNgay(row: Record<string, unknown> | null, k: string): string {
  return oChu(row, k).slice(0, 10);
}
