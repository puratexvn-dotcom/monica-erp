# EDD-04B · TU CHÍNH B
## CONFIGURATION GOVERNANCE · VERSIONING · AI BOUNDARY
### Ba tầng cấu hình · Mở rộng chặn cứng SoD · Gắn phiên bản · Ranh giới AI

| Trường | Giá trị |
|---|---|
| **Mã** | EDD-04B · Tu chính của [EDD-04](EDD-04-WORKFLOW-RULE-PERMISSION.md) |
| **Ngày** | 2026-08-04 |
| **Người soạn** | Chief Enterprise Architect |
| **Trình** | Joseph · Architecture Board |
| **Nguồn thẩm quyền** | `BDR-18` … `BDR-22` ✅ · **Board Additional Direction — Versioning & AI Boundary** |
| **Nhiệm vụ được giao** | 🔴 *"Nếu phát hiện thêm trường hợp nguy cơ gian lận nghiêm trọng, anh chủ động bổ sung vào danh sách bắt buộc chặn và ghi rõ trong Decision Log"* — §2 |
| **Ràng buộc** | ⛔ Không mã · không migration · không refactor |

---

# §0 · QUYẾT ĐỊNH ĐÃ HẤP THỤ

| Quyết định | Nội dung | Thi hành ở |
|---|---|---|
| `BDR-18` ✅ | Một Identity · một Party Number · nhiều Tenant · Tenant Context | ✅ EDD-04A §1 |
| `BDR-19` ✅ | Monica chịu chi phí · đo đầy đủ Usage | ✅ EDD-04A §2 |
| `BDR-20` ✅ | 🔴 **Ba tầng cấu hình** — L1 Customer · L2 Partner · L3 Core | §1 |
| `BDR-21` ✅ | Hybrid · 3 chặn cứng · **giao tôi bổ sung** | §2 |
| `BDR-22` ✅ | AI Decision History là **lớp dữ liệu độc lập** · ⛔ không lưu dữ liệu mật | §5 |
| 🔴 **Additional** | Workflow/Rule phiên bản hoá · ⛔ không hồi tố · **mỗi Business Object biết mình dùng version nào** | §3 |
| 🔴 **Additional** | **AI ⛔ không được sửa Workflow/Rule** — chỉ phân tích · cảnh báo · **mô phỏng** · đề xuất | §4 |

> ### ⚠️ Ghi nhận một điều chỉnh Joseph làm tốt hơn đề xuất của tôi
>
> Tôi đề xuất `BDR-20` phương án C với **hai tầng** *(tham số ⟷ cấu trúc)*. **Joseph chèn thêm tầng `Partner Configuration` vào giữa.**
>
> Đây là cải tiến thật, ⛔ không phải bổ sung hình thức: **cấu hình chạm ranh giới đối tác ngoài có mức rủi ro khác hẳn cấu hình nội bộ.** Đặt sai một ngưỡng nội bộ ⇒ quy trình chạy sai, sửa được. Đặt sai một mức tiết lộ cho nhà thầu ⇒ **rò rỉ dữ liệu ⛔ không thu hồi được**. Hai thứ đó ⛔ không thể cùng một quy trình phê duyệt.

---
---

# §1 · BA TẦNG CẤU HÌNH — thi hành `BDR-20`

## 1.1 Định nghĩa ba tầng

```
╔═══════════════════════════════════════════════════════════════════════════╗
║ 🔴 L3 · MONICA ONE CORE ARCHITECTURE                                      ║
║    Chỉ Monica ONE sửa · qua ADR · phát hành theo phiên bản sản phẩm       ║
║    ⛔ TENANT KHÔNG SỬA ĐƯỢC BẰNG BẤT KỲ CÁCH NÀO                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ 🟠 L2 · PARTNER CONFIGURATION                                             ║
║    Chạm RANH GIỚI ĐỐI TÁC NGOÀI · tenant sửa được NHƯNG có quản trị chặt  ║
║    Hai chữ ký + bài kiểm phép chiếu + thông báo Monica ONE                ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ 🟢 L1 · CUSTOMER CONFIGURATION                                            ║
║    Tham số vận hành NỘI BỘ · quản trị viên tenant sửa · có test case      ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

⚠️ **Làm rõ thuật ngữ:** trong `BDR-20`, **"Customer" = doanh nghiệp thuê bao Monica ONE** *(tenant)*, ⛔ không phải khách hàng mua hàng của Monica Garment. **"Partner" = đối tác của tenant** *(nhà thầu · nhà cung cấp · khách hàng của tenant)*.

## 1.2 Cái gì thuộc tầng nào

### 🟢 L1 · CUSTOMER CONFIGURATION

| Nhóm | Cấu hình được |
|---|---|
| **Ngưỡng & tham số** | ngưỡng sẵn sàng NPL · ngưỡng biên LN cảnh báo · ngưỡng giá trị cần duyệt · SLA từng bước · số ngày cảnh báo trước hạn |
| **Mẫu vận hành** | mẫu lịch T&A · mẫu quy trình sản xuất `ProcessRoute` · chặng kiểm theo khách · mẫu chiết tính |
| **Định tuyến duyệt** | ai duyệt cái gì *(trong tập Role đã định nghĩa)* · uỷ quyền · leo thang |
| **Work Inbox** | luật sinh việc · công thức ưu tiên · ngưỡng leo thang |
| **Dữ liệu chủ tenant** | lịch nhà máy · ca · nghỉ lễ · mã lỗi bổ sung · lý do bổ sung · nhãn hiển thị |
| **Chỉ số** | ngưỡng KPI · mục tiêu · chu kỳ báo cáo |
| **Ngôn ngữ** | ngôn ngữ mặc định · `LanguagePolicy` theo khách hàng |

**Quản trị:** quản trị viên tenant · 🔴 **bắt buộc test case đạt** *(`WF-6` · `RL-2`)* · có ngày hiệu lực · ghi Audit Log.

### 🟠 L2 · PARTNER CONFIGURATION

| Nhóm | Cấu hình được | 🔴 Vì sao thuộc L2 |
|---|---|---|
| **Mức tiết lộ** | trường nào hiện cho khách · cho nhà thầu · cho NCC | Sai một trường ⇒ **rò rỉ ⛔ không thu hồi được** |
| **Che danh tính khách** | `HIDDEN \| PARTIAL \| DISCLOSED` *(`DL-063`)* | Lộ khách cuối ⇒ **nhà thầu tiếp cận trực tiếp ⇒ Monica bị loại khỏi chuỗi** |
| **KPI đối tác** | chỉ số nào nhà thầu thấy của chính họ | `BDR-12` · lộ thêm ⇒ mất vị thế đàm phán |
| **Năng lực cổng** | bật/tắt Line Map · Shipment · chat · đề nghị cho từng loại đối tác | Mở một năng lực = mở một bề mặt |
| **SLA đối tác** | hạn phản hồi đề nghị · hạn nộp báo cáo ngày | Ràng buộc hợp đồng |
| **Bằng chứng chia sẻ** | loại bằng chứng nào mở cho khách khi tranh chấp *(`BDR-09`)* | Mở nhầm ⇒ **tự tố cáo mình** |
| **Ngôn ngữ hồ sơ** | `language_of_record` theo hợp đồng *(`BDR-10`)* | Giá trị pháp lý |
| **Vị trí trong bằng chứng** | bật/tắt theo xưởng *(`BDR-24`)* | Rủi ro pháp lý lao động |

**🔴 Quản trị L2 — chặt hơn L1 bốn bậc:**

| # | Yêu cầu |
|---|---|
| 1 | 🔴 **Hai chữ ký** — người đề xuất ≠ người duyệt, và người duyệt phải có `PartnerBoundaryAuthority` |
| 2 | 🔴 **Bài kiểm phép chiếu chạy tự động** trước khi áp *(`DP-3`)* — thay đổi làm gãy bài kiểm ⇒ **⛔ không áp được** |
| 3 | 🔴 **Xem trước bằng con mắt đối tác** — bắt buộc, hiện đúng thứ nhà thầu/khách sẽ thấy |
| 4 | **Thông báo Monica ONE** — ⛔ không phải xin phép, mà để hỗ trợ khi có sự cố |
| 5 | **Có thể quay lui trong 24h** bằng một thao tác |

### 🔴 L3 · MONICA ONE CORE ARCHITECTURE

| Nhóm | ⛔ Tenant KHÔNG sửa được |
|---|---|
| **Máy trạng thái** | tập trạng thái · **phép chuyển hợp lệ** · trạng thái đầu cuối |
| **Cổng cứng** | guard của cổng 3 · cổng 4 |
| 🔴 **Phân tách nhiệm vụ** | **danh sách chặn cứng §2** |
| **Ranh giới bảo mật** | cơ chế phép chiếu tiết lộ · cô lập tenant · 6 chiều phạm vi · 5 loại dữ liệu |
| **Vị từ có tên** | thư viện vị từ trong Rule Engine |
| **Bất biến aggregate** | `Σ size = line qty` · `Σ allocation = order qty` · sổ chỉ-ghi-thêm |
| **Bản ghi bất biến** | Audit Log · Legal Conversation · AI Decision · cơ chế chuỗi băm |
| **Bốn nguyên mẫu workflow** | Lifecycle · Approval · Orchestration · Case |
| **Mô hình dữ liệu** | aggregate · quan hệ · sở hữu dữ liệu |

**Quản trị:** chỉ Monica ONE · **bắt buộc ADR** · phát hành theo phiên bản sản phẩm · thông báo mọi tenant trước khi áp.

## 1.3 Kiểm chứng nguyên tắc 100 doanh nghiệp

```
L3  ─── GIỐNG HỆT NHAU ở 100 doanh nghiệp  ⇒  MỘT bộ mã nguồn, ⛔ không nhánh riêng
L2  ─── khác nhau, là DỮ LIỆU              ⇒  ⛔ không đụng mã
L1  ─── khác nhau, là DỮ LIỆU              ⇒  ⛔ không đụng mã
```

> `DL-094` · **Ba tầng cấu hình là cơ chế duy nhất cho phép một bộ mã phục vụ 100 doanh nghiệp.**
> Ranh giới **bất biến ⟷ cấu hình được** đã chốt ở EDD-01 §1.3.1; `BDR-20` bổ sung **ai cầm chìa khoá từng phần**, và tầng L2 của Joseph tách đúng chỗ rủi ro cao nhất.

## 1.4 Cấu hình là đối tượng có phiên bản

```
ConfigurationChange   (bất biến, ghi vào Audit Log)
├─ tenant_id · level: L1 | L2 | L3 · config_key
├─ before_value · after_value · diff_summary
├─ proposed_by · approved_by      ← L2 bắt buộc hai người khác nhau
├─ test_result: PASSED | FAILED   ← ⛔ FAILED không áp được
├─ effective_from                  ← ngày hiệu lực, ⛔ không áp ngay lập tức
├─ reverted_at? · revert_reason?
└─ config_version                  ← số tăng đơn điệu theo tenant
```

**🔴 Phát hiện lệch chuẩn — nhu cầu vận hành với 100 tenant:**

```
ConfigurationDrift  (báo cáo cho Monica ONE, ⛔ không lộ nội dung nghiệp vụ)
  tenant · số cấu hình lệch mặc định · lệch ở đâu · từ khi nào
  ▶ Dùng để: hỗ trợ đúng trọng tâm · phát hiện tenant tự làm hỏng
  ▶ ⛔ KHÔNG dùng để: đọc dữ liệu nghiệp vụ của tenant
```

> `DL-095` · **Monica ONE thấy được tenant lệch chuẩn bao nhiêu, ⛔ không thấy dữ liệu nghiệp vụ của họ.**
> Không có nó thì với 100 tenant, mỗi cuộc gọi hỗ trợ bắt đầu bằng *"hệ thống của anh đang cấu hình thế nào?"* và ⛔ không ai trả lời được.

---
---

# §2 · MỞ RỘNG CHẶN CỨNG SoD — thi hành nhiệm vụ Joseph giao

## 2.1 🔴 Tiêu chí — thay cho một danh sách tuỳ hứng

Trước khi thêm, tôi đặt **tiêu chí** để danh sách này bảo vệ được và mở rộng được:

> ### 🔴 **Chặn cứng khi HÀNH VI và VIỆC CHE GIẤU xảy ra trong CÙNG MỘT giao dịch.**
>
> Nghĩa là: cùng một người vừa **tạo ra tổn thất** vừa **tạo ra vỏ bọc hợp lệ cho nó**.
> Khi đó **rà soát sau ⛔ không phát hiện được** — vì hồ sơ trông hoàn toàn đúng.
>
> Ngược lại, nếu hành vi để lại dấu vết mà người thứ ba **có thể** phát hiện khi rà soát, thì **cảnh báo + ghi nhật ký + rà soát định kỳ là đủ**.

Áp tiêu chí này vào ba quy tắc Board đã chốt — cả ba đều đạt:

| Board chốt | Hành vi | Vỏ bọc | Cùng giao dịch? |
|---|---|---|---|
| Người tạo tự duyệt | tạo chứng từ sai | chữ ký duyệt hợp lệ | ✅ |
| Người kiểm tự kết luận lô | bỏ qua lỗi | kết luận ĐẠT hợp lệ | ✅ |
| Người kho tự duyệt điều chỉnh tồn | lấy hàng ra | bút toán điều chỉnh hợp lệ | ✅ |

## 2.2 🔴 SÁU TRƯỜNG HỢP TÔI BỔ SUNG

### `SOD-H04` · Đề xuất **HUỶ/PHẾ LIỆU** ⟷ Duyệt huỷ/phế liệu

| | |
|---|---|
| **Vector gian lận** | 📚 **Kênh thất thoát vải kinh điển nhất ngành may.** Khai vải tốt là *"lỗi, phải huỷ"*, tự duyệt, rồi mang ra ngoài bán |
| **Vì sao hành vi và vỏ bọc cùng giao dịch** | Bút toán `SCRAP` **chính là** vỏ bọc. Sau khi duyệt, hồ sơ hoàn toàn hợp lệ và hàng đã **rời khỏi sổ sách** — ⛔ không còn gì để rà soát |
| **Giá trị rủi ro** | Vải chiếm **60–70% giá vốn đơn FOB**. Đây là tài sản dễ bán lại nhất trong nhà máy |
| **Chặn** | Người đề xuất ≠ người duyệt · 🔴 **và người duyệt ≠ người thực hiện tiêu huỷ vật lý** *(ba người, hoặc hai người + ảnh bằng chứng tiêu huỷ)* |

### `SOD-H05` · Sửa **TÀI KHOẢN NGÂN HÀNG** nhà cung cấp ⟷ Duyệt thanh toán

| | |
|---|---|
| **Vector gian lận** | 📚 **Loại gian lận bị khai thác nhiều nhất trên thế giới hiện nay.** Sửa số tài khoản NCC thành tài khoản của mình, rồi duyệt lệnh thanh toán |
| **Vì sao cùng giao dịch** | Hồ sơ **hoàn hảo**: có PO thật, có phiếu nhập thật, có hoá đơn thật. **Chỉ số tài khoản là sai.** Rà soát chứng từ ⛔ không phát hiện được — chỉ NCC gọi điện đòi nợ mới lộ, thường sau 30–60 ngày |
| **Chặn** | 🔴 **Người sửa thông tin ngân hàng ≠ người duyệt thanh toán** · **và** mọi thay đổi tài khoản ngân hàng gửi **thông báo tới liên hệ NCC đã đăng ký trước đó** |

### `SOD-H06` · Tạo **NHÀ CUNG CẤP MỚI** ⟷ Duyệt PO cho nhà cung cấp đó

| | |
|---|---|
| **Vector gian lận** | Tạo nhà cung cấp ma, phát PO, tự duyệt, nhận tiền |
| **Vì sao cùng giao dịch** | Toàn bộ chuỗi chứng từ do một người tạo ra ⇒ **nhất quán tuyệt đối** ⇒ rà soát ⛔ không thấy bất thường |
| **Chặn** | Người tạo `Party` mới ≠ người duyệt PO đầu tiên cho `Party` đó · ⚠️ **chỉ áp cho PO ĐẦU TIÊN** — các PO sau chỉ cảnh báo |

### `SOD-H07` · Ghi **SẢN LƯỢNG** ⟷ Duyệt **LƯƠNG SẢN PHẨM**

| | |
|---|---|
| **Vector gian lận** | Khai khống sản lượng chuyền mình ⇒ tăng lương sản phẩm của mình và tổ mình |
| **Vì sao cùng giao dịch** | Sản lượng **là** cơ sở tính lương. Người ghi số cũng là người hưởng lợi, và số liệu **tự nó là bằng chứng hợp lệ** |
| **Chặn** | Người ghi `StageThroughput` ≠ người duyệt `PieceRateEarning` |
| ⚠️ **Lưu ý** | Chỉ áp khi Domain `People` bật lương sản phẩm. Với tenant trả lương thời gian ⇒ ⛔ không áp |

### `SOD-H08` · Cấp phát **NPL cho nhà thầu** ⟷ Chấp nhận **ĐỐI SOÁT HAO HỤT**

| | |
|---|---|
| **Vector gian lận** | 📚 **Kênh thất thoát NPL trong gia công ngoài.** Cấp 1.000m, thực dùng 900m, khai 100m là *"hao hụt"*, tự chấp nhận đối soát |
| **Vì sao cùng giao dịch** | Biên bản đối soát hao hụt **chính là** vỏ bọc. Chấp nhận xong thì 100m biến mất khỏi sổ một cách hợp lệ |
| **Giá trị rủi ro** | Với Monica, gia công ngoài chiếm phần đáng kể sản lượng |
| **Chặn** | Người ký `SubconIssue` ≠ người chấp nhận `WastageReconciliation` |

### `SOD-H09` · Phụ trách **CÔNG NỢ PHẢI THU** ⟷ Duyệt **KHẤU TRỪ / XOÁ NỢ**

| | |
|---|---|
| **Vector gian lận** | Khách đã trả tiền nhưng ⛔ không nộp vào công ty; che bằng cách duyệt một khoản *"khấu trừ"* hoặc *"xoá nợ"* cho đúng số đó |
| **Vì sao cùng giao dịch** | Chứng từ khấu trừ **là** vỏ bọc. Sổ công nợ về 0 một cách hợp lệ, và ⛔ không ai đối chiếu lại với khách |
| **Chặn** | Người theo dõi công nợ của khách đó ≠ người duyệt `Deduction`/xoá nợ · 🔴 **và mọi khấu trừ > ngưỡng phải có xác nhận bằng văn bản từ khách** |

## 2.3 Danh sách chặn cứng đầy đủ — 9

| Mã | Chặn cứng | Nguồn |
|---|---|---|
| `SOD-H01` | Người **tạo/trình** chứng từ ⟷ người **duyệt** chứng từ đó | Board |
| `SOD-H02` | Người **kiểm** lô ⟷ người **kết luận** lô đó | Board |
| `SOD-H03` | Người **đề xuất** điều chỉnh tồn ⟷ người **duyệt** | Board |
| `SOD-H04` | Người **đề xuất huỷ/phế liệu** ⟷ người **duyệt** ⟷ người **tiêu huỷ** | 🆕 tôi |
| `SOD-H05` | Người **sửa TK ngân hàng NCC** ⟷ người **duyệt thanh toán** | 🆕 tôi |
| `SOD-H06` | Người **tạo NCC mới** ⟷ người **duyệt PO đầu tiên** | 🆕 tôi |
| `SOD-H07` | Người **ghi sản lượng** ⟷ người **duyệt lương sản phẩm** | 🆕 tôi |
| `SOD-H08` | Người **cấp NPL cho nhà thầu** ⟷ người **chấp nhận đối soát hao hụt** | 🆕 tôi |
| `SOD-H09` | Người **phụ trách công nợ** ⟷ người **duyệt khấu trừ/xoá nợ** | 🆕 tôi |

**Còn lại ở mức CẢNH BÁO** *(hành vi để lại dấu vết, rà soát phát hiện được)*:
`PriceApprover ⟷ ProcurementApprover` · `MaterialRequester ⟷ ProcurementApprover` · `ProcurementOfficer ⟷ GoodsReceiver` · người duyệt hạn mức tín dụng ⟷ người xác nhận đơn.

⚠️ **`SOD-06`** *(GĐSX duyệt cả giá bán lẫn giá mua)* **giữ ở mức cảnh báo** theo `BDR-21` — vì cả hai hành vi đều để lại chứng từ so sánh được với lịch sử giá, nên **rà soát tháng phát hiện được**.

## 2.4 🔴 Người duyệt bù đắp — giữ cho chặn cứng ⛔ không giết doanh nghiệp nhỏ

`BDR-21` chọn Hybrid **chính là để doanh nghiệp nhỏ dùng được sản phẩm**. Chín chặn cứng có thể phá điều đó — xưởng 150 công nhân ⛔ không có 9 cặp vai trò tách bạch.

```
🔴 CHẶN CỨNG YÊU CẦU "MỘT NGƯỜI THỨ HAI", ⛔ KHÔNG YÊU CẦU "MỘT CHỨC DANH CỤ THỂ"

CompensatingApprover
├─ tenant_id · sod_rule_code
├─ designated_person   ← BẤT KỲ ai đủ tư cách: chủ doanh nghiệp · kế toán trưởng · CEO
├─ 🔴 phải KHÁC người thực hiện hành vi
├─ justification       ← BẮT BUỘC ghi vì sao ⛔ không tách được theo chuẩn
└─ review_frequency    ← rà soát định kỳ việc chỉ định này
```

| Quy mô | Cách thoả 9 chặn cứng |
|---|---|
| **Xưởng 150 CN** | Chủ xưởng là `CompensatingApprover` cho cả 9 · quản đốc thực hiện | ✅ dùng được |
| **Monica hôm nay** | CEO hoặc Kế toán trưởng đồng ký các hành vi thuộc `SOD-H04·05·06·09` | ✅ dùng được |
| **Tập đoàn 3.000 CN** | Có đủ chức danh tách bạch | ✅ |

> `DL-096` · **Chặn cứng đòi MỘT NGƯỜI THỨ HAI, ⛔ không đòi MỘT CHỨC DANH.**
> Đây là điều giữ cho `BDR-21` đúng với ý định của Board: **kiểm soát nghiêm ở chỗ ⛔ không rà soát được, nhưng ⛔ không loại bỏ phân khúc doanh nghiệp nhỏ.**
>
> 🔴 **Cái ⛔ không nhượng bộ được:** phải là **hai người thật, hai tài khoản thật**. ⛔ Không có cơ chế nào cho phép một người ký hai lần.

---
---

# §3 · GẮN PHIÊN BẢN — thi hành Additional Direction

> Joseph: *"Mỗi Business Object phải biết mình đang sử dụng Workflow Version và Rule Version nào."*

## 3.1 Hai cơ chế, ⛔ không phải một

Chỉ gắn phiên bản workflow là **chưa đủ** để thoả *"⛔ không thay đổi hồi tố"*. Ngưỡng và tham số cũng đổi hành vi.

```
① GẮN KẾT (Binding) — đặt lúc KHỞI TẠO, ổn định suốt đời thể hiện
   Mọi aggregate mang:
   ├─ workflow_binding  { code, version, bound_at }
   ├─ ruleset_binding   { code, version, bound_at }
   └─ config_version    ← số phiên bản cấu hình tenant lúc khởi tạo

② BẢN GHI ĐÁNH GIÁ (Evaluation Record) — ghi tại MỖI ĐIỂM QUYẾT ĐỊNH
   Mỗi lần một guard/rule chạy:
   ├─ rule_code · rule_version
   ├─ 🔴 parameter_values  ← GIÁ TRỊ THỰC lúc đó (ngưỡng 90%, SLA 24h…)
   ├─ input_refs · outcome · explanation
   └─ evaluated_at · evaluated_for_transition
```

> `DL-097` · **Gắn kết cho VÒNG ĐỜI; bản ghi đánh giá cho TỪNG QUYẾT ĐỊNH.**
>
> Vì sao cần cả hai: gắn kết trả lời *"đơn này chạy luật nào"*. Bản ghi đánh giá trả lời *"vì sao ngày 12/07 nó qua được cổng 3 mà hôm nay thì ⛔ không"* — **câu hỏi thật sự có giá trị khi tranh chấp hoặc khi truy nguyên sự cố**.
>
> Chỉ chụp toàn bộ cấu hình mỗi lần thì quá nặng; chỉ gắn phiên bản workflow thì ⛔ không tái hiện được quyết định. Hai cơ chế này rẻ và đủ.

## 3.2 Hiển thị — Joseph yêu cầu *"phải BIẾT mình đang dùng version nào"*

```
╔═══════════════════════════════════════════════════════════════╗
║ PO-2588 · Zara · 18.400 pcs                    ⚙️ Cấu hình ▾  ║
╠═══════════════════════════════════════════════════════════════╣
║ ⚙️ Quy trình:  ORDER_LIFECYCLE  v3   (gắn 04/08 09:12)        ║
║    Bộ quy tắc: ORDER_RULES       v7   (gắn 04/08 09:12)        ║
║    Cấu hình:   tenant config     #142                          ║
║                                                                ║
║    ⚠️ Có bản mới: v4 · v8 — 🔴 KHÔNG áp cho đơn này            ║
║    [ Xem khác biệt ]  [ Lịch sử quyết định ]                   ║
╚═══════════════════════════════════════════════════════════════╝
```

**"Lịch sử quyết định"** hiện đủ chuỗi:
```
04/08 09:12  DRAFT → CONFIRMED
             R-ORD-GATE1 v7 · ĐẠT
             tham số lúc đó: ngưỡng NPL 90% · thực tế 94%
             người quyết: anh Dũng (GĐSX)
```

## 3.3 Luật phiên bản

| # | Luật |
|---|---|
| `VER-1` | 🔴 **Thể hiện gắn chặt phiên bản lúc khởi tạo**, ⛔ không đổi giữa chừng *(`DL-068`)* |
| `VER-2` | 🔴 **Mọi quyết định ghi lại phiên bản + GIÁ TRỊ THAM SỐ thực tế** |
| `VER-3` | **Phiên bản cũ ⛔ không xoá** khi còn thể hiện đang chạy — chuyển `DEPRECATED` |
| `VER-4` | 🔴 **Ngoại lệ duy nhất được áp hồi tố: vá lỗi BẢO MẬT** — có ghi vết, có thông báo |
| `VER-5` | **Màn hình đối tượng hiện được phiên bản đang chi phối nó** — chỉ thị Joseph |
| `VER-6` | **Chuyển tenant lên bản Monica ONE mới ⛔ không tự động đổi phiên bản của thể hiện đang chạy** |

---
---

# §4 · RANH GIỚI AI — thi hành Additional Direction

> Joseph: *"AI ⛔ không được tự thay đổi Workflow hoặc Rule. AI chỉ được: phân tích · cảnh báo · **mô phỏng** · đề xuất."*

## 4.1 Bốn việc AI được làm — và một việc ⛔ tuyệt đối không

```
✅ PHÂN TÍCH   "Cổng 3 bị vượt 14 lần trong 3 tháng, 11 lần do thiếu nhãn dệt"
✅ CẢNH BÁO    "Đơn PO-2601 có 78% khả năng trễ cổng 3 dựa trên 23 đơn tương tự"
✅ MÔ PHỎNG    "Nếu ngưỡng NPL là 85%: 14 đơn qua cổng sớm hơn TB 2,3 ngày;
                2 đơn sẽ thiếu vải giữa chừng"          ← §4.2
✅ ĐỀ XUẤT     "Đề nghị hạ ngưỡng xuống 85% cho nhóm mã hàng đơn giản"

⛔ TUYỆT ĐỐI KHÔNG: tự áp dụng bất kỳ thay đổi nào
```

## 4.2 🔴 Mô phỏng — năng lực Joseph vừa mở ra, và nó có giá trị lớn

```
WorkflowSimulation / RuleSimulation
├─ base_version · proposed_change  ← BẢN NHÁP, ⛔ KHÔNG bao giờ ACTIVE
├─ replay_dataset  ← dữ liệu LỊCH SỬ thật, ⛔ không phải dữ liệu bịa
├─ 🔴 chạy trong SANDBOX — ⛔ không chạm dữ liệu thật, ⛔ không phát sự kiện
├─ Kết quả: số đơn ảnh hưởng · thay đổi thời gian · rủi ro phát sinh
├─ 🔴 confidence + giả định đã dùng
└─ ⛔ ⛔ ⛔ KHÔNG CÓ ĐƯỜNG NÀO TỪ SIMULATION SANG ACTIVE
      Con người phải tự tạo ConfigurationChange và ký
```

> `DL-098` · **Mô phỏng chạy trên dữ liệu LỊCH SỬ THẬT trong sandbox, và ⛔ KHÔNG có đường nối tự động sang áp dụng.**
> Đây là chỗ AI tạo giá trị lớn nhất mà rủi ro gần bằng 0: nó trả lời *"nếu đổi thì sao"* bằng **bằng chứng từ chính dữ liệu của doanh nghiệp**, thay vì để con người đoán.

## 4.3 🔴 Cưỡng chế bằng QUYỀN, ⛔ không bằng lời nhắc

> **⛔ KHÔNG BAO GIỜ ràng buộc AI bằng chỉ dẫn trong prompt.** Chỉ dẫn ⛔ không phải cơ chế kiểm soát an ninh — nó bị vượt qua bởi đầu vào khéo léo, bởi mô hình đổi hành vi, bởi một lần cập nhật prompt cẩu thả.

```
🔴 Danh tính AI (`ai_agent`) có NĂNG LỰC BẰNG KHÔNG trên:
   WorkflowDefinition · BusinessRule · ApprovalPolicy · SoDRule
   DisclosureClass · ConfigurationChange · RoleAssignment · DataCategoryPolicy

⇒ Kể cả khi AI "quyết định" muốn sửa, tầng quyền TỪ CHỐI.
⇒ Kiểm bằng: quét quyền của `ai_agent` — 0 quyền ghi trên 8 bảng trên.
```

| # | Luật AI *(hợp nhất, cưỡng chế)* |
|---|---|
| `AI-1` | AI đọc qua **cùng lớp phân quyền với người đang hỏi** · ⛔ không đường tắt `service_role` |
| `AI-2` | Mọi phát biểu **trỏ được về bản ghi gốc** · ⛔ không nguồn = ⛔ không hiện |
| `AI-3` | AI ⛔ **không ghi vào bảng nghiệp vụ** — điền biểu mẫu, **người bấm lưu** |
| `AI-4` | Kết quả AI **kế thừa mức tiết lộ cao nhất** trong ngữ cảnh |
| `AI-5` | 🔴 AI có **0 quyền** trên Workflow · Rule · Permission · Configuration |
| `AI-6` | 🔴 **Quyết định cuối luôn thuộc con người** theo `Permission` và `ApprovalAuthority` đã định nghĩa |

---
---

# §5 · LỚP DỮ LIỆU AI — thi hành `BDR-22`

Board chốt: **lớp độc lập · ⛔ không lưu dữ liệu mật · lưu Reference · Hash · Recommendation · Decision · Decision Maker.**

```
AIDecisionRecord   🔴 LỚP DỮ LIỆU ĐỘC LẬP · bất biến · chuỗi băm
├─ record_id · tenant_id · occurred_at
├─ acting_on_behalf_of_user     ← AI đọc bằng quyền của AI (AI-1)
├─ purpose: DESCRIBE | DIAGNOSE | PREDICT | SIMULATE | RECOMMEND
│
├─ 🔴 REFERENCE  ── ⛔ KHÔNG BAO GIỜ CHỨA NỘI DUNG
│     [{ object_type, object_id, as_of, disclosure_class }]
├─ 🔴 HASH
│     prompt_hash · context_snapshot_hash · model_version
│
├─ 🔴 RECOMMENDATION
│     summary · confidence · reasoning_summary · assumptions[]
│
├─ 🔴 DECISION
│     ACCEPTED | REJECTED | MODIFIED | IGNORED · modification_note
│     resulting_action_id      ← hành động nghiệp vụ THẬT
│
├─ 🔴 DECISION_MAKER
│     person_id · role · authority_basis · decided_at
│
└─ prev_entry_hash · entry_hash

⛔ TUYỆT ĐỐI KHÔNG CÓ: nội dung prompt đầy đủ · bản sao dữ liệu · con số từ Costing
```

| Thuộc tính | Giá trị |
|---|---|
| **Loại dữ liệu** *(`BDR-13`)* | `AI_GENERATED` — lớp độc lập |
| **Quyền truy cập** | 🔴 **CEO + Kiểm toán viên nội bộ** — ⛔ không phải mọi người dùng |
| **Lưu trữ** | như `LEGAL_RECORD` |
| **Kiểm toán** | bất biến, chuỗi băm, neo ra ngoài *(`DL-073`)* |
| **Sao lưu** | đầy đủ, ⛔ không xoá được |

> `DL-099` · **`BDR-22` đã giải quyết mâu thuẫn tôi nêu ở `BDR-22`.** Vì bản ghi chỉ chứa **tham chiếu + băm**, nó ⛔ **không chứa** con số mật ⇒ tách thành lớp độc lập với quyền hẹp là **an toàn và đủ**.
> Rủi ro còn lại là **suy luận từ siêu dữ liệu** *(biết AI đọc chiết tính nào lúc nào)* — kiểm soát bằng cách thu hẹp người đọc, ⛔ không phải bằng cách phân mảnh nhật ký.

---

# §6 · DECISION LOG — 6 quyết định mới

| Mã | Quyết định | Căn cứ | Rút lại |
|---|---|---|---|
| `DL-094` | **Ba tầng cấu hình L1·L2·L3** — L3 giống hệt ở 100 doanh nghiệp | Cơ chế duy nhất cho một bộ mã phục vụ 100 doanh nghiệp | 🔴 rất khó |
| `DL-095` | **Phát hiện lệch chuẩn** — Monica ONE thấy tenant lệch bao nhiêu, ⛔ không thấy dữ liệu nghiệp vụ | Với 100 tenant, ⛔ không có nó thì ⛔ không hỗ trợ được | ✅ |
| `DL-096` | 🔴 **Chặn cứng đòi MỘT NGƯỜI THỨ HAI, ⛔ không đòi MỘT CHỨC DANH** — `CompensatingApprover` | Giữ `BDR-21` đúng ý định: nghiêm ở chỗ ⛔ không rà soát được, ⛔ không loại bỏ doanh nghiệp nhỏ | ⚠️ |
| `DL-097` | **Gắn kết cho VÒNG ĐỜI · bản ghi đánh giá cho TỪNG QUYẾT ĐỊNH** | Trả lời được *"vì sao 12/07 qua cổng mà hôm nay ⛔ không"* | ⚠️ |
| `DL-098` | **Mô phỏng chạy trên dữ liệu lịch sử thật, sandbox, ⛔ KHÔNG có đường nối sang áp dụng** | Giá trị lớn, rủi ro gần 0 | ✅ |
| `DL-099` | **AI có 0 quyền trên Workflow·Rule·Permission·Config — cưỡng chế bằng QUYỀN, ⛔ không bằng prompt** | 🔴 **Chỉ dẫn trong prompt ⛔ không phải cơ chế kiểm soát an ninh** | 🔴 rất khó |

### 🆕 Sáu quy tắc chặn cứng bổ sung — ghi vào Decision Log theo yêu cầu Joseph

| Mã | Chặn cứng | Vector gian lận |
|---|---|---|
| `SOD-H04` | đề xuất huỷ/phế liệu ⟷ duyệt ⟷ tiêu huỷ | 📚 kênh thất thoát vải kinh điển nhất ngành may |
| `SOD-H05` | sửa TK ngân hàng NCC ⟷ duyệt thanh toán | 📚 loại gian lận bị khai thác nhiều nhất thế giới hiện nay |
| `SOD-H06` | tạo NCC mới ⟷ duyệt PO đầu tiên | nhà cung cấp ma |
| `SOD-H07` | ghi sản lượng ⟷ duyệt lương sản phẩm | khai khống sản lượng để tăng lương mình |
| `SOD-H08` | cấp NPL cho nhà thầu ⟷ chấp nhận đối soát hao hụt | 📚 kênh thất thoát NPL trong gia công ngoài |
| `SOD-H09` | phụ trách công nợ ⟷ duyệt khấu trừ/xoá nợ | che giấu tiền đã thu bằng chứng từ khấu trừ |

**Tiêu chí áp dụng:** chặn cứng khi **hành vi và việc che giấu xảy ra trong cùng một giao dịch** ⇒ rà soát sau ⛔ không phát hiện được.

**Cộng dồn EDD-01 → 04B: 99 quyết định.**

---

# §7 · CẦN BOARD BIẾT VÀ QUYẾT

## 7.1 ⚠️ Board cần BIẾT — tác động vận hành của 6 chặn cứng mới

⛔ **Đây ⛔ không phải câu hỏi** — Joseph đã giao tôi quyết. Nhưng có hệ quả với Monica **ngay hôm nay**:

| Chặn cứng | Hôm nay tại Monica | Cần chỉ định |
|---|---|---|
| `SOD-H04` huỷ/phế liệu | Kho trưởng đề xuất và duyệt | 🔴 **Cần người thứ hai** — đề nghị **Kế toán trưởng** đồng ký |
| `SOD-H05` TK ngân hàng NCC | ⚠️ Chưa rõ ai sửa | 🔴 **Cần tách** — đề nghị **CEO** duyệt thay đổi TK |
| `SOD-H06` NCC mới | MD/GĐSX tạo và duyệt | 🔴 **Cần người thứ hai cho PO ĐẦU TIÊN** |
| `SOD-H07` lương sản phẩm | Chưa bật Domain People | ⏳ chưa ảnh hưởng |
| `SOD-H08` đối soát hao hụt | Kho cấp, điều phối viên đối soát | ✅ **đã tách tự nhiên** |
| `SOD-H09` khấu trừ | Kế toán đề xuất, Kế toán trưởng duyệt | ✅ **đã tách tự nhiên** |

> **Ba mục cần chỉ định người thứ hai.** Với `CompensatingApprover` *(`DL-096`)*, chỉ cần **một người bất kỳ đủ tư cách** — ⛔ không cần tuyển thêm nhân sự. Đề nghị Joseph hoặc Kế toán trưởng nhận vai này cho `SOD-H04·05·06`.

## 7.2 BOARD DECISION REQUIRED — 1

---

### `BDR-25` · TRÁCH NHIỆM KHI TENANT CẤU HÌNH SAI TẦNG L2

**Vấn đề.** Tầng L2 *(Partner Configuration)* do tenant sửa, và nó chạm **ranh giới dữ liệu ra ngoài doanh nghiệp**. Nếu một tenant bật nhầm một trường cho nhà thầu và làm lộ danh tính khách hàng của họ — **trách nhiệm thuộc về ai?** Đây là quyết định **mô hình thương mại và pháp lý**, ⛔ không phải kỹ thuật.

| | **A · Tenant tự chịu** *(công cụ trung lập)* | **B · Monica ONE duyệt trước mọi thay đổi L2** | **C · Tenant tự chịu + Monica ONE dựng RÀO CHẶN** |
|---|---|---|---|
| Cách làm | Tenant sửa tự do trong L2; điều khoản dịch vụ ghi rõ trách nhiệm thuộc tenant | Mọi thay đổi L2 chờ Monica ONE duyệt | Tenant sửa, nhưng: **bài kiểm phép chiếu chặn**, **xem trước bằng mắt đối tác bắt buộc**, **quay lui 24h**, **cảnh báo với thay đổi rủi ro cao** |
| Ưu | Đơn giản · mở rộng được cho 100 tenant · Monica ONE ⛔ không thành cổ chai | Kiểm soát tối đa | ✅ Cân bằng: tenant tự chủ, hệ thống chặn phần lớn sai sót |
| Nhược | 🔴 **Một tenant làm lộ dữ liệu ⇒ tiếng xấu cho Monica ONE ở 99 tenant còn lại** | 🔴 **Cổ chai chết người** — mỗi tenant chờ vài ngày cho một thay đổi cấu hình | Vẫn có phần rủi ro còn lại |
| Với Monica | ⛔ Không ảnh hưởng — một tenant | ⛔ Không ảnh hưởng | ⛔ Không ảnh hưởng |
| Với 100 tenant | 🔴 Rủi ro danh tiếng **⛔ không tuyến tính** | 🔴 ⛔ Không vận hành nổi | ✅ |

> **Khuyến nghị: PHƯƠNG ÁN C**, với bốn rào chặn đã thiết kế ở §1.2 và một bổ sung:
>
> 🔴 **Danh sách thay đổi L2 "rủi ro cao" ⛔ KHÔNG tự áp được, phải qua Monica ONE:**
> ① chuyển `CustomerIdentityDisclosure` từ `HIDDEN` sang `DISCLOSED` · ② mở trường thuộc lớp `RESTRICTED` cho bất kỳ cổng nào · ③ tắt bài kiểm phép chiếu · ④ mở bằng chứng nội bộ cho khách ngoài luồng `DisputeCase`
>
> Bốn thay đổi này ⛔ **không thể quay lui được về mặt thực tế** — dữ liệu đã ra ngoài thì ⛔ không thu hồi. Mọi thay đổi L2 khác tenant tự áp được.
>
> ⚠️ **Chỗ tôi có thể sai:** ranh giới *"rủi ro cao"* do tôi vẽ, dựa trên tiêu chí **⛔ không thu hồi được**. Nếu Board thấy tiêu chí khác đúng hơn *(ví dụ: theo giá trị thiệt hại)*, danh sách sẽ khác.

**🔲 Board chọn: A · B · C-với-4-ngoại-lệ**

---

# §8 · TÓM TẮT

## 8.1 Đã bàn giao

| § | Nội dung |
|---|---|
| **1** | Ba tầng cấu hình — định nghĩa · phân loại đầy đủ · quản trị từng tầng · kiểm chứng 100 doanh nghiệp · cấu hình có phiên bản · phát hiện lệch chuẩn |
| **2** | 🔴 **Tiêu chí chặn cứng** + **6 quy tắc bổ sung** *(tổng 9)* + **`CompensatingApprover`** |
| **3** | Gắn phiên bản — **hai cơ chế** · hiển thị · 6 luật |
| **4** | Ranh giới AI — 4 việc được làm · **mô phỏng sandbox** · 🔴 **cưỡng chế bằng quyền ⛔ không bằng prompt** · 6 luật AI |
| **5** | Lớp dữ liệu AI hoàn chỉnh theo `BDR-22` |

**Quyết định tự ra:** 6 + 6 quy tắc SoD *(cộng dồn 99)* · **Cần Board quyết:** 1 · **Cần Board biết:** 1

## 8.2 Ba điểm đáng nhớ nhất

| # | Điểm |
|---|---|
| **1** | 🔴 **Chặn cứng khi HÀNH VI và VIỆC CHE GIẤU xảy ra trong CÙNG MỘT giao dịch.** Đây là **tiêu chí**, ⛔ không phải danh sách — nó cho phép mở rộng có căn cứ. Sáu bổ sung đều đạt tiêu chí; hai trong số đó *(khai vải tốt thành phế liệu, khai thừa hao hụt gia công)* là **kênh thất thoát kinh điển của chính ngành may** |
| **2** | 🔴 **Chặn cứng đòi MỘT NGƯỜI THỨ HAI, ⛔ không đòi MỘT CHỨC DANH.** Nếu ⛔ không có `CompensatingApprover`, chín chặn cứng sẽ **phá hỏng chính ý định của `BDR-21`** — loại bỏ phân khúc doanh nghiệp nhỏ mà Board vừa cố giữ |
| **3** | 🔴 **⛔ KHÔNG BAO GIỜ ràng buộc AI bằng chỉ dẫn trong prompt.** Chỉ dẫn ⛔ không phải cơ chế an ninh — nó bị vượt bởi đầu vào khéo léo, bởi mô hình đổi hành vi, bởi một lần cập nhật prompt cẩu thả. Chỉ thị *"AI ⛔ không được sửa Workflow"* của Joseph phải thi hành bằng **danh tính `ai_agent` có 0 quyền ghi trên 8 bảng cấu hình** — kiểm được bằng một truy vấn |

## 8.3 Trạng thái

⛔ Không chạm mã · ⛔ không migration · ⛔ không refactor · **SECURITY FREEZE giữ nguyên**

**Tiếp theo:** EDD-05 — Phase 11 Workspace · Work Inbox · Dashboard · Executive Center · Phase 12 Module Architecture. **Sprint cuối trước hợp nhất.**

---

## THAM CHIẾU

- **Board Decision** `BDR-18`…`BDR-22` ✅ · **Board Additional Direction** — Versioning · AI Boundary
- [EDD-04](EDD-04-WORKFLOW-RULE-PERMISSION.md) — 4 nguyên mẫu workflow · 7 loại quy tắc · `DL-068` phiên bản · `DL-076` SoD
- [EDD-04A](EDD-04A-PARTNER-RUNTIME-MOBILE-FIRST.md) — danh tính đa thuê bao · đo đạc · Mobile First
- [EDD-03A](EDD-03A-PARTNER-PORTAL-ARCHITECTURE.md) — `DL-063` che danh tính khách · `DP-1`…`DP-4` phép chiếu
- [`00-CONSTITUTION.md`](../architecture/00-CONSTITUTION.md) Điều 8 · 12.5 · 31.7 · 40.5 *(phân tách nhiệm vụ)*
