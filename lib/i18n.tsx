'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'VN' | 'EN';

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
  }
};

type DictionaryKey = keyof typeof dictionary.VN;

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: DictionaryKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('VN');

  const toggleLang = () => setLang((prev) => (prev === 'VN' ? 'EN' : 'VN'));
  const t = (key: DictionaryKey) => dictionary[lang][key];

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};