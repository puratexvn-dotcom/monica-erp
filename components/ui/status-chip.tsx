import { STATUS, type StatusKey } from '@/lib/design/tokens';

// ============================================================================
// VIÊN TRẠNG THÁI — một kiểu duy nhất cho toàn hệ thống
//
// Thi hành **Điều 44.4**: mỗi trạng thái nghiệp vụ mang một sắc ngữ nghĩa
// riêng, và sắc đó phải GIỐNG NHAU ở mọi màn hình. Người điều hành học màu
// "Nguy cấp" đúng một lần, rồi nhận ra nó ở bảng, ở thẻ, ở biểu đồ, ở Kanban.
//
// ⚠️ VÌ SAO PHẢI LÀ MỘT COMPONENT DÙNG CHUNG, KHÔNG PHẢI MỘT QUY ƯỚC
// Quy ước ("nhớ dùng màu đỏ cho nguy cấp nhé") sống được khoảng ba tháng. Sau
// đó mỗi màn hình có một sắc đỏ hơi khác, một cỡ chữ hơi khác, và trạng thái
// thôi không còn quét được bằng mắt. Một component thì không trôi được.
//
// ⚠️ Nhãn mặc định lấy từ thẻ màu, nhưng CHO PHÉP ghi đè bằng `label`: nghiệp
// vụ may có chỗ gọi "Đang chờ duyệt", có chỗ gọi "Chờ QA" — cùng một trạng
// thái, khác cách gọi. Ép một nhãn cho mọi nơi sẽ làm sai từ vựng ngành.
// ============================================================================

export default function StatusChip({
  status,
  label,
  size = 'md',
}: {
  status: StatusKey;
  /** Ghi đè nhãn mặc định khi phân hệ có từ vựng riêng */
  label?: string;
  size?: 'sm' | 'md';
}) {
  const t = STATUS[status];
  const pad = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold ring-1 ring-inset ${pad} ${t.chip}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.dot}`} aria-hidden="true" />
      {label ?? t.label}
    </span>
  );
}
