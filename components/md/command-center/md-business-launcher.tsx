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
// của mọi khối bên dưới: rủi ro · việc hôm nay · đơn hàng chỉ có nghĩa **sau
// khi** biết đây là phòng Merchandising.
//
// ⚠️ SẮC TRUNG TÍNH, ⛔ KHÔNG tô màu 10 ô. Launcher là **nền**, ⛔ không phải
// **báo động**. Tô màu chúng sẽ đánh bại chính khối rủi ro đỏ ngay bên dưới —
// đúng lỗi đo được ở bản V2, khi sáu thẻ xanh dương hút mắt khỏi khối đỏ.
//
// ⚠️ CON SỐ TRÊN Ô LÀ BẮT BUỘC. Launcher ⛔ không số chỉ là menu; có số thì nó
// thành **bản đồ tình trạng phòng ban**. `V.1`: ⛔ chưa đo được ⇒ **⚪**, ⛔
// KHÔNG ⇒ `0`.
// ============================================================================
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Check, Lock } from 'lucide-react';

import { TYPE, FONT_WEIGHT, LINE_HEIGHT } from '@/lib/design/typography';
import { STATUS } from '@/lib/design/tokens';
import {
  oLauncherMo, oLauncherKhoa, huyHieuLauncher, huyHieuLauncherKhoa,
  chuNhanLauncher, chuSoLauncher, chuSoLauncherTrong,
} from '@/components/ui';

export interface OLauncher {
  id: string;
  nhan: string;
  icon: LucideIcon;
  /** `null` ⇒ ⚪ **chưa đo được**, ⛔ KHÁC 0. */
  so: number | null;
  /** Bấm vào mở tab trong `/md`. */
  moTab?: string;
  /** Hoặc đi tới phân hệ khác. */
  href?: string;
  /** ⛔ Chưa mở khoá ⇒ hiện 🔒, ⛔ không bấm được. */
  khoa?: boolean;
}

// 🔴 Board *MD V5.1* §8: *"Các ô Launcher đang khá **nhạt**. Tăng độ nổi của
// **icon** và **số lượng**. **Giảm màu viền.** Tăng cảm giác hiện đại."*
//
// ─── 🔑 ĐỔI VIỀN LẤY BÓNG ───────────────────────────────────────────────
// Viền `slate-200` quanh mười ô vẽ ra **mười cái hộp**; mắt đọc *"biểu mẫu"*,
// ⛔ không đọc *"bảng điều khiển"* — đúng thứ §11 nói. Bỏ viền, thay bằng
// **bóng mảnh**: ô vẫn tách khỏi nền nhưng ⛔ không còn bị đóng khung.
//
// 🔑 Độ nổi chuyển từ **đường viền** sang **nội dung**: biểu tượng đặt trong
// một huy hiệu có nền, con số lên cỡ `metricSm` và đậm. Ô sáng lên nhờ thứ nó
// **chứa**, ⛔ không nhờ thứ **bao quanh** nó.
// ⚠️ Lớp lấy từ `components/ui`, ⛔ không viết màu thẳng — bánh cóc `TD-07`
// đã bắt đúng lần đầu tôi viết `ring-slate-900/5` ở đây.
const oMo = oLauncherMo;
const oKhoa = oLauncherKhoa;

function NoiDung({ t }: { t: OLauncher }) {
  const Icon = t.icon;
  return (
    <>
      {/* Dấu trạng thái ở góc — ✓ đã dùng được · 🔒 chưa mở khoá.
          ⚠️ `LI-3`: mờ ĐI CHỈ Ở BIỂU TƯỢNG, ⛔ không mờ chữ — chữ mờ là chữ
          ⛔ không đọc được, và đó là lỗi tiếp cận chứ ⛔ không phải hiệu ứng. */}
      <span className="absolute right-1.5 top-1.5">
        {t.khoa
          ? <Lock className="h-3 w-3 text-slate-400" aria-hidden="true" />
          : <Check className={`h-3 w-3 ${STATUS.healthy.text}`} aria-hidden="true" />}
      </span>

      {/* §8 — biểu tượng có huy hiệu nền: nổi hơn hẳn một nét vẽ trần. */}
      <span className={t.khoa ? huyHieuLauncherKhoa : huyHieuLauncher}>
        <Icon className={`h-4 w-4 ${t.khoa ? 'opacity-50' : ''}`} aria-hidden="true" />
      </span>
      <span className={`block ${chuNhanLauncher} ${TYPE.caption} ${LINE_HEIGHT.snug} ${FONT_WEIGHT.medium}`}>
        {t.nhan}
      </span>
      {/* §8 — con số là **dữ liệu**, nên nó phải nặng hơn cái nhãn. Bản trước
          số và nhãn cùng cỡ cùng sắc, nên ô đọc ra ⛔ không có trọng tâm. */}
      <span className={`block ${TYPE.metricSm} ${FONT_WEIGHT.bold} ${t.so === null ? chuSoLauncherTrong : chuSoLauncher}`}>
        {t.so === null ? '⚪' : t.so}
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
    <section aria-label="Phòng Merchandising" className="mb-4">
      <h2 className={`mb-2 text-slate-500 ${TYPE.overline}`}>Phòng Merchandising</h2>
      {/* 10 ô — điện thoại 4, bảng 5, máy bàn 10. ⛔ Không cuộn ngang ở khổ nào. */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-10">
        {dsO.map((t) => {
          if (t.khoa) {
            return (
              <div key={t.id} className={oKhoa} title={`${t.nhan} — ⛔ chưa mở khoá`} aria-disabled="true">
                <NoiDung t={t} />
              </div>
            );
          }
          if (t.href) {
            return (
              <Link key={t.id} href={t.href} prefetch={false} className={oMo} title={t.nhan}>
                <NoiDung t={t} />
              </Link>
            );
          }
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onMoTab(t.moTab as string)}
              className={oMo}
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
