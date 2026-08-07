// ============================================================================
// KHUNG TRANG CHỦ WORKSPACE — BA CỘT · DÙNG CHUNG CHO MỌI PHÂN HỆ
//
// Board Directive 07/08/2026 *(MD Home V2)* + [ADR-026](../../docs/adr/ADR-026-workspace-design-dna.md).
// Chuẩn đầy đủ: [`docs/WORKSPACE_DESIGN_DNA.md`](../../docs/WORKSPACE_DESIGN_DNA.md).
//
//   ┌───────────────────────────────────────┐
//   │ ACTION CENTER            (full ngang) │
//   ├──────────────┬────────────────┬───────┤
//   │ MY WORK      │  WORK CENTER   │ RISK  │
//   │   3/12       │      6/12      │ 3/12  │
//   └──────────────┴────────────────┴───────┘
//   │ DASHBOARD                (full ngang) │
//
// ─── 🔑 VÌ SAO PHẢI LÀ MỘT COMPONENT, ⛔ KHÔNG PHẢI MỘT TRANG TÀI LIỆU ──
// ADR-026 nói *"mọi Workspace kế thừa DNA"*. Nếu DNA chỉ nằm trong tài liệu
// thì mỗi phân hệ tự gõ lại `grid-cols-12 order-1 order-2 …`, và **lần chép
// thứ ba là lần đầu tiên nó lệch**. Đó chính là cơ chế đã đẻ ra tình trạng
// *"1/13 Workspace có Command Center"* mà ADR-026 §1.2 đo được.
//
// ⇒ DNA nay là **MÃ**. Đổi bố cục ⇒ sửa **một tệp**, cả 13 Workspace theo.
//
// ⚠️ ĐIỆN THOẠI: một cột, thứ tự **KHÁC máy bàn** —
//     `Action → Risk → My Work → Work Center → Dashboard`
// 🔑 Máy bàn thấy cả ba cột **cùng lúc** nên vị trí ⛔ không quyết định thứ tự
// đọc; điện thoại thì thứ tự **là tất cả**, và cái đang cháy phải lên đầu.
// Làm bằng `order-*`, ⛔ **KHÔNG nhân đôi JSX** — hai bản JSX cho hai khổ máy
// là hai chỗ để quên sửa.
//
// ⚠️ Component này **⛔ không biết gì về nghiệp vụ**. Nó nhận `ReactNode` và
// xếp chỗ. Nhét logic vào đây là biến khung chung thành khung của MD.
// ============================================================================

// 🔴 THÊM 07/08/2026 — Board *MD V5* §9 · §13.
//
// ─── 🔑 VÌ SAO CẦN CÁCH CHIA THỨ BA ─────────────────────────────────────
// Đo trên ảnh chụp bản 4/4/4: cột **Rủi ro** cao gần **gấp đôi** cột *Việc cần
// làm hôm nay*, để lại một mảng trắng ~340px ở đáy cột trái. Nguyên nhân ⛔
// không phải *"quá nhiều rủi ro"* — vẫn đúng 5 mục — mà là **cột quá hẹp**:
// mỗi tiêu đề rủi ro xuống 2–3 dòng.
//
// 🔑 Nới cột rủi ro làm chữ **bớt xuống dòng** ⇒ cột thấp xuống ⇒ hàng lưới
// thấp xuống ⇒ mảng trắng biến mất **và** trang ngắn lại. Một phép chỉnh trả
// hai kết quả, ⛔ không phải cắt bớt nội dung nào.
//
// ⚠️ Chuỗi lớp NGUYÊN VẸN, ⛔ không ghép `lg:col-span-${n}` — Tailwind quét mã
// theo **văn bản**, lớp ghép động bị cắt mất lúc dựng và ba cột đổ chồng lên
// nhau. Đây đúng cái bẫy §5 của quy trình nghiệm thu.
const CHIA = {
  '3-6-3': ['lg:col-span-3', 'lg:col-span-6', 'lg:col-span-3'],
  '4-4-4': ['lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4'],
  '3-4-5': ['lg:col-span-3', 'lg:col-span-4', 'lg:col-span-5'],
} as const;

export default function WorkspaceHomeGrid({
  actionCenter, myWork, workCenter, risk, dashboard, deu = false, chia,
}: {
  /** Dải thao tác nhanh — full ngang, trên cùng. Bỏ trống nếu phân hệ chưa có. */
  actionCenter?: React.ReactNode;
  /** Cột TRÁI — chỉ số cá nhân · tiêu điểm hôm nay · hộp thư việc · nhật ký. */
  myWork: React.ReactNode;
  /** Cột GIỮA — dòng chảy nghiệp vụ + bảng dữ liệu chính. */
  workCenter: React.ReactNode;
  /** Cột PHẢI — CẦN XỬ LÝ NGAY. */
  risk: React.ReactNode;
  /** DƯỚI ba cột — báo cáo, biểu đồ tổng. */
  dashboard?: React.ReactNode;
  /** `true` ⇒ chia **4/4/4** thay vì 3/6/3.
   *
   *  🔑 3/6/3 đúng khi cột giữa chứa **bảng**. Khi cả ba cột đều là khối
   *  **đọc nhanh** *(V4: Today · KPI · Risk)* thì cột giữa ⛔ không cần rộng
   *  gấp đôi — và để nó gấp đôi sẽ làm hai cột bên bị bóp ⛔ không cần thiết. */
  deu?: boolean;
  /** Chỉ định thẳng cách chia — **thắng** `deu`. Xem bảng `CHIA` ở trên. */
  chia?: keyof typeof CHIA;
}) {
  const [cTrai, cGiua, cPhai] = CHIA[chia ?? (deu ? '4-4-4' : '3-6-3')];
  return (
    <>
      {actionCenter}

      {/* ⚠️ `items-start` — mỗi cột cao đúng nội dung của nó, ⛔ không bị kéo
          giãn bằng cột cao nhất. ⛔ Không có nó, khối ngắn nhận một nền trắng
          thừa và đọc thành *"⛔ còn nội dung nhưng chưa nạp"*. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/* ⚠️ Cột giữa GẤP ĐÔI hai cột bên: nó chứa bảng dữ liệu. Chia đều thì
            bảng bị bóp còn nửa chiều ngang và phải **cuộn ngang**. */}
        <section aria-label="Công việc của tôi" className={`order-2 space-y-4 lg:order-1 ${cTrai}`}>
          {myWork}
        </section>

        <section aria-label="Khu làm việc chính" className={`order-3 space-y-4 lg:order-2 ${cGiua}`}>
          {workCenter}
        </section>

        {/* 🔴 `order-1` trên điện thoại — LÊN ĐẦU, trước cả My Work. */}
        <section aria-label="Cần xử lý ngay" className={`order-1 lg:order-3 ${cPhai}`}>
          {risk}
        </section>
      </div>

      {dashboard && <div className="mt-4">{dashboard}</div>}
    </>
  );
}
