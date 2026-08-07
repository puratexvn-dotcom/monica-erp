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

export default function WorkspaceHomeGrid({
  actionCenter, myWork, workCenter, risk, dashboard, deu = false,
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
}) {
  return (
    <>
      {actionCenter}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ⚠️ Cột giữa GẤP ĐÔI hai cột bên: nó chứa bảng dữ liệu. Chia đều thì
            bảng bị bóp còn nửa chiều ngang và phải **cuộn ngang**. */}
        <section aria-label="Công việc của tôi" className={`order-2 space-y-5 lg:order-1 ${deu ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
          {myWork}
        </section>

        <section aria-label="Khu làm việc chính" className={`order-3 space-y-5 lg:order-2 ${deu ? 'lg:col-span-4' : 'lg:col-span-6'}`}>
          {workCenter}
        </section>

        {/* 🔴 `order-1` trên điện thoại — LÊN ĐẦU, trước cả My Work. */}
        <section aria-label="Cần xử lý ngay" className={`order-1 lg:order-3 ${deu ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
          {risk}
        </section>
      </div>

      {dashboard && <div className="mt-5">{dashboard}</div>}
    </>
  );
}
