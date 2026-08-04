# SPRINT 2 — KẾ HOẠCH
## MONICA ONE · sau khi Board duyệt Sprint 1

| Trường | Giá trị |
|---|---|
| **Ngày soạn** | 2026-08-04 |
| **Người soạn** | Chief Solution Architect |
| **Trạng thái** | ⏳ **Chờ Board duyệt Sprint 1** |
| **Điều kiện khởi động** | ① Board trả lời [BUSINESS CONFIRMATION #1](../business/BUSINESS_CONFIRMATION_1.md) · ② Board quyết `VR-001` · ③ Board quyết vòng khoá SECURITY FREEZE |

---

## 0. BA CỔNG KHỞI ĐỘNG — KHÔNG VƯỢT ĐƯỢC

Sprint 2 **không bắt đầu** khi chưa đủ ba thứ. Ghi ra để không ai bắt đầu sớm rồi
phải làm lại:

| Cổng | Nội dung | Vì sao là cổng cứng |
|---|---|---|
| **G-A** | Board trả lời ≥ 5 câu ưu tiên của Confirmation #1 | BKB `Status: DRAFT` ⇒ bậc 0′ **chưa có hiệu lực**. Thiết kế trên văn bản chưa hiệu lực là thiết kế trên cát |
| **G-B** | Kết quả truy vấn `VR-001` | Nếu 8 bảng thật sự hở, Sprint 2 **đổi mục tiêu** từ *xây MD* sang *bịt lỗ* |
| **G-C** | Board quyết phương án cắt vòng khoá SECURITY FREEZE (Audit §7) | Không cắt thì `031d`–`031g` không viết được, và **không migration nào chạy được trong Sprint 2** |

⚠️ **G-B có thể lật ngược toàn bộ kế hoạch dưới đây.** Đó là lý do nó là việc số 0.

---

## 1. MỤC TIÊU SPRINT 2

Một câu:

> **Khép khoảng cách giữa văn bản chuẩn tắc và sản phẩm, đủ để Sprint 3 xây
> Merchandising trên nền không còn mâu thuẫn.**

**Không** phải mục tiêu Sprint 2: xây tính năng mới · mở Domain mới · làm lại
giao diện.

---

## 2. BỐN LUỒNG SONG SONG

### 🔴 LUỒNG 1 — BẢO MẬT: bịt 8 bảng còn hở

**Ưu tiên cao nhất. Chạy trước, không chờ luồng khác.**

| # | Việc | Sản phẩm | Phụ thuộc |
|---|---|---|---|
| 1.1 | Đọc kết quả `VR-001`, đối chiếu Audit §4.2 | Bản ghi bằng chứng tầng CSDL thật | **G-B** |
| 1.2 | Soạn **ADR-013 · MD Table Scope Hardening** — thu hẹp 8 bảng | ADR chờ phản biện | 1.1 |
| 1.3 | Phản biện độc lập bắt buộc (ADR-011 §2.2) | Hồ sơ ở `docs/review/ADR-013-review.md` | 1.2 |
| 1.4 | Board phê duyệt ADR-013 | — | 1.3 |
| 1.5 | Viết `031d`…`031g` | Migration | 1.4 · **G-C** |
| 1.6 | **Mở rộng `tests/security/rls-external.test.mjs`** phủ `costings` · `style_bom` | Bài kiểm | 1.4 |
| 1.7 | Người vận hành chạy migration trên SQL Editor, chạy `A001` + `A002` | Snapshot | 1.5 |

> ⚠️ **1.6 phải viết TRƯỚC 1.5 chạy.** Bài kiểm viết sau khi vá xong chỉ chứng minh
> bản vá tồn tại, không chứng minh nó chặn đúng cái đáng chặn. Bài kiểm phải
> **hỏng trước, xanh sau** — nếu nó xanh ngay từ đầu thì nó không đo gì cả.
>
> ⚠️ **Quy tắc K-3:** mỗi kịch bản phải có ít nhất **một vai CHỜ THẤY > 0**. Bài
> kiểm toàn vai chờ-0 không phân biệt được *khoanh đúng* với *chặn hết*.
>
> ⚠️ **V.1:** 8 bảng đang **0 dòng**. Bài kiểm phải tự dựng dữ liệu dùng-một-lần
> rồi dọn trong `finally` — **không kết luận trên bảng rỗng**.

---

### 🟠 LUỒNG 2 — KIẾN TRÚC: ánh xạ Workspace theo Business Domain

Thi hành quyết định **D1 · D2** của Audit §6.

| # | Việc | Sản phẩm |
|---|---|---|
| 2.1 | Soạn **ADR-012 · Workspace Route Alignment** | ADR |
| 2.2 | Bảng ánh xạ đầy đủ: 14 route hiện tại → 11 Workspace hiến định | Phụ lục ADR-012 |
| 2.3 | Phản biện độc lập | `docs/review/ADR-012-review.md` |
| 2.4 | Board phê duyệt | — |
| 2.5 | Thi hành **giai đoạn 1**: gộp 4 route Production thành một Workspace, giữ **mọi** màn hình cũ làm lát cắt theo vai trò | Mã |
| 2.6 | Sửa `home-modules.ts`: `Commercial` không trỏ `/buyer` nữa | Mã |

> ⚠️ **Ràng buộc bất di bất dịch số 2** (`CLAUDE.md` §6): **không xoá logic hay
> file cũ**. `/to-truong-cat` · `/to-truong-may` · `/to-truong-hoan-thanh` ·
> `/hoan-thanh` **giữ nguyên tệp**, chỉ đổi đường dùng và gắn lại vào Workspace
> Production. Đây là **đổi đường đi**, không phải **xoá màn hình**.
>
> `[Chỗ tôi có thể sai]` `Commercial` chưa có đích đúng để trỏ tới — Workspace
> Commercial **chưa tồn tại**. Hai lựa chọn: ⓐ để `beta: true` như Planning và HR,
> ⓑ dựng khung Commercial trong Sprint 2. **Tôi đề nghị ⓐ** — dựng khung là mở
> Module mới, mà SECURITY FREEZE cấm; và nói dối bằng một thẻ bấm được dẫn tới
> `/unauthorized` tệ hơn nói thật bằng một nhãn Beta.

---

### 🟡 LUỒNG 3 — NGHIỆP VỤ: cập nhật ba tầng văn bản sau khi Board trả lời

**Không chờ.** Board trả lời tới đâu, cập nhật tới đó.

| # | Việc | Điều kiện |
|---|---|---|
| 3.1 | Cập nhật **BKB** theo từng câu trả lời; đổi nhãn `❓ Needs Clarification` → `✅ Verified`; điền cột **Business Owner** | mỗi câu |
| 3.2 | Đính chính BKB C.8 theo Audit §M4 — `BR-TNA-002` **chết một nửa**, không chết hẳn | ngay |
| 3.3 | Đổi BKB `Status: DRAFT` → `ADOPTED` khi đủ điều kiện | Board |
| 3.4 | Rà **Hiến pháp** tìm điều khoản mâu thuẫn câu trả lời mới → tu chính qua ADR nếu có | sau 3.1 |
| 3.5 | Quyết `FD-003` — Sample Management là Điều riêng của Hiến pháp, hay nằm trong Điều 20 | Board |
| 3.6 | Gộp ba chuỗi ADR về `docs/adr/` — **D5** | ngay |
| 3.7 | Sửa `CLAUDE.md` §6 "12 phân hệ" → "16 Business App" — **D6** | ngay |
| 3.8 | Dựng `docs/review/` — **D8** · TD-15 | ngay |

---

### 🟢 LUỒNG 4 — KỶ LUẬT: dựng lưới an toàn trước khi xây tiếp

| # | Việc | Trả nợ nào |
|---|---|---|
| 4.1 | Soạn **ADR-014 · State Transition Registry** — mọi máy trạng thái có bảng phép chuyển viết thành mã, theo khuôn `lib/mos/domain/assignment.ts:73-80` | **D4** |
| 4.2 | Dựng phép kiểm **"vốn từ trong mã ⟷ vốn từ trong CSDL"** | **TD-03** — mở từ ADR-008 |
| 4.3 | Bộ kiểm nghiệp vụ đầu tiên cho MD: công thức `garment-math` · chuyển trạng thái · phân quyền | **F3** của MD Audit |
| 4.4 | Sửa `po-twin.service.ts:132` nhận `late_milestones` thật | **D7** — sửa lỗi đã đo, **được phép trong freeze** |
| 4.5 | Tách `md-client.tsx` (886/900 dòng) trước khi nó chạm trần arch test | **F14** |

> 💡 **4.2 là hạng mục có đòn bẩy cao nhất toàn Sprint 2.** TD-03 là thứ đã để 8
> bộ từ vựng trạng thái sống sót qua 33 migration mà không ai thấy. Dựng phép kiểm
> một lần, nó bắt mọi lần lệch về sau — kể cả lệch do người khác gây ra.

---

## 3. THỨ TỰ THI HÀNH

```
G-B ─┬─► L1.1 ─► L1.2 ─► L1.3 ─► L1.4 ─► L1.6 ─► L1.5 ─► L1.7
     │                                    (kiểm)  (vá)   (đo lại)
G-C ─┘

G-A ────► L3.1 ─► L3.4 ─► L3.3
             │
             └──► (mở khoá Sprint 3)

song song, không phụ thuộc cổng nào:
         L3.2 · L3.6 · L3.7 · L3.8 · L4.2 · L4.4 · L4.5
         L2.1 ─► L2.3 ─► L2.4 ─► L2.5 ─► L2.6
```

**Bốn việc làm được ngay hôm nay, không chờ Board:** L3.2 · L3.6 · L3.7 · L3.8.
Tất cả đều là việc tài liệu, thuộc nhóm *"không bắt buộc phản biện"* theo
[ADR-011 §2.2](../adr/ADR-011-tham-quyen-kien-truc.md).

---

## 4. ĐỊNH NGHĨA HOÀN TẤT CỦA SPRINT 2

Theo [ADR-011 §2.5](../adr/ADR-011-tham-quyen-kien-truc.md) — `npm run verify`
xanh **không phải** tiêu chí hoàn tất.

| # | Tiêu chí | Đo bằng |
|---|---|---|
| 1 | 8 bảng MD có policy thu hẹp, **xác minh trên CSDL đang chạy** | `pg_policies` + `A001` + `A002` |
| 2 | Bài kiểm phân quyền đối tác ngoài phủ `costings` · `style_bom`, và **đã từng hỏng trước khi vá** | log bài kiểm |
| 3 | BKB `Status: ADOPTED`, ≥ 50/60 quy tắc có Business Owner | BKB §G.5 |
| 4 | Không còn Business Workspace nào trỏ tới route của chức danh | `home-modules.ts` + `rbac.ts` |
| 5 | Một kho ADR duy nhất, không số hiệu trùng | `ls docs/adr` |
| 6 | Phép kiểm vốn từ trạng thái chạy trong `test:arch` | `npm run test:arch` |
| 7 | **Đăng nhập thật bằng tài khoản seed**, đi hết luồng, không lọt `undefined`/`NaN` ra HTML | người vận hành — [nghi thức nghiệm thu](../UI_UX_STANDARDS.md) §8 |

⚠️ **Tiêu chí 1 và 7 kiến trúc sư KHÔNG tự xác nhận được** — ADR-011 §2.4 mục 3.
Chúng cần người có trình duyệt và mật khẩu.

---

## 5. NGOÀI PHẠM VI SPRINT 2 — GHI RÕ ĐỂ KHÔNG TRÔI

| Hạng mục | Vì sao chưa làm | Sớm nhất |
|---|---|---|
| Xây Workspace **Commercial** · **Planning** · **HR** | Mở Module mới ⇒ SECURITY FREEZE cấm | Sprint 3+, sau khi dỡ băng |
| Xây `invoices` · `payments` | Chờ **A1** | Sprint 3 |
| Xây `contracts` | Chờ **B8** | Sprint 3 |
| Phân biệt QA nội bộ ⟷ QA khách | Chờ **D15** | Sprint 3 |
| **Line Map** | Chờ **F20(a)** — chưa ai định nghĩa được | chưa xác định |
| Mô hình năng lực sản xuất | Chờ **E17** | Sprint 3 |
| Trả nợ màu (108 tệp) · nợ chữ (113 tệp) · i18n (TD-13) | Board đã chỉ thị **dừng làm lại giao diện theo từng trang** cho tới khi Design System xong (Hiến pháp v1.3 ⑤) | sau nền móng Design System |
| Bán sỉ · bán lẻ online | `FD-001` — Board xếp nghiệp vụ **phụ** | chưa xác định |

---

## 6. RỦI RO CỦA CHÍNH KẾ HOẠCH NÀY

`[ADR-011 §2.3 mục 4 — chỗ tôi có thể sai]`

| # | Rủi ro | Nếu xảy ra |
|---|---|---|
| R1 | **`VR-001` trả về kết quả xấu** — 8 bảng thật sự hở trên CSDL thật | Luồng 1 nuốt trọn Sprint 2; Luồng 2 và 4 hoãn |
| R2 | **Board không cắt được vòng khoá freeze (G-C)** | Không migration nào chạy được; Sprint 2 rút về **chỉ tài liệu + bài kiểm** |
| R3 | **`031d`–`031g` thật ra có câu mở quyền**, không chỉ siết | Khuyến nghị A ở Audit §7 sai ⇒ phải quay về phương án B |
| R4 | **Board trả lời A1 là "Monica phát hành hoá đơn"** | Sprint 3 phình lên cả một Domain Finance — cần Sprint riêng |
| R5 | **Luồng 2 đụng nhiều tệp hơn dự tính** — 4 route Production có thể chia sẻ state qua đường tôi chưa đọc hết | Chia L2.5 thành nhiều lượt, mỗi lượt một route, nghiệm thu từng lượt |
| R6 | **Phản biện độc lập không sẵn sàng** | ADR-012 · 013 · 014 đều bị chặn. Board cần định **thời hạn phản biện tối đa** — ADR-011 §4.2 ghi *"chưa quyết"* |

> **R6 là rủi ro về quy trình, không phải kỹ thuật, và nó chặn ba ADR cùng lúc.**
> Đề nghị Board quyết thời hạn phản biện ngay trong lượt duyệt Sprint 1.

---

## 7. THAM CHIẾU

- [`MONICA_ONE_AUDIT_REPORT.md`](../audit/MONICA_ONE_AUDIT_REPORT.md) — §6 tám quyết định · §7 vòng khoá freeze
- [`BUSINESS_CONFIRMATION_1.md`](../business/BUSINESS_CONFIRMATION_1.md) — 20 câu
- [`ADR-011`](../adr/ADR-011-tham-quyen-kien-truc.md) §2.2 phản biện · §2.4 kỷ luật · §2.5 định nghĩa hoàn tất
- [`MIGRATION_INDEX.md`](../MIGRATION_INDEX.md) §5 — `031d`–`031g`
- [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) — TD-03 · TD-15
- [`tests/README.md`](../../tests/README.md) — K-1 · K-2 · K-3 · V.1
