# CHANGELOG — Monica ONE

> Ban hành theo **Board Directive 04/08/2026** mục 6: mỗi Sprint bàn giao đủ
> *Source Code · Migration · Test · Documentation · Commit · Decision Log ·
> Changelog*.
>
> Tài liệu này ghi **cái gì đã đổi và vì sao**. Nó **không** thay thế
> [`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md) *(tri thức nằm ở đâu)* hay
> [`docs/ARCHITECTURE_BASELINE.md`](docs/ARCHITECTURE_BASELINE.md) *(kiến trúc
> đã khoá cái gì)*.
>
> Quy ước: `🔴` bảo mật · `✨` tính năng · `🐛` sửa lỗi · `📄` tài liệu ·
> `🧪` kiểm thử · `🗄️` migration. Migration nào **chưa được Board chạy** đều ghi
> rõ `⏳ chờ chạy` — *"đã viết" khác "đã có hiệu lực"*.

---

## Sprint I-1 · An toàn — 04–05/08/2026 · ✅ **HOÀN TẤT**

**Điều kiện ra của Sprint (Baseline §3.2):** `pg_policies` trên CSDL thật cho
thấy nhóm bảng MD đã thu hẹp.

**Đạt tới đâu:** phần **chẩn đoán** khép trọn vẹn — lỗ hổng đã đo `[VERIFIED]`,
đã vá `F-1`, đã soạn ADR cho `F-2`. Phần **thi hành trên CSDL** chưa đạt và
**không thể đạt trong Sprint này**: nó cần Board chạy `041`, cắt vòng khoá
`B2`, và phê duyệt ADR-018. Cả ba đều ngoài thẩm quyền CSA.

> ⚠️ **Không ghi `✅` cho phần chưa đo được.** Điều kiện ra nguyên văn nói *"trên
> CSDL thật"*; chừng nào `041` và `042` chưa chạy thì câu đó chưa đúng. Sprint
> đóng vì **đã làm hết phần làm được**, không phải vì đã đạt đích.

### 🔴 Bảo mật

- **`VR-001` đo xong** bằng phiên đăng nhập thật trên CSDL đang chạy, thay vì
  bằng truy vấn tay. Khép **Cổng B mục `B1`**.
  → [`docs/audit/VR-001-KET-QUA.md`](docs/audit/VR-001-KET-QUA.md)
- **`F-1` `[VERIFIED]` — sổ kiểm toán không bất biến.** Mọi vai nội bộ `UPDATE`
  và `DELETE` được `activity_log`. Vi phạm **BDR-14** và quy tắc **K-1**.
  Người sửa dữ liệu tự xoá được dấu vết của chính mình.
- **`F-2` `[VERIFIED]` — 23 bảng không phân tách nội bộ.** `014`/`015` cấp
  `authenticated_only` = `FOR ALL` + `GRANT ALL`; vai trò không xuất hiện trong
  biểu thức policy. Vi phạm **Playbook Điều XXX** và nhóm `SOD-H*`.
  → chờ **ADR-018**.

### 🗄️ Migration

- **`041_activity_log_immutable.sql`** ⏳ **chờ Board chạy** — vá `F-1`. Thu hồi
  `UPDATE` · `DELETE` · `TRUNCATE` của `authenticated` và `anon` trên
  `activity_log`. `INSERT`/`SELECT` giữ nguyên; `service_role` giữ nguyên.
  Không đụng policy, không đụng bảng khác, không đổi lược đồ.
  - `TRUNCATE` được thu hồi cùng lượt dù Board chỉ nêu `UPDATE`/`DELETE`: nó
    bỏ qua trigger, bỏ qua RLS, không sinh dòng audit nào — để lại nó thì mục
    tiêu *bất biến* không đạt được. Tiền lệ: `029b:56`.

### 🧪 Kiểm thử

- **`tests/security/md-internal-scope.test.mjs`** — bài kiểm phân quyền **nội
  bộ** đầu tiên của dự án. Đã vào `npm test`.
  - Đo quyền GHI bằng lệnh nhắm vào **khoá không tồn tại** ⇒ chạy được trên bảng
    rỗng, và **không tạo dòng nào** — không phải mở cửa một chiều của sổ cái
    (quy tắc **K-1**).
  - Kết quả lần đầu: **0 đạt · 24 hỏng · 4 chưa đo được**. Đỏ **có chủ ý**.
  - Nhãn `[F-1]` / `[F-2]` để đọc được tiến độ sau khi `041` chạy.

### 📐 Quyết định kiến trúc

- **[ADR-018](docs/adr/ADR-018-thu-hep-authenticated-only.md)** ⏳ **chờ phản
  biện + Board phê duyệt** — thu hẹp `authenticated_only` trên 23 bảng. Đủ chín
  mục Board yêu cầu. **ADR đầu tiên sau khi đóng băng** ⇒ đi qua Architecture
  Change Procedure, không thuộc baseline. Migration `042` ⛔ chưa viết.
- Hai câu hỏi chặn trước khi viết `042`: **`VR-004`** *(kho có cần đọc
  `style_bom` không)* · **`VR-005`** *(`ketoan` có cần đọc `costings` không)*.

### 🔢 Kỷ luật số hiệu — ba va chạm trong một dự án

| Lần | Va chạm | Xử lý |
|---|---|---|
| 1 | `BDR-14` · `BDR-15` — Board và CSA cùng cấp | số Board giữ · số CSA → `BDR-18` `BDR-19` |
| 2 | `VR-002` · `VR-003` — BKB *(bậc 0′)* và CSA | số BKB giữ · số CSA → `VR-004` `VR-005` |
| 3 | `TD-18`…`TD-22` — EDD-06 *(bậc 2′)* và CSA | số EDD giữ · số CSA → `TD-25`…`TD-29` |

Nguyên nhân chung: **không có sổ cấp số tập trung.** Thứ bậc văn bản giải quyết
xung đột *nội dung*, không giải quyết xung đột *số hiệu*. Ghi thành `TD-30`,
**đề nghị Board quyết riêng**.

### 📄 Tài liệu

- `docs/audit/MONICA_ONE_AUDIT_REPORT.md` — **khối đính chính §M2**. Phát biểu
  *"buyer và subcon đọc được `costings`/`style_bom`"* là **SAI**: hai vai này bị
  chặn bởi `buyer_denied` (`018`) và `subcon_denied` (`025`). Nguyên nhân: tìm
  theo khuôn `CREATE POLICY ... ON <bảng>` rồi kết luận trên chỗ không tìm thấy
  — đúng lỗi **Hiến pháp V.1**. Giữ nguyên phần sai theo **Điều 43.7**.
- `docs/review/` + `_TEMPLATE-review.md` — nơi lưu hồ sơ phản biện độc lập.
  Khép **`TD-15`** và **Cổng B mục `B6`**.
- `docs/RLS_COVERAGE_MATRIX.md` — thêm nhật ký 04/08 và bảng `F-2`.
- `docs/ARCHITECTURE_BASELINE.md` — Cổng B: `B1` ✅ · `B6` ✅ · `B3` 🟡 *(kèm lý
  do chưa làm)*.
- `CHANGELOG.md` — tệp này.

### ⏳ Còn treo

| # | Việc | Ai |
|---|---|---|
| — | 🔴 **Chạy `041`** trên SQL Editor, chép khối kiểm tra về hồ sơ | **Board** |
| — | 🔴 **Phê duyệt ADR-018** *(sau phản biện độc lập)* + trả lời `VR-004` · `VR-005` | **Board** |
| `B2` | 🔴 Cắt vòng khoá SECURITY FREEZE — **không cắt thì `042` không chạy được** | **Board** |
| `TD-30` | Lập sổ cấp số tập trung cho `TD` · `VR` · `BDR` | Board quyết |
| `B3` | Gộp ba chuỗi ADR *(chạm `00-CONSTITUTION.md:75` ⇒ không tự làm)* | CSA → Board |
| `B4` | Người thứ hai cho `SOD-H04` · `H05` · `H06` | Joseph |
| `B5` | Thời hạn phản biện tối đa | Board |

> ⚠️ **`npm run verify` đang ĐỎ, có chủ ý.** Bài kiểm mô tả trạng thái **đích**;
> nó chỉ xanh sau khi `041` và migration của ADR-018 chạy. Xanh sớm nghĩa là bài
> kiểm sai, không phải hệ thống đúng.
