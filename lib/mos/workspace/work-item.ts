// ============================================================================
// WORK ITEM — LÕI THUẦN CỦA "HÔM NAY TÔI CẦN LÀM GÌ?"
//
// ═══ 🔑 WORK ITEM LÀ PHÉP CHIẾU, ⛔ KHÔNG PHẢI MỘT BẢNG ═════════════════
// ADR-017 `WZ-1` · `WZ-3`, và đây là ràng buộc quan trọng nhất của cả tệp:
//
//   Việc **tự sinh ra** khi trạng thái nghiệp vụ chạm một ngưỡng, và **tự biến
//   mất** khi trạng thái đó thôi đúng. ⛔ KHÔNG có nút *"đã xong"*. ⛔ KHÔNG có
//   bảng `work_items`. ⛔ KHÔNG bao giờ có rác.
//
// ⚠️ Vì sao điều đó đáng giữ đến vậy: một hộp thư việc **do người đóng** sẽ
// tích rác từ tuần thứ hai — người ta đóng việc mà ⛔ không xử lý, và từ đó
// hộp thư nói dối. Một phép chiếu ⛔ **không nói dối được**: nó là mặt phản
// chiếu của dữ liệu, ⛔ không phải một danh sách song song.
//
// ⇒ Hệ quả trực tiếp: **⛔ KHÔNG cần migration nào** để có Work Inbox. Đó là
//   lý do khối này dựng được **ngay bây giờ**, trong khi Calendar và Alerts
//   *(vốn cần dữ liệu riêng)* vẫn còn chờ.
//
// ═══ VÌ SAO LUẬT LÀ DỮ LIỆU, ⛔ KHÔNG PHẢI MÃ ══════════════════════════
// `WZ-2`: mỗi Domain **khai** luật sinh việc của mình. Tệp này ⛔ **không**
// biết QA, Kho hay Merchandising là gì — nó chỉ biết **hình dạng** của một
// luật và cách chạy chúng. Thêm một luật mới cho một Domain ⇒ thêm một mục vào
// mảng, ⛔ không sửa engine.
//
// ⚠️ Tệp này **⛔ không import i18n**: nó trả về **KHOÁ**, ⛔ không trả câu
// chữ. Giữ vậy thì lõi kiểm được ⛔ không cần React, ⛔ không cần trình duyệt,
// và ba ngôn ngữ ⛔ không bao giờ lệch nhau vì một câu viết cứng ở đây.
// ============================================================================

/**
 * Mức khẩn của một việc.
 *
 * ⚠️ Chỉ **ba** mức, và đó là chủ ý. Bốn mức trở lên thì ⛔ không ai phân biệt
 * nổi mức 2 với mức 3, và mọi thứ trôi dần về mức cao nhất — đến lúc đó thang
 * đo thôi làm thang đo.
 */
export type WorkItemSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

/** Thứ tự xếp — càng nhỏ càng lên trên. */
const THU_TU: Record<WorkItemSeverity, number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

export interface WorkItem {
  /** Khoá ổn định. **⛔ KHÔNG được chứa số đo** — xem `WI-2` bên dưới. */
  id: string;
  severity: WorkItemSeverity;
  /** Khoá i18n của câu việc. Câu chữ nằm ở `messages/`, ⛔ không nằm ở đây. */
  labelKey: string;
  /** Biến chèn vào câu — số lượng, tên chuyền, tên lỗi… */
  vars?: Record<string, string | number>;
  /** Nơi đưa người dùng tới để **xử lý** việc. ⛔ Không có ⇒ việc chỉ để biết. */
  href?: string;
}

/**
 * Một luật sinh việc của một Domain.
 *
 * `T` là **hình dạng dữ liệu** mà Domain đó đưa vào — engine ⛔ không cần biết
 * nó là gì.
 */
export interface WorkItemRule<T> {
  id: string;
  severity: WorkItemSeverity;
  labelKey: string;
  /** Luật này có nổ ⛔ không, và nếu nổ thì kèm biến nào. */
  danhGia: (du_lieu: T) => { nổ: false } | { nổ: true; vars?: Record<string, string | number>; href?: string };
}

/**
 * Chạy toàn bộ luật của một Domain trên dữ liệu của nó.
 *
 * ─── HAI RÀNG BUỘC ĐƯỢC CƯỠNG CHẾ Ở ĐÂY ────────────────────────────────
 *
 * **`WI-1` · Xếp theo mức khẩn, giữ thứ tự khai báo trong cùng mức.**
 * Xếp bằng `sort` **ổn định** *(mặc định của `Array.prototype.sort` từ ES2019)*
 * nên hai việc cùng mức ⛔ **không** đảo chỗ giữa hai lần tải trang. Danh sách
 * việc nhảy chỗ mỗi lần làm mới là thứ khiến người dùng thôi tin nó.
 *
 * **`WI-2` · Một luật sinh TỐI ĐA một việc mỗi lần chạy.**
 * Luật cần sinh nhiều việc *(mỗi chuyền một việc)* thì khai **nhiều luật** —
 * mỗi luật một `id` riêng. ⛔ Không cho một luật trả mảng: khi ấy `id` phải
 * sinh động, mà `id` sinh động là chỗ trùng khoá React và mất trạng thái cuộn.
 */
export function chieuViec<T>(luat: readonly WorkItemRule<T>[], du_lieu: T): WorkItem[] {
  const ra: WorkItem[] = [];

  for (const l of luat) {
    const kq = l.danhGia(du_lieu);
    if (!kq.nổ) continue;
    ra.push({
      id: l.id,
      severity: l.severity,
      labelKey: l.labelKey,
      ...(kq.vars ? { vars: kq.vars } : {}),
      ...(kq.href ? { href: kq.href } : {}),
    });
  }

  return ra.sort((a, b) => THU_TU[a.severity] - THU_TU[b.severity]);
}

/**
 * Đếm việc theo mức — dùng cho huy hiệu trên nút `Work` và tiêu đề khối.
 *
 * ⚠️ Trả **cả ba** khoá kể cả khi bằng 0. Trả thiếu khoá thì nơi gọi phải viết
 * `?? 0` ở mọi chỗ, và chỉ cần quên một chỗ là ra `undefined` trên màn hình.
 */
export function demTheoMuc(viec: readonly WorkItem[]): Record<WorkItemSeverity, number> {
  const dem: Record<WorkItemSeverity, number> = { CRITICAL: 0, WARNING: 0, INFO: 0 };
  for (const v of viec) dem[v.severity] += 1;
  return dem;
}
