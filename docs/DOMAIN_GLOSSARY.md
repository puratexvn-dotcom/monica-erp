# MONICA MOS — DOMAIN GLOSSARY

> **Từ vựng nghiệp vụ.** Định nghĩa **bản chất**, không mô tả cấu trúc bảng.
>
> Cấu trúc CSDL nằm ở `supabase/migrations/`; quy tắc kỹ thuật ở
> [ENGINEERING_PLAYBOOK.md](ENGINEERING_PLAYBOOK.md); lý do của từng quyết định
> ở [docs/adr/](adr/). Tài liệu này trả lời một câu hỏi khác hẳn:
> **"Từ này nghĩa là gì trong nhà máy?"**

## Vì sao cần một cuốn từ vựng

Cùng một từ, hai người hiểu hai nghĩa, và không ai phát hiện ra cho tới lúc dữ
liệu đã sai. Ba ví dụ có thật trong chính dự án này:

- **"Loại dịch vụ" ⟷ "Loại hợp đồng"** — `subcontractors.service_type` chứa
  `GIAT`, `IN_THEU`. Rất dễ tưởng đó là loại hợp đồng và đem seed vào
  `contract_types`. Hai khái niệm khác nhau: *làm việc gì* ⟷ *ăn tiền thế nào*.
- **"Báo cáo QA"** — `qa_audit_reports` nghe như biên bản giám định chính thức;
  đọc cột (`line_name`, `time_slot`, `inspected_qty`) mới thấy đó là **kiểm tra
  nội bộ theo giờ**. Hiểu nhầm dẫn tới gửi nhầm cho khách.
- **"Xong"** — đối tác *nói* xong (`COMPLETED`) khác Monica *xác nhận* xong
  (`CLOSED`). Gộp hai nghĩa là để người làm tự nghiệm thu chính mình.

⚠️ **Phạm vi bản đầu:** ba trụ cột dưới đây, theo chỉ thị Kiến trúc sư. Từ vựng
của Kho, Kế toán, Cắt, Hoàn thành **chưa đưa vào** — thêm khi phân hệ đó tới lượt.

---

# I. THỰC THỂ CỐT LÕI

## PO — Đơn hàng

> **Cam kết thương mại giữa Monica và khách hàng.**

Trả lời: *bán cái gì · cho ai · bao nhiêu · giao ngày nào · giá bao nhiêu.*

PO **không nói ai làm**. Một PO 10.000 áo có thể do chuyền nội bộ làm hết, chia
cho ba nhà thầu, hoặc vừa làm vừa thuê ngoài — PO không đổi trong cả ba trường
hợp. Đó là lý do PO **không** phải đơn vị điều phối sản xuất.

**Không nhầm với:**

| Nhầm | Khác ở chỗ |
|---|---|
| Assignment | PO là *bán gì cho ai*; Assignment là *ai làm phần nào* |
| Báo giá / Inquiry | chưa cam kết; PO là đã cam kết |

## ASSIGNMENT — Phần việc giao đối tác

> **Đơn vị điều phối và thực thi cốt lõi của MONICA MOS.**
> *(Hiến pháp Điều II)*

Trả lời: *ai làm · phần nào của đơn hàng · từ ngày nào tới ngày nào · ai chịu
trách nhiệm phía Monica.*

Assignment là **mẫu số của mọi thứ**: quyền truy cập, sản lượng, chất lượng,
thanh toán, chỉ số đối tác. Một dữ liệu vận hành không gắn được vào Assignment
nào là dữ liệu **không ai chịu trách nhiệm**.

**Ba điều làm nên bản chất:**

**① Nó là một THOẢ THUẬN HAI PHÍA, không phải một lệnh.**
Monica giao; đối tác **nhận hoặc từ chối**. Không có quyền từ chối thì đối tác
chỉ còn hai lựa chọn — nhận việc mình không làm nổi, hoặc im lặng. **Im lặng tệ
hơn**: phần việc treo vô thời hạn, và tới ngày bắt đầu mới vỡ lẽ không có ai làm.

**② Phạm vi được TUYÊN BỐ, không suy ra.**
"Cả đơn hàng" là một lựa chọn **có tên**, không phải hệ quả của việc bỏ trống ô
chọn chuyền. *Trống nghĩa là chưa khai, không phải là tất cả.*

**③ Nó có CỬA SỔ THỜI GIAN, và cửa sổ đó là quyền.**
Ngoài khoảng ngày đã thoả thuận, đối tác **không ghi được gì**. Cửa sổ dùng ngày
**kế hoạch** chứ không dùng ngày **thực tế** — lấy ngày thực tế thì đối tác tự
quyết khi nào quyền của mình hết, chỉ cần chưa điền ngày hoàn thành.

**Vòng đời:** soạn → giao → *(nhận | từ chối)* → chạy → *(tạm dừng)* → đối tác
báo xong → **Monica nghiệm thu**.

⚠️ **"Đối tác báo xong" ≠ "Monica nghiệm thu".** Người làm không tự nghiệm thu
chính mình.

## COMMERCIAL TERM — Điều khoản thương mại

> **Tiền của một Assignment: ăn theo cái gì, bao nhiêu, đồng nào.**

Có **hai lớp tách rời**, và tách rời là cả thiết kế:

| Lớp | Câu hỏi | Ví dụ |
|---|---|---|
| **Loại hợp đồng** | quan hệ thương mại kiểu gì | danh mục nghiệp vụ tự khai |
| **Cách tính** | một đồng ăn theo cái gì | mỗi sản phẩm · mỗi công đoạn · mỗi phút SAM · mỗi kg · khoán trọn gói |

Hai lớp **đổi với nhịp khác nhau**: cách tính hữu hạn và ổn định hàng chục năm;
loại hợp đồng nhà máy thêm bớt theo thực tế kinh doanh. Gộp làm một thì mỗi lần
ký một kiểu hợp đồng mới lại phải sửa phần mềm.

⚠️ **Đối tác ĐƯỢC xem đơn giá của chính mình.** Không phải nhân nhượng mà là
điều kiện để đối soát: người làm phải biết mình được trả bao nhiêu, nếu không
mọi tranh chấp thanh toán đều thành lời nói suông. Ranh giới nằm ở chữ **của
chính mình** — không thấy giá bán cho khách, không thấy giá thành nội bộ, không
thấy điều khoản của đối tác khác.

---

# II. ĐỐI TÁC

> Cả ba đều là **người ngoài nhà máy**. Điểm chung: quyền của họ đến từ **việc
> được giao**, không đến từ **chức danh**. Cùng một nhà thầu có thể thấy đơn hàng
> A và mù tịt về đơn hàng B — khác nhau ở chỗ có Assignment hay không.

## BUYER — Khách hàng

> **Chủ của đơn hàng. KHÔNG phải đối tác thực thi.**

Buyer duyệt mẫu, duyệt thay đổi, đọc tiến độ đơn hàng của **chính họ**.

⚠️ **Buyer không bao giờ có Assignment.** Đây là bất biến, không phải quy ước:
cho Buyer một Assignment là cấp cho họ quyền **ghi sản lượng** — tức là để khách
hàng tự khai nhà máy đã may được bao nhiêu. Cơ sở dữ liệu **từ chối** việc này,
không chỉ giao diện.

## SUBCON — Nhà thầu phụ

> **Năng lực sản xuất CHÍNH của Monica, không phải phương án dự phòng.**
> *(Hiến pháp Điều II)*

Nhận phần việc, tổ chức sản xuất, **báo cáo sản lượng hằng ngày**.

⚠️ **Subcon BẮT BUỘC phải GHI, không chỉ đọc.** Đây là chỗ dễ thiết kế sai nhất.
Một cổng đối tác chỉ-đọc nghĩa là ai đó bên Monica phải gõ hộ sản lượng của nhà
thầu — và lúc đó con số không còn là lời khai của người làm, mà là lời kể lại
của người thứ ba. Truy trách nhiệm sụp đổ ngay tại đó.

Điều Subcon **không bao giờ** được thấy: sổ sách tài chính · giá bán cho khách ·
giá thành nội bộ · nhà thầu khác · danh sách nhân sự · bảng lương · bảng điều
khiển Giám đốc · phân tích nội bộ.

## SUPPLIER — Nhà cung cấp

> **Cung cấp nguyên phụ liệu. Không tham gia sản xuất.**

Khác Subcon ở **thứ được giao**: Supplier giao **vật tư**, Subcon giao **công
sức**. Cùng cơ chế phân quyền theo Assignment, khác hẳn nội dung công việc.

*(Cổng riêng chưa dựng — hôm nay hệ thống có 0 Supplier.)*

---

# III. KHÁI NIỆM SẢN XUẤT

## BUNDLE — Bó bán thành phẩm

> **Đơn vị vật lý DI CHUYỂN trong xưởng.**

Sau khi cắt, các chi tiết cùng cỡ, cùng màu, cùng lớp vải được bó lại và gắn
phiếu. Từ đó bó là thứ **cầm được, đếm được, chuyền tay được** — nó đi từ tổ cắt
sang chuyền may, sang nhà thầu, rồi về kho.

**Vì sao bó quan trọng hơn vẻ ngoài của nó:** bó là **mắt xích truy xuất**. Một
lô hàng bị khách trả về, câu hỏi *"lỗi từ đâu"* chỉ trả lời được nếu lần ngược
được: thùng nào → bó nào → chuyền nào → ca nào → cây vải nào.

⚠️ **Một bó thuộc tối đa MỘT phần việc đang hiệu lực.** Hai nơi cùng nhận trách
nhiệm về một bó là không ai chịu trách nhiệm cả. Nhưng bó **được phép** chuyển
sang phần việc khác — tái phân công là chuyện hằng ngày, và lịch sử giao trước
đó vẫn còn nguyên.

## DEFECT — Lỗi chất lượng

> **Một khuyết tật CÓ TÊN, không phải một dòng ghi chú.**

Lỗi phải chọn từ **danh mục** (bỏ mũi · đứt chỉ · nhăn mũi may · loang màu…) và
gắn **vị trí trên sản phẩm** (cổ · nách · gấu · khoá kéo…).

**Vì sao không cho gõ tự do:** "chỉ thừa", "thừa chỉ", "chỉ dư" là ba cách viết
của một lỗi. Gõ tự do thì ba tháng sau không ai thống kê nổi lỗi nào hay xảy ra
nhất — mà **biết lỗi nào hay xảy ra nhất chính là toàn bộ mục đích** của việc
ghi lỗi.

**Không nhầm với:**

| Khái niệm | Nghĩa |
|---|---|
| **Defect** | *cái gì hỏng* |
| **Kiểm AQL** | *lô này đạt hay không đạt*, theo mẫu thống kê |
| **CAPA** | *đã làm gì để lỗi không lặp lại* |

⚠️ **CAPA không đóng khi làm xong hành động.** Nó đóng khi **lần kiểm sau chứng
minh lỗi đã hết**. Đóng sớm là ghi nhận một lời hứa như một kết quả.

## DAILY REPORT — Báo cáo sản lượng ngày

> **Lời khai của người LÀM về ngày hôm đó. Và là căn cứ THANH TOÁN.**

Vì là căn cứ thanh toán, nó chịu luật khắt khe nhất trong toàn hệ thống:

**① Chỉ ghi thêm. Không sửa. Không xoá.**
Sai thì **ghi một bản đính chính** trỏ về bản cũ. Bản cũ ở lại vĩnh viễn.

**② Bản đang hiệu lực là bản KHÔNG CÓ BẢN ĐÍNH CHÍNH NÀO TRỎ VỀ.**
⚠️ Quên luật này là **cộng đôi sản lượng dùng để trả tiền** — và không lỗi nào
nổ ra.

**③ Thiếu báo cáo là một SỰ VIỆC, không phải một khoảng trống.**
Ngày không có báo cáo được tính là **trễ**, và đối tác **không báo xong được**
khi còn ngày trễ. Không có luật này thì đối tác báo "xong" rồi biến mất, để lại
một chuỗi ngày không ai truy được.

⚠️ **"Chưa tới hạn" khác "đã trễ".** Gộp hai thứ thì bảng điều khiển đỏ rực mỗi
sáng, và người ta ngừng nhìn bảng cảnh báo — cảnh báo giả nguy hiểm hơn không có
cảnh báo.

---

# PHỤ LỤC · BA HẠNG DỮ LIỆU

Phân biệt ba hạng này quyết định **luật nào áp lên bảng nào**:

| Hạng | Ai định nghĩa | Đa ngôn ngữ | Xoá thế nào | Ví dụ |
|---|---|---|---|---|
| **System Enum** | lập trình viên, lúc build | từ điển frontend | không xoá được | trạng thái Assignment · cách tính giá |
| **User-Defined Master Data** | nghiệp vụ, qua giao diện | **lưu trong CSDL** *(ADR-005)* | `is_active` | danh mục lỗi · loại hợp đồng · địa điểm |
| **Chứng từ nghiệp vụ** | phát sinh từ vận hành | không có | **xoá mềm**, hoặc chứng từ điều chỉnh | PO · Assignment · điều khoản · báo cáo ngày |

⚠️ Hạng giữa là hạng **dễ bỏ sót nhất**, và bỏ sót nó chính là gốc của vi phạm
Điều IX đã ghi ở Mục B.1 của Hiến pháp: frontend **không thể** dịch một mã lỗi
mà người vận hành sẽ tạo ra ngày mai.

---

*Bản đầu · 01/08/2026 · phạm vi ba trụ cột theo chỉ thị Kiến trúc sư.*
*Mở rộng sang Kho · Kế toán · Cắt · Hoàn thành khi phân hệ đó tới lượt.*
