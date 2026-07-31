'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'VN' | 'EN' | 'CN';

/** Ba ngôn ngữ kèm quốc kỳ, dùng chung cho bộ chọn ở thanh đầu trang. */
export const LANGUAGES: ReadonlyArray<{ code: Language; flag: string; label: string; title: string }> = [
  { code: 'VN', flag: '🇻🇳', label: 'VN', title: 'Tiếng Việt' },
  { code: 'EN', flag: '🇬🇧', label: 'EN', title: 'English' },
  { code: 'CN', flag: '🇨🇳', label: 'CN', title: '中文' },
];

const dictionary = {
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

type DictionaryKey = keyof typeof dictionary.VN;

interface LanguageContextType {
  lang: Language;
  /** Chọn thẳng một ngôn ngữ — dùng cho bộ ba nút VN / EN / CN */
  setLang: (next: Language) => void;
  /** Xoay vòng VN → EN → CN → VN. Giữ lại cho mã cũ đang gọi. */
  toggleLang: () => void;
  t: (key: DictionaryKey) => string;
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

  const t = useCallback((key: DictionaryKey) => dictionary[lang][key], [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};