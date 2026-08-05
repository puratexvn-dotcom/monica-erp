# MONICA ONE — PRODUCT PRINCIPLES

| Trường | Giá trị |
|---|---|
| **Phiên bản** | **v1.0** — 28 nguyên tắc |
| **Dẫn xuất từ** | [`MONICA_ONE_PRODUCT_CONSTITUTION.md`](MONICA_ONE_PRODUCT_CONSTITUTION.md) |
| **Vai trò** | **Danh sách đối chiếu** — mỗi tính năng mới soi qua đây trước khi thiết kế |
| **Trạng thái** | ⏳ chờ Board khoá cùng Product Constitution |

> **Cách dùng:** trước khi viết dòng mã đầu tiên của một tính năng, đọc 28 dòng
> dưới đây và trả lời: *"tính năng này vi phạm điều nào ⛔ không?"*
> Vi phạm **một** điều ⇒ **dừng**, ⛔ không phải *"cân nhắc lại"*.
>
> ⚠️ Nguyên tắc **⛔ không** thay Hiến pháp và **⛔ không** thay ADR. Nó bắt
> **những thứ hai văn bản kia ⛔ không bắt được**: một tính năng có thể **đúng
> kiến trúc hoàn toàn** mà vẫn **sai sản phẩm**.

---

## I · LỐI VÀO *(P1–P5)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P1** | **Homepage LUÔN là Application Launcher.** ⛔ Không Dashboard · ⛔ không KPI · ⛔ không biểu đồ · ⛔ không số vận hành | thêm "một widget nhỏ" lên trang chủ |
| **P2** | **Launcher hiện ĐẦY ĐỦ Module với mọi người xem** — kể cả khách | ẩn Module theo quyền *"cho gọn"* |
| **P3** | **Quyền kiểm lúc MỞ, ⛔ không kiểm bằng cách vắng mặt** | một Module biến mất khỏi lưới |
| **P4** | **Luồng là `Homepage → Module → Login → Workspace`.** ⛔ Không bắt đăng nhập trước khi thấy sản phẩm | trang chủ chuyển hướng sang `/login` |
| **P5** | **Homepage là công cụ BÁN HÀNG.** Mọi thay đổi phải trả lời được: *khách · nhà đầu tư · ứng viên nhìn vào thấy gì?* | tối ưu chỉ cho người đã đăng nhập |

## II · NƠI LÀM VIỆC *(P6–P10)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P6** | **Workspace trả lời DUY NHẤT: *"hôm nay tôi cần làm gì?"*** | mở Workspace ra thấy trước tiên là biểu đồ |
| **P7** | 🔑 **VIỆC đứng TRƯỚC SỐ.** KPI ⛔ không bao giờ là khối đầu tiên | *"cho KPI lên trên cho đẹp"* |
| **P8** | **Work Item là PHÉP CHIẾU.** ⛔ Không nút *"đã xong"*, ⛔ không bảng việc | thêm cột `is_done` |
| **P9** | **Work Zone HỢP NHẤT việc của MỘT NGƯỜI qua MỌI Module** | bắt người dùng mở từng Module để tìm việc |
| **P10** | **Workspace ⛔ KHÔNG sở hữu dữ liệu** — nó chiếu trạng thái Domain | lưu số liệu tổng hợp vào bảng riêng |

## III · ĐIỀU HƯỚNG *(P11–P13)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P11** | **Bottom Navigation ĐÚNG 5 mục. ⛔ Không tăng, ⛔ không đổi vị trí** | thêm mục thứ sáu *"chỉ lần này thôi"* |
| **P12** | **Từ mọi màn hình phải về được Homepage** | Workspace ⛔ không có lối ra |
| **P13** | **Vị trí một Module trong lưới là TRÍ NHỚ CƠ BẮP** — sắp lại phải qua ADR | *"sắp lại cho hợp lý hơn"* |

## IV · NGÔN NGỮ SẢN PHẨM *(P14–P17)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P14** | **Người lao động phổ thông phải hiểu ngay.** ⛔ Không thuật ngữ kỹ thuật trên màn hình | nhãn `BOM`, `Aggregate`, `Sync` |
| **P15** | **Mỗi Module có Icon · Tên · Tagline · Business Value** — thiếu một là ⛔ chưa xong | thêm Module mà ⛔ không có câu giá trị |
| **P16** | **Tagline cho người VẬN HÀNH; Business Value cho người MUA.** Hai câu, hai khán giả, hai chỗ | dùng một câu cho cả hai |
| **P17** | **Màu là ĐỊNH DANH, ⛔ không phải trang trí.** Đổi màu Module = xoá thứ người dùng đã học | đổi màu *"cho hợp tông"* |

## V · BÁO CÁO VÀ NHẬP LIỆU *(P18–P21)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P18** | **⛔ KHÔNG nhập liệu trùng lặp.** Dữ liệu đã có ở đâu thì lấy từ đó | thêm màn hình nhập lại thứ hệ thống đã biết |
| **P19** | **AI chuẩn bị trước — người xác nhận sau** | bắt người dùng gõ từ trang giấy trắng |
| **P20** | 🔴 **Người XÁC NHẬN là người CHỊU TRÁCH NHIỆM, ⛔ không phải AI** | AI tự ghi dữ liệu nghiệp vụ |
| **P21** | **Báo cáo là MỘT cú bấm — ⛔ không Excel, ⛔ không Zalo** | *"xuất file rồi tự gửi"* |

## VI · TRAO ĐỔI *(P22–P24)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P22** | **Mọi hội thoại GẮN với một thực thể nghiệp vụ** | phòng chat tự do ⛔ không gắn đơn hàng |
| **P23** | **Chat thay thế Email · Zalo · WeChat** — ⛔ không cộng thêm vào chúng | tính năng chỉ dùng được nếu vẫn mở Zalo |
| **P24** | **Xoá là SOFT DELETE. Quản trị luôn khôi phục được. Audit ⛔ không mất** | `DELETE` thật trên tin nhắn |

## VII · AI *(P25–P27)*

| # | Nguyên tắc | Vi phạm trông như thế nào |
|---|---|---|
| **P25** | 🔴 **AI ⛔ KHÔNG BAO GIỜ thấy nhiều hơn người mà nó phục vụ** | AI trả lời câu hỏi mà người dùng ⛔ không có quyền hỏi |
| **P26** | **AI ưu tiên tri thức NỘI BỘ trước Internet** | trả lời bằng kiến thức chung khi công ty đã có SOP |
| **P27** | **AI Memory phục vụ NGƯỜI DÙNG, ⛔ không phục vụ người quản lý họ** | cấp trên đọc được bộ nhớ AI của cấp dưới |

## VIII · TRIẾT LÝ *(P28)*

| # | Nguyên tắc |
|---|---|
| **P28** | 🔑 **Phần mềm giúp người làm ĐÚNG, ⛔ không dùng để KIỂM SOÁT người.** Mọi người thấy **việc · tiến độ · trách nhiệm · trạng thái** mà **⛔ không cần hỏi ai** |

---

# §2 · BỐN NGUYÊN TẮC ĐANG BỊ ĐE DOẠ NGAY LÚC NÀY

⚠️ Ghi ở đây vì chúng ⛔ **không** phải rủi ro tương lai — chúng đang mở:

| Nguyên tắc | Bị đe doạ bởi | Gỡ bằng |
|---|---|---|
| **P25** | 🔴 **AI Network §12** — AI QA đẩy thông tin sang AI Merchandising vượt qua ranh giới `MODULE_ACCESS` | `ADR-027` |
| **P27** | 🔴 **AI Memory §10** — hồ sơ hành vi nhân viên, ⛔ chưa ai quyết ai đọc được | Board quyết `G-9` |
| **P11** | 🔴 `ADR-021` đề nghị **thêm** mục thứ **sáu**; Product Constitution nói **đúng năm** | `ADR-021` sửa |
| **P14** | 🔴 §45.3 cấm dịch tên Module ⇒ công nhân đọc `Subcontract` | `ADR-028` |

---

# §3 · MỘT ĐIỀU NGUYÊN TẮC NÀY **⛔ KHÔNG** LÀM ĐƯỢC

⚠️ 28 dòng trên **⛔ không thay thế phép đo.**

*"Có đúng Product Constitution ⛔ không?"* là câu hỏi **thứ hai**. Câu **thứ
nhất** vẫn là *"⛔ có đo được ⛔ không?"* — `P-MEASURE`, bài kiểm, CI, bằng
chứng.

🔑 **Một tính năng đúng cả 28 nguyên tắc mà ⛔ không ai đo được thì vẫn ⛔ chưa
xong.** Ngược lại, một tính năng đo được đầy đủ mà vi phạm `P25` thì **⛔ không
được ra đời** — dù mọi bài kiểm đều xanh.

---

> **Trạng thái:** ⏳ chờ Board khoá. Đối chiếu hiện trạng:
> [`PRODUCT_CONSTITUTION_GAP_ANALYSIS.md`](PRODUCT_CONSTITUTION_GAP_ANALYSIS.md).
