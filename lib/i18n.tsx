'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

import { WAREHOUSE_DICT } from '@/lib/dictionaries/warehouse';
import { MD_DICT } from '@/lib/dictionaries/md';

import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';
import zhMessages from '@/messages/zh.json';
import {
  LOCALE, formatDate, formatDateTime, formatTime,
  formatNumber, formatCurrency, formatPercent,
} from '@/lib/locale';

// ============================================================================
// QUỐC TẾ HOÁ — Hiến pháp Điều 45
//
// ═══ MỘT KHÁI NIỆM · MỘT BẢN DỊCH · MỘT KHOÁ · MỘT NGHĨA ═══════════════
// Nguồn dịch chính thức là ba tệp `messages/{vi,en,zh}.json`. Khoá phẳng theo
// dạng `nhóm.khoá` — ví dụ `login.signIn`.
//
// ⚠️ CẤM (Điều 45.5): chuỗi viết thẳng trong giao diện · dịch nội tuyến ·
// `if (lang === 'VN')` · dịch bằng `switch` · từ điển trùng lặp · từ điển
// riêng trong component.
//
// ═══ ⚠️ VÌ SAO VẪN GIỮ HAI TỪ ĐIỂN CŨ ══════════════════════════════════
// `MD_DICT` và `WAREHOUSE_DICT` (1.756 dòng) đang được **28 tệp** gọi tới. Xoá
// ngay là làm gãy 28 màn hình trong một lần sửa — trong khi Board vừa cấm làm
// lại giao diện theo từng trang.
//
// Nên chúng được TRỘN VÀO như một lớp tương thích, và được ghi nhận là nợ
// **TD-13**. Trộn theo thứ tự: khoá của `messages/*.json` đứng SAU nên nó
// **thắng** nếu trùng tên — nguồn hiến định luôn thắng nguồn cũ.
// ============================================================================

export type Language = 'VN' | 'EN' | 'CN';

/** Ba ngôn ngữ kèm quốc kỳ, dùng chung cho bộ chọn ở thanh đầu trang. */
export const LANGUAGES: ReadonlyArray<{ code: Language; flag: string; label: string; title: string }> = [
  { code: 'VN', flag: '🇻🇳', label: 'VN', title: 'Tiếng Việt' },
  { code: 'EN', flag: '🇬🇧', label: 'EN', title: 'English' },
  { code: 'CN', flag: '🇨🇳', label: 'CN', title: '中文' },
];

// Từ điển lõi. Từ điển của từng phân hệ nằm ở lib/dictionaries/* và được trộn
// vào ngay bên dưới — xem chú thích ở khối `dictionary`.
const core = {
  VN: {
    dashboard: 'Bảng Điều Khiển',
    finishing_packing: 'Tổ Hoàn Thành & Đóng Gói',
    thread_trimming: 'Cắt Chỉ',
    pressing: 'Ủi / Là',
    packing: 'Gấp Xếp & Đóng Gói',
    aql_inspection: 'Kiểm AQL Cuối',
    passed: 'Đạt',
    rework: 'Tái Chế',
    rejected: 'Phế Phẩm',
    add_new: 'Tạo Mới',
    buyer_master: 'Quản Lý Khách Hàng',
    operation_master: 'Quản Lý Công Đoạn',
    chat_hub: 'Trung Tâm Thảo Luận',
    red_flag: 'Cảnh Báo Khẩn',
    send: 'Gửi',
    po_context: 'Theo Lệnh (PO)',
    switch_lang: 'EN',
  },
  EN: {
    dashboard: 'Dashboard',
    finishing_packing: 'Finishing & Packing',
    thread_trimming: 'Thread Trimming',
    pressing: 'Pressing / Ironing',
    packing: 'Folding & Packing',
    aql_inspection: 'Final AQL Inspection',
    passed: 'Passed',
    rework: 'Rework',
    rejected: 'Rejected',
    add_new: 'Add New',
    buyer_master: 'Buyer Master',
    operation_master: 'Operation Master',
    chat_hub: 'Communication Hub',
    red_flag: 'Red Flag',
    send: 'Send',
    po_context: 'PO Context',
    switch_lang: 'VN',
  },
  CN: {
    dashboard: '控制台',
    finishing_packing: '整烫包装组',
    thread_trimming: '剪线',
    pressing: '熨烫',
    packing: '折叠与包装',
    aql_inspection: '最终 AQL 检验',
    passed: '合格',
    rework: '返工',
    rejected: '次品',
    add_new: '新建',
    buyer_master: '客户管理',
    operation_master: '工序管理',
    chat_hub: '沟通中心',
    red_flag: '紧急警报',
    send: '发送',
    po_context: '按订单 (PO)',
    switch_lang: 'VN',
  },
};

// Trộn từ điển lõi với từ điển từng phân hệ. Kiểu dữ liệu suy ra từ kết quả
// trộn nên `t()` vẫn báo lỗi lúc BIÊN DỊCH nếu gõ sai tên khoá — thêm phân hệ
// mới chỉ cần thêm một dòng ở cả ba ngôn ngữ, không phải sửa gì khác.
/**
 * Ép cây JSON lồng nhau thành khoá phẳng dạng `nhóm.khoá`.
 *
 * ⚠️ Bỏ qua nhánh `_meta`: nó là siêu dữ liệu của tệp dịch, không phải chuỗi
 * hiển thị. Lọt vào từ điển thì `t('_meta.locale')` sẽ thành một khoá hợp lệ —
 * một cửa hậu để lộ thông tin nội bộ ra giao diện.
 */
function phang(obj: Record<string, unknown>, tienTo = ''): Record<string, string> {
  const ra: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === '_meta') continue;
    const khoa = tienTo ? `${tienTo}.${k}` : k;
    if (typeof v === 'string') ra[khoa] = v;
    else if (v && typeof v === 'object') Object.assign(ra, phang(v as Record<string, unknown>, khoa));
  }
  return ra;
}

const MESSAGES: Record<Language, Record<string, string>> = {
  VN: phang(viMessages as Record<string, unknown>),
  EN: phang(enMessages as Record<string, unknown>),
  CN: phang(zhMessages as Record<string, unknown>),
};

// Khoá hiến định (messages/*.json) đứng SAU nên THẮNG khi trùng tên với từ
// điển cũ. Nguồn hiến định luôn thắng lớp tương thích.
const dictionary: Record<Language, Record<string, string>> = {
  VN: { ...core.VN, ...WAREHOUSE_DICT.VN, ...MD_DICT.VN, ...MESSAGES.VN },
  EN: { ...core.EN, ...WAREHOUSE_DICT.EN, ...MD_DICT.EN, ...MESSAGES.EN },
  CN: { ...core.CN, ...WAREHOUSE_DICT.CN, ...MD_DICT.CN, ...MESSAGES.CN },
};

/**
 * Ép cây kiểu của tệp JSON thành union khoá phẳng `'nhóm.khoá'`.
 *
 * ⚠️ Phải làm ở TẦNG KIỂU, không thể suy từ giá trị: hàm `phang()` lúc chạy
 * trả `Record<string, string>`, và `keyof Record<string, string>` chỉ là
 * `string` — tức mọi chuỗi đều hợp lệ và trình kiểm kiểu mất hết tác dụng.
 * TypeScript suy được kiểu CHÍNH XÁC từ tệp `.json`, nên khoá sai tên vẫn bị
 * bắt ngay lúc biên dịch.
 */
type PhangKhoa<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : PhangKhoa<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Khoá của nguồn hiến định `messages/*.json` — dùng cho mọi mã MỚI. */
export type MessageKey = PhangKhoa<Omit<typeof viMessages, '_meta'>>;

/** Khoá của lớp tương thích cũ — sẽ hết dần theo TD-13. */
type LegacyKey =
  | keyof typeof core.VN
  | keyof typeof WAREHOUSE_DICT.VN
  | keyof typeof MD_DICT.VN;

/**
 * Khoá hợp lệ = khoá hiến định ∪ khoá cũ.
 *
 * Hai lưới, hai loại sai sót: **gõ sai tên khoá** ⇒ lỗi biên dịch; **thiếu bản
 * dịch ở một ngôn ngữ** ⇒ hỏng bài kiểm kiến trúc mục ⑪.
 */
export type DictionaryKey = MessageKey | LegacyKey;

interface LanguageContextType {
  lang: Language;
  /** Mã locale BCP-47 tương ứng — `vi-VN` · `en-US` · `zh-CN` */
  locale: string;
  /** Chọn thẳng một ngôn ngữ — dùng cho bộ ba nút VN / EN / CN */
  setLang: (next: Language) => void;
  /** Xoay vòng VN → EN → CN → VN. Giữ lại cho mã cũ đang gọi. */
  toggleLang: () => void;
  /**
   * Tra chuỗi hiển thị.
   *
   * `vars` thay các ô `{tên}` trong chuỗi — ví dụ
   * `t('validation.minLength', { min: 8 })`. Nhờ đó câu vẫn giữ đúng TRẬT TỰ
   * TỪ của từng ngôn ngữ, thay vì bị ghép từ nhiều mảnh: tiếng Trung và tiếng
   * Việt không đặt số ở cùng vị trí như tiếng Anh, nên nối chuỗi bằng `+` là
   * cách chắc chắn sinh ra câu ngô nghê ở ít nhất một ngôn ngữ.
   */
  t: (key: DictionaryKey, vars?: Record<string, string | number>) => string;
  // ─── Định dạng theo ngôn ngữ (Điều 45.6) ────────────────────────────
  formatDate: (v: string | number | Date | null | undefined) => string;
  formatDateTime: (v: string | number | Date | null | undefined) => string;
  formatTime: (v: string | number | Date | null | undefined) => string;
  formatNumber: (v: number | null | undefined, opts?: Intl.NumberFormatOptions) => string;
  formatCurrency: (v: number | null | undefined, currency: string) => string;
  formatPercent: (v: number | null | undefined, digits?: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'monica.lang';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Luôn khởi tạo 'VN' ở cả máy chủ lẫn trình duyệt. Đọc localStorage ngay lúc
  // khởi tạo sẽ làm HTML máy chủ khác HTML trình duyệt và React ném lỗi lệch
  // hydrat hoá; vì vậy phải đọc ở useEffect, sau khi đã gắn vào DOM.
  const [lang, setLangState] = useState<Language>('VN');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'VN' || saved === 'EN' || saved === 'CN') setLangState(saved);
    } catch {
      // Trình duyệt chặn localStorage (chế độ riêng tư) — giữ mặc định tiếng Việt
    }
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Không lưu được thì lựa chọn chỉ sống trong phiên này, không phải lỗi chặn
    }
  }, []);

  // Giữ toggleLang cho mã cũ đang gọi nó; nay xoay vòng qua cả ba ngôn ngữ.
  const toggleLang = useCallback(() => {
    setLang(lang === 'VN' ? 'EN' : lang === 'EN' ? 'CN' : 'VN');
  }, [lang, setLang]);

  const t = useCallback(
    (key: DictionaryKey, vars?: Record<string, string | number>) => {
      // Thiếu khoá thì TRẢ VỀ CHÍNH KHOÁ, không trả chuỗi rỗng. Ô trống trên
      // màn hình trông như lỗi bố cục; `login.signIn` hiện ra thì người nhìn
      // biết ngay thiếu bản dịch nào và báo được cho đúng chỗ.
      const raw = dictionary[lang][key] ?? (key as string);
      if (!vars) return raw;
      return Object.entries(vars).reduce(
        (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
        raw,
      );
    },
    [lang],
  );

  const value = useMemo<LanguageContextType>(
    () => ({
      lang,
      locale: LOCALE[lang],
      setLang,
      toggleLang,
      t,
      formatDate: (v) => formatDate(v, lang),
      formatDateTime: (v) => formatDateTime(v, lang),
      formatTime: (v) => formatTime(v, lang),
      formatNumber: (v, opts) => formatNumber(v, lang, opts),
      formatCurrency: (v, currency) => formatCurrency(v, currency, lang),
      formatPercent: (v, digits) => formatPercent(v, lang, digits),
    }),
    [lang, setLang, toggleLang, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};