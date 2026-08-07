'use client';

// ============================================================================
// ⑦ KHỐI TASK CỦA MD — hộp thư việc + lối sửa khi nó rỗng
//
// ⚠️ Tách khỏi `md-client.tsx` vì **phép kiểm trần 900 dòng bắt được ngay** khi
// tôi thêm khối này vào đó *(901 dòng)*. Sửa bằng **CẤU TRÚC**, ⛔ không bằng
// cách nới trần — trần đó tồn tại để `md-client` ⛔ không phình thêm, và `TD-39`
// *(tách `md-client`)* vẫn đang chờ.
//
// 🔑 Và chỗ này **đúng hơn** chỗ cũ: hộp thư việc và khối *"vì sao nó rỗng"* là
// **hai mặt của một câu**, phải đổi cùng nhau. Để rời hai chỗ trong thân
// `md-client` thì lần sau ai sửa cái này sẽ quên cái kia.
// ============================================================================
import MosTaskInbox from '@/components/mos/command-center/mos-task-inbox';
import MdSinhLichTa from './md-sinh-lich-ta';
import type { MosTask, UrgencyWording } from '@/lib/mos/command-center.contract';

export default function MdTaskSection({
  tasks, loi, wording, emptyHint, chaySinhLich,
}: {
  tasks: MosTask[];
  loi: string | null;
  wording: UrgencyWording;
  emptyHint: string;
  chaySinhLich: () => Promise<{ ok: boolean; message?: string }>;
}) {
  return (
    <>
      {/* 🔴 Hộp thư rỗng **VÀ** ⛔ không phải vì lỗi đọc ⇒ nói thẳng lý do thật
          và đưa lối sửa. `V.1`: *"⛔ không có việc"* và *"⛔ chưa sinh được
          việc"* là hai chuyện khác nhau — và chỉ một trong hai là tin tốt. */}
      {tasks.length === 0 && !loi && <MdSinhLichTa chay={chaySinhLich} />}

      {/* ⚠️ Đứng SAU dữ liệu, đúng thứ tự Board §9 *(… → PO → Task → Report)*.
          Phần **khẩn** của nó đã được rút lên khối ⑤; đây là bản đầy đủ. */}
      <MosTaskInbox
        title="Hộp thư việc"
        tasks={tasks}
        error={loi}
        wording={wording}
        emptyTitle="Không có việc nào tới hạn"
        emptyHint={emptyHint}
      />
    </>
  );
}
