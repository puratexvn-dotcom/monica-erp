import { DASH, type HomeMetrics } from '../home-metrics';
import type { ModuleItem } from '../home-modules';

// ============================================================================
// TRẠNG THÁI PHÂN HỆ — SUY RA, KHÔNG BỊA
//
// Hàm thuần: nhận DỮ LIỆU, trả PHÁN QUYẾT. Không gọi mạng, không đọc CSDL.
//
// ─── ⚠️ ĐIỀU LUẬT KHÓ NHẤT CỦA MÀN HÌNH NÀY ──────────────────────────────
// Yêu cầu là "mỗi thẻ phải có cảm giác đang sống". Cám dỗ là gieo vài con số
// cho đẹp. **Cấm tuyệt đối** (Playbook Điều XX · yêu cầu "Fake business data
// is prohibited").
//
// Nên trạng thái ở đây chỉ được suy từ ba dữ kiện CÓ THẬT:
//
//   ① Phân hệ đã có route chưa?          →  `href === null` ⇒ Beta
//   ② Người xem đã đăng nhập chưa?       →  `metrics.status`
//   ③ Số liệu thật đọc về được không?    →  `metrics.badges[href]`
//
// "Đang vận hành" nghĩa là *đọc được số thật của phân hệ này*, không phải một
// nhãn dán cho vui. Đọc không ra thì nói thẳng là chưa đo được — trong nhà máy,
// "không có số" và "số bằng 0" là hai chuyện khác hẳn nhau.
// ============================================================================

export type StatusTone = 'operational' | 'ready' | 'beta' | 'muted';

export interface ModuleStatus {
  /** Nhãn ngắn hiện cạnh chấm trạng thái */
  label: string;
  tone: StatusTone;
  /**
   * MỘT CÂU VẬN HÀNH — luôn có, không bao giờ rỗng.
   *
   * Có số thật thì đây là số thật. Không có thì đây là câu nói thẳng rằng chưa
   * có, chứ **không phải** số 0. Trong nhà máy, "không có số" và "số bằng 0" là
   * hai sự thật khác hẳn nhau; hiển thị nhầm cái này thành cái kia là nói dối
   * người đọc bằng một con số trông rất đáng tin.
   */
  line: string;
  /** `true` khi `line` là số liệu thật — dùng để tô đậm hơn phần chữ suông */
  hasData: boolean;
}

/** Lớp màu cho chấm trạng thái. Chuỗi nguyên vẹn — Tailwind JIT. */
export const TONE_DOT: Record<StatusTone, string> = {
  operational: 'bg-emerald-500',
  ready: 'bg-blue-500',
  beta: 'bg-amber-400',
  muted: 'bg-slate-300',
};

/** Lớp màu cho chữ nhãn trạng thái. */
export const TONE_TEXT: Record<StatusTone, string> = {
  operational: 'text-emerald-700',
  ready: 'text-blue-700',
  beta: 'text-amber-700',
  // slate-500 chứ không phải slate-400: đo trên nền trắng, slate-400 chỉ đạt
  // 2,56:1 — dưới ngưỡng WCAG AA. slate-500 đạt 4,76:1.
  muted: 'text-slate-500',
};

export function moduleStatus(mod: ModuleItem, metrics: HomeMetrics): ModuleStatus {
  // ① Chưa có route. Nói thật là đang dựng, và không hứa con số nào.
  if (!mod.href) {
    return { label: 'Beta', tone: 'beta', line: 'Đang phát triển', hasData: false };
  }

  // ② Chưa đăng nhập. KHÔNG hiện số liệu vận hành cho khách vãng lai, và cũng
  //    không hiện "0" — xem ghi chú QUYỀN ĐỌC ở đầu app/home-metrics.ts.
  if (metrics.status !== 'ok') {
    return {
      label: 'Cần đăng nhập',
      tone: 'muted',
      line: 'Đăng nhập để xem số liệu',
      hasData: false,
    };
  }

  // ③ Đã đăng nhập. Có số thật thì phân hệ đang chạy; không có thì nói là
  //    chưa có, tuyệt đối không suy ra "ổn" và tuyệt đối không hiện 0.
  const badge = metrics.badges[mod.href];
  if (badge && badge !== DASH) {
    return { label: 'Đang vận hành', tone: 'operational', line: badge, hasData: true };
  }
  return {
    label: 'Sẵn sàng',
    tone: 'ready',
    line: 'Chưa có số liệu vận hành',
    hasData: false,
  };
}
