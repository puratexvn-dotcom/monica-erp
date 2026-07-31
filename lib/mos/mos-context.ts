// ============================================================================
// NGỮ CẢNH PHÂN HỆ — SUY TỪ ĐƯỜNG DẪN
//
// Một bảng tra duy nhất, dùng chung cho hai thứ đều cần biết "đang đứng ở phân
// hệ nào" nhưng nằm ở layout nên không nhận được prop từ trang con:
//   • Chat  — quyết định kênh hội thoại (cột `module` của bảng communications)
//   • Sách hướng dẫn — quyết định nạp tệp Markdown nào
//
// Tách riêng thay vì để mỗi bên tự tra: hai bảng tra rời nhau sẽ lệch dần, và
// lúc đó người dùng mở hướng dẫn của phân hệ này lại đang chat ở kênh phân hệ
// khác mà không có gì báo.
// ============================================================================

export interface MosModule {
  /** Khoá ghi vào cột `module` của bảng communications */
  key: string;
  /** Tên hiển thị trên đầu khung chat */
  label: string;
  /** Tên tệp hướng dẫn trong lib/manuals (không có đuôi .md) */
  guide: string;
}

/** Phân hệ mặc định khi đường dẫn chưa có mục riêng — vẫn chat và tra cứu được */
const FALLBACK: MosModule = { key: 'chung', label: 'Toàn nhà máy', guide: 'tong-quan' };

// Xếp theo đúng thứ tự khớp: đường dẫn dài hơn phải đứng trước để '/kho' không
// nuốt mất '/kho-thanh-pham' nếu sau này có.
const MODULES: readonly MosModule[] = [
  { key: 'md', label: 'Merchandiser', guide: 'md' },
  { key: 'kho', label: 'Kho nguyên phụ liệu', guide: 'kho' },
  { key: 'qa', label: 'Kiểm soát chất lượng', guide: 'tong-quan' },
  { key: 'orders', label: 'Đơn hàng', guide: 'tong-quan' },
  { key: 'ketoan', label: 'Kế toán', guide: 'tong-quan' },
  { key: 'giamdoc', label: 'Ban giám đốc', guide: 'tong-quan' },
  { key: 'subcon', label: 'Gia công ngoài', guide: 'tong-quan' },
  { key: 'xuathang', label: 'Xuất hàng', guide: 'tong-quan' },
  { key: 'hoanthanh', label: 'Hoàn thành', guide: 'tong-quan' },
  { key: 'cat', label: 'Tổ cắt', guide: 'tong-quan' },
  { key: 'may', label: 'Tổ may', guide: 'tong-quan' },
  { key: 'admin', label: 'Quản trị hệ thống', guide: 'tong-quan' },
] as const;

/** Đường dẫn -> khoá phân hệ. Khớp TRỌN đoạn, không khớp tiền tố lỏng lẻo. */
const PATH_TO_KEY: Readonly<Record<string, string>> = {
  '/md': 'md',
  '/kho': 'kho',
  '/qa': 'qa',
  '/orders': 'orders',
  '/ke-toan': 'ketoan',
  '/giam-doc': 'giamdoc',
  '/subcon': 'subcon',
  '/xuat-hang': 'xuathang',
  '/hoan-thanh': 'hoanthanh',
  '/to-truong-cat': 'cat',
  '/to-truong-may': 'may',
  '/to-truong-hoan-thanh': 'hoanthanh',
  '/admin': 'admin',
  '/buyer': 'md',
};

export function moduleOfPath(pathname: string): MosModule {
  for (const [prefix, key] of Object.entries(PATH_TO_KEY)) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      return MODULES.find((m) => m.key === key) ?? FALLBACK;
    }
  }
  return FALLBACK;
}
