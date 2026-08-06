// ============================================================================
// LAYOUT NHÁNH `/md` — CHỈ để đăng ký từ điển ngành
//
// ⛔ KHÔNG thêm giao diện vào đây. Khung Workspace, thanh trên, thanh dưới đều
// do layout `(dashboard)` lo. Tệp này tồn tại vì Next.js chỉ nạp một chunk khi
// route thuộc nhánh đó được mở — đó chính là cơ chế cắt 82 KB khỏi các
// Workspace ⛔ không dùng từ điển này.
// ============================================================================
import type { ReactNode } from 'react';

import DangKyTuDien from './dictionaries';

export default function MdLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DangKyTuDien />
      {children}
    </>
  );
}
