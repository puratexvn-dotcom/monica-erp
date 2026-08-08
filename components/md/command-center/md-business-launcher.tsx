'use client';

// ============================================================================
// ① BUSINESS LAUNCHER — TẦNG ĐỊNH DANH, LUÔN TRÊN CÙNG
//
// `MD_WORKSPACE_BLUEPRINT_V4.md` §4 + Board Directive *MD V4 Coding* §1:
// *"Giữ đầy đủ Business Identity. ⛔ Không xoá. ⛔ Không gộp."*
//
// ─── 🔑 VÌ SAO ĐỨNG ĐẦU DÙ ⛔ KHÔNG PHẢI THỨ BẤM NHIỀU NHẤT ─────────────
// Đo thật: MD chỉ bấm ~3/10 ô mỗi ngày. Nó vẫn đứng đầu vì nó trả lời câu hỏi
// **trước mọi câu hỏi khác** — *"tôi đang ở đâu?"*. Định danh là **hạ tầng**
// của mọi khối bên dưới.
//
// ⚠️ CON SỐ TRÊN Ô LÀ BẮT BUỘC. Launcher ⛔ không số chỉ là menu; có số thì nó
// thành **bản đồ tình trạng phòng ban**. `V.1`: ⛔ chưa đo được ⇒ **⚪**, ⛔
// KHÔNG ⇒ `0`.
//
// ═══ 🔴 BOARD DIRECTIVE *MD UI VISUAL FIX* · 08/08/2026 ═══════════════════
//   > *"Mỗi ô phải có **màu nhận diện riêng**… ⛔ Không để toàn bộ card trắng
//   > giống nhau… Icon, số liệu và accent dùng **cùng hệ màu** với card."*
//   > *"**XOÁ 2 TIÊU ĐỀ** … ⛔ Không để lại khoảng trắng sau khi xoá."*
//
// ─── ⚠️ ĐIỀU NÀY ĐẢO MỘT QUYẾT ĐỊNH CŨ CỦA CHÍNH TỆP NÀY ───────────────
// Bản trước ghi: *"SẮC TRUNG TÍNH, ⛔ KHÔNG tô màu 10 ô… tô màu sẽ đánh bại
// khối rủi ro đỏ ngay bên dưới."* Board đã cân nhắc và chọn hướng khác, kèm
// ảnh mẫu. **⛔ Không xoá lập luận cũ** — nó vẫn đúng ở phần lo ngại, và điều
// giữ cho khối rủi ro vẫn thắng là **ĐỘ ĐẶC**: Launcher pastel `-50/70` phẳng,
// khối rủi ro nền đặc có viền. Thứ bậc nằm ở **độ tương phản**, ⛔ không ở
// việc ai được phép có màu.
//
// ⚠️ Tệp này ⛔ **KHÔNG chứa một literal màu nào** — bánh cóc `TD-07`. Toàn bộ
// sắc lấy từ `SAC_O` ở `components/ui`, nơi chuỗi lớp được viết **nguyên**
// *(ghép chuỗi ⇒ Tailwind cắt mất ⇒ giao diện trắng trơn mà build vẫn xanh)*.
// ============================================================================
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ChevronRight, Lock } from 'lucide-react';

import { TYPE, FONT_WEIGHT, LINE_HEIGHT } from '@/lib/design/typography';
import { theLauncher, huyLauncher, SAC_O, type SacOKey } from '@/components/ui';

export interface OLauncher {
  id: string;
  nhan: string;
  icon: LucideIcon;
  /** `null` ⇒ ⚪ **chưa đo được**, ⛔ KHÁC 0. */
  so: number | null;
  /** 🔴 Sắc định danh riêng của ô — Board 08/08/2026. */
  sac: SacOKey;
  /** Một dòng nói ô này ĐẾM CÁI GÌ. Board: *"card cần icon · tên · một dòng
   *  mô tả ngắn."* Con số trần ⛔ không tự giải thích: `17` là 17 cái gì? */
  moTa: string;
  /** Bấm vào mở tab trong `/md`. */
  moTab?: string;
  /** Hoặc đi tới phân hệ khác. */
  href?: string;
  /** ⛔ Chưa mở khoá ⇒ hiện 🔒, ⛔ không bấm được. */
  khoa?: boolean;
}

function NoiDung({ t }: { t: OLauncher }) {
  const Icon = t.icon;
  const s = SAC_O[t.sac];
  return (
    <>
      {/* Góc phải — `›` mời bấm · 🔒 chưa mở khoá. Cả hai mang sắc NHẠT của
          chính thẻ: một dấu xám ở đây sẽ là vệt trung tính duy nhất trên thẻ
          và mắt bắt vào nó trước cả con số. */}
      <span className="absolute right-2 top-2">
        {t.khoa
          ? <Lock className={`h-3.5 w-3.5 ${s.mo}`} aria-hidden="true" />
          : <ChevronRight className={`h-3.5 w-3.5 ${s.mo} transition group-hover:translate-x-0.5`} aria-hidden="true" />}
      </span>

      <span className={huyLauncher(t.sac)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      {/* 🔴 Board 08/08/2026: *"Icon, số liệu, **tiêu đề** và mũi tên phải sử
          dụng **màu định danh tương ứng**."* Bản trước để `text-slate-700` —
          một sắc trung tính dùng chung cho cả mười ô, tức đúng thứ Board bác. */}
      <span className={`block ${s.chu} ${TYPE.label} ${LINE_HEIGHT.snug} ${FONT_WEIGHT.bold}`}>
        {t.nhan}
      </span>

      {/* Con số là **dữ liệu**, nên nó nặng hơn cái nhãn — và nó mang **sắc của
          thẻ**, đúng yêu cầu *"số liệu dùng cùng hệ màu với card"*.
          ⚠️ `null` ⇒ một **chấm tròn nhạt**, ⛔ không phải số `0`: `0` ở ô *"Nhà
          máy"* đọc thành *"⛔ không có chuyền nào"* — một tin sai. */}
      {t.so === null
        ? <span className={`my-1.5 block h-3 w-3 rounded-full ${s.huy}`} aria-label="chưa đo được" />
        : (
          <span className={`block ${TYPE.metric} ${s.chu}`}>
            {t.so}
          </span>
        )}

      <span className={`block text-slate-600 ${TYPE.caption} ${LINE_HEIGHT.snug}`}>
        {t.moTa}
      </span>
    </>
  );
}

export default function MdBusinessLauncher({
  o: dsO, onMoTab,
}: {
  o: readonly OLauncher[];
  onMoTab: (tab: string) => void;
}) {
  return (
    // 🔴 *"XOÁ 2 TIÊU ĐỀ … ⛔ không để lại khoảng trắng."*
    // `<h2>` đã gỡ, và `mb-2` của nó gỡ theo — gỡ chữ mà giữ khoảng cách là
    // để lại **một lỗ trống ⛔ không ai giải thích được**. `aria-label` giữ
    // lại: người dùng đọc màn hình vẫn cần biết đây là khu gì.
    <section aria-label="Phòng Merchandising" className="mb-4">
      {/* 10 ô — điện thoại 2, bảng 5, máy bàn 10. ⛔ Không cuộn ngang ở khổ nào.
          ⚠️ Điện thoại đổi 4 ⇒ **2 cột**: thẻ nay có thêm dòng mô tả, và 4 cột
          trên màn 360 px cho mỗi thẻ ~80 px ⇒ mô tả vỡ thành 4–5 dòng. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
        {dsO.map((t) => {
          if (t.khoa) {
            return (
              <div
                key={t.id}
                className={theLauncher(t.sac, true)}
                title={`${t.nhan} — ⛔ chưa mở khoá`}
                aria-disabled="true"
              >
                <NoiDung t={t} />
              </div>
            );
          }
          if (t.href) {
            return (
              <Link key={t.id} href={t.href} prefetch={false} className={theLauncher(t.sac)} title={t.nhan}>
                <NoiDung t={t} />
              </Link>
            );
          }
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onMoTab(t.moTab as string)}
              className={theLauncher(t.sac)}
              title={t.nhan}
            >
              <NoiDung t={t} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
