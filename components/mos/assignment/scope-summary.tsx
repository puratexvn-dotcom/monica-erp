'use client';

import { Building2, Layers, Package, Scissors } from 'lucide-react';

import { useLanguage, type DictionaryKey } from '@/lib/i18n';
import type { AssignmentSummaryDTO } from '@/lib/mos/contracts/assignment.contract';

// ============================================================================
// TÓM TẮT PHẠM VI
//
// ⚠️ ĐỌC `scopeLevel`, KHÔNG SUY TỪ CỘT TRỐNG.
//
// Cách sai mà rất dễ viết:
//     {a.lineName ? `Chuyền ${a.lineName}` : 'Tất cả các chuyền'}
//
// Câu đó nói **sai sự thật**. Cột trống nghĩa là *"phạm vi này không tới cấp
// chuyền"*, chứ KHÔNG phải *"mọi chuyền"*. Ràng buộc `assignments_scope_shape`
// của 029 tồn tại chính để chặn cách hiểu đó ở tầng dữ liệu — giao diện không
// được mở lại cánh cửa ấy bằng một toán tử ba ngôi.
//
// Phạm vi rộng được TUYÊN BỐ bằng `scopeLevel = 'ORDER'`, và ở đây nó hiện ra
// đúng bằng chữ *"Cả đơn hàng"*.
// ============================================================================

export function ScopeSummary({ a }: { a: AssignmentSummaryDTO }) {
  const { t } = useLanguage();

  // Từ rộng tới hẹp — cùng thứ tự với `SCOPE_FIELDS` của Domain, nên đọc dòng
  // này là thấy ngay phạm vi thu hẹp dần tới đâu.
  const parts: Array<{ icon: typeof Package; text: string }> = [
    { icon: Package, text: t(`asg_scope_${a.scopeLevel}` as DictionaryKey) },
  ];
  if (a.siteName) parts.push({ icon: Building2, text: a.siteName });
  if (a.lineName) parts.push({ icon: Layers, text: a.lineName });
  if (a.operationName) parts.push({ icon: Scissors, text: a.operationName });

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {parts.map((p, i) => (
        <span key={p.text} className="flex min-w-0 items-center gap-1 text-sm text-slate-600">
          {i > 0 && <span className="text-slate-300">·</span>}
          <p.icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="min-w-0 truncate">{p.text}</span>
        </span>
      ))}
    </div>
  );
}
