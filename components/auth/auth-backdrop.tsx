import Image from 'next/image';

import { LOGO_SRC, LOGO_ALT, LOGO_COLORS } from '@/lib/brand';

// ============================================================================
// NỀN VÀ LOGO CHO MÀN HÌNH XÁC THỰC — `UI-1.3` *(bản đã thu hẹp)*
//
// ─── 🔴 VÌ SAO ⛔ KHÔNG PHẢI MỘT `layout.tsx` ────────────────────────────
// Backlog `UI-1.3` viết: *"ba trang tự dựng nền, logo, footer riêng — **ba bản
// chép tay**"*, và đề xuất gộp về `app/(auth)/layout.tsx`.
//
// **Đo mức trùng lặp thật thì giả định đó SAI:**
//
//     login              11 khớp khung · bố cục **HAI CỘT** có nền mờ
//     update-password     6 khớp khung · thẻ căn giữa có nền mờ
//     unauthorized        2 khớp khung · ⛔ không nền mờ · ⛔ không logo
//
// Ba trang **⛔ không dùng chung một khung**. Ép chúng vào một `layout.tsx` sẽ
// hoặc kéo `login` từ bố cục hai cột thành thẻ căn giữa — một **thay đổi thiết
// kế Board ⛔ không yêu cầu** — hoặc sinh ra một layout nhiều tuỳ chọn tới mức
// ⛔ không khử được trùng lặp nào.
//
// ⇒ Phần trùng lặp **THẬT** chỉ có hai thứ: **quầng nền mờ** và **khối logo**.
// Đó là **component**, ⛔ không phải layout. Tệp này là đúng chừng đó.
//
// ⚠️ `unauthorized` **cố ý ⛔ không dùng** tệp này. Trang 403 là thông báo
// lỗi — nó phải trông khác hẳn cánh cửa vào, nếu ⛔ không người dùng sẽ tưởng
// mình chỉ cần đăng nhập lại.
// ============================================================================

/**
 * Hai quầng sáng mờ ở hai góc đối nhau.
 *
 * ⚠️ `pointer-events-none` là bắt buộc: quầng phủ toàn màn, thiếu nó thì nó
 * nuốt mọi cú bấm và biểu mẫu đăng nhập thành ⛔ không dùng được.
 */
export function AuthBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: LOGO_COLORS[3], opacity: 0.28 }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{ background: LOGO_COLORS[4], opacity: 0.24 }}
      />
    </>
  );
}

/**
 * Khối logo dùng chung.
 *
 * ⚠️ `priority`: logo là ảnh lớn nhất **trên màn hình đầu tiên**. Thiếu cờ này
 * thì Next.js tải chậm nó, và người dùng nhìn một khoảng trắng đúng lúc họ cần
 * biết mình đang ở đúng hệ thống.
 */
export function AuthLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`relative mx-auto h-24 w-72 ${className}`}>
      <Image src={LOGO_SRC} alt={LOGO_ALT} fill sizes="288px" className="object-contain" priority />
    </div>
  );
}
