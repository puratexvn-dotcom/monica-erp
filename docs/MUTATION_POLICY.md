# MONICA MOS — MUTATION POLICY

> **Trạng thái:** ⏳ chờ phê duyệt cùng [ADR-003](adr/ADR-003-request-id.md).
> **Phạm vi:** mọi thao tác `CREATE` · `UPDATE` · `DELETE` của toàn hệ thống —
> hôm nay là /md và Assignment, mai là Buyer · Subcon · Sales · HR · CRM · AI.

Tài liệu này trả lời bốn câu hỏi mà mỗi lệnh ghi đều phải trả lời được, và trả
lời **giống nhau ở mọi phân hệ**:

```
① Thử lại có an toàn không?          → Retry Policy
② Có hiện kết quả trước không?        → Optimistic Update
③ Hai người sửa cùng lúc thì sao?     → Conflict Handling
④ Làm sao biết đây là lần gửi cũ?     → Request Identity
```

---

## 1. Ba loại thao tác, ba luật khác nhau

Phân loại **không** theo động từ HTTP mà theo **hậu quả khi chạy hai lần**. Đây
là trục duy nhất quan trọng.

| Loại | Chạy hai lần thì sao | Ví dụ |
|---|---|---|
| **CREATE** | ⚠️ **Sinh hai chứng từ thật.** Không tự phục hồi được. | lập phần việc · lập PO · lập lô hàng · ghi báo cáo ngày |
| **UPDATE** | Thường vô hại — kết quả cuối giống nhau. **Trừ khi** là phép cộng dồn. | đổi trạng thái · sửa ngày kế hoạch |
| **DELETE** | Vô hại — xoá cái đã xoá là không làm gì. | xoá mềm |

⚠️ **Ngoại lệ của UPDATE phải đọc kỹ.** `SET qty = qty + 10` chạy hai lần thì
cộng 20. Mọi lệnh cộng dồn phải được đối xử **như CREATE**, không như UPDATE.
Trong MONICA MOS hôm nay chưa có lệnh nào như vậy — sổ cái là append-only nên
sản lượng cộng bằng `SUM` lúc đọc, không cộng dồn vào một cột. Giữ nguyên như
thế.

## 2. Retry Policy

| Loại | Tự động thử lại | Lý do |
|---|---|---|
| **Truy vấn đọc** | ✅ 1 lần | Lỗi phần lớn là quyền hoặc ràng buộc — thử năm lần chỉ bắt người dùng chờ lâu hơn để nhận cùng câu trả lời |
| **CREATE** | ❌ **0 lần** | Không có `request_id` thì mỗi lần thử lại là một chứng từ mới |
| **UPDATE** | ❌ 0 lần | Cẩn trọng cho tới khi kiểm soát phiên bản có mặt (Mục 4) |
| **DELETE** | ❌ 0 lần | Cùng lý do |

```ts
// providers.tsx — đặt MỘT LẦN cho toàn nhánh
queries:   { retry: 1, refetchOnWindowFocus: false }
mutations: { retry: 0 }
```

⚠️ `refetchOnWindowFocus: false` là **quyết định cho nhà máy**, không phải sở
thích: máy tính bảng dùng chung, người này đưa cho người kia — mỗi lần chạm màn
hình sẽ là một lượt gọi mạng. Làm mới xảy ra **khi ghi xong**, đúng lúc và đúng
chỗ.

⚠️ `retry: 0` **không đủ** để chống gửi trùng. Nó chặn được **một** trong bốn
đường (xem ADR-003 Mục 1). Ba đường còn lại — bấm hai lần, trình duyệt gửi lại,
hai tab — chỉ `request_id` mới chặn được.

## 3. Optimistic Update

> **Mặc định: KHÔNG.** Bật cho từng trường hợp, có lý do viết ra.

| Tình huống | Cho phép | Vì sao |
|---|---|---|
| **CREATE chứng từ** | ❌ **cấm tuyệt đối** | Số nghiệp vụ do dãy số CSDL sinh. Đoán trước rồi hiện lên là **bịa ra một chứng từ chưa tồn tại** — và nếu lệnh hỏng, người dùng đã kịp đọc và ghi lại một số không có thật |
| **Chuyển trạng thái** | ❌ | Máy chủ có thể từ chối (`canTransition`, trigger I-9). Hiện `COMPLETED` rồi bật lại `IN_PROGRESS` là màn hình nói dối trong một giây |
| **Bật/tắt, sắp xếp, đánh dấu đã đọc** | ✅ | Không sinh chứng từ, không đổi tiền, và hoàn lại được im lặng |

Phép thử: *"nếu lệnh này hỏng và màn hình bật ngược lại, người dùng có thể đã
kịp hành động dựa trên trạng thái sai không?"* Có → cấm.

## 4. Conflict Handling

**Hôm nay hệ thống dùng last-write-wins, và đó là một khoảng nợ đã biết.**

Đo được: không bảng nào có cột `version` hay `row_version`; mọi `UPDATE` đều là
`SET ... WHERE id = ?`. Hai người mở cùng một phần việc, cùng sửa `planned_finish`
— người lưu sau ghi đè người lưu trước, **không cảnh báo**.

| Mức | Cơ chế | Hiện trạng |
|---|---|---|
| **Bất biến dữ liệu** | `CHECK` · khoá ngoại · chỉ mục duy nhất | ✅ đang chạy |
| **Bảo vệ quy trình** | trigger REJECT (I-8 · I-9 · append-only) | ✅ đang chạy |
| **Chống ghi đè đồng thời** | so khớp phiên bản khi `UPDATE` | ❌ **chưa có** |

Đường đi khi làm: thêm `version INTEGER` (hoặc so `updated_at`), `UPDATE ...
WHERE id = ? AND version = ?`, 0 dòng bị ảnh hưởng ⇒ trả lỗi *"bản ghi đã được
người khác sửa, hãy tải lại"*.

⚠️ **Chưa làm trong phạm vi Assignment**, và ghi ở đây để không ai tưởng đã có.
Lý do: hôm nay mỗi phần việc có **một** `owner_user_id` chịu trách nhiệm, nên
xác suất hai người sửa đồng thời thấp. Khi Portal đối tác mở (sau 031) thì hai
phía cùng ghi vào một aggregate — **lúc đó nó thành bắt buộc**, cần ADR riêng.

### Xung đột đã được xử lý sẵn

| Xung đột | Xử lý ở đâu |
|---|---|
| Ghi vào phần việc đã đóng | trigger I-9 → `23001`, câu tiếng Việt đọc hiểu |
| Sửa đè sổ cái | trigger append-only → buộc ghi bản đính chính |
| Chuyển trạng thái không hợp lệ | `canTransition` → khoá i18n, kèm tên cột |
| Huỷ lô hàng còn thùng | `026b` → `restrict_violation` |

## 5. Request Identity

> Chuẩn đầy đủ ở [ADR-003](adr/ADR-003-request-id.md). Đây là phần thực thi.

**Luật:** mọi bảng chứng từ nghiệp vụ có thể lập mới đều mang `request_id UUID`
kèm chỉ mục duy nhất toàn phần.

### Vòng đời một khoá

```
mở biểu mẫu   →  crypto.randomUUID()          ← sinh ở đây, KHÔNG ở lúc bấm
bấm Gửi       →  gửi kèm requestId
gửi lại       →  CÙNG khoá ⇒ máy chủ trả về chính bản ghi cũ, ok: true
thành công    →  sinh khoá MỚI cho lần lập tiếp theo
```

### Service phải cư xử thế nào

```
INSERT → 23505 trên uq_<bảng>_request_id
       → đọc lại dòng cũ theo request_id
       → trả { ok: true, id: <dòng cũ> }      ← THÀNH CÔNG, không phải lỗi
```

⚠️ Trả lỗi ở nhánh này là **phản tác dụng**: người dùng thấy *"Mã này đã tồn
tại"* cho một thao tác đã thành công, tưởng là hỏng, và bấm lại với khoá mới —
tạo ra đúng bản trùng mà cả cơ chế sinh ra để chặn.

### Điều bắt buộc với mọi phân hệ mới

```
CREATE TABLE chứng từ mới  →  gọi mos_add_request_id()
Create*DTO mới             →  có trường requestId (BẮT BUỘC, không tuỳ chọn)
Service tạo mới            →  bắt 23505 và trả về dòng cũ
Biểu mẫu mới               →  sinh khoá lúc MỞ, không lúc BẤM
```

## 6. Làm mới bộ nhớ đệm sau khi ghi

Ghi xong **phải** làm mới, và danh sách khoá lấy từ `*InvalidationKeys` — không
gọi `invalidateQueries` rời rạc trong từng mutation.

```ts
onSuccess: (_res, input) => {
  for (const key of assignmentInvalidationKeys(input.assignmentId)) {
    void qc.invalidateQueries({ queryKey: key });
  }
}
```

⚠️ Rải lời gọi trong từng mutation là cách chắc chắn để một ngày thêm truy vấn
mới mà quên làm mới nó: **không lỗi nào nổ ra**, màn hình chỉ hiện số cũ mãi
mãi, và người dùng kết luận là hệ thống ghi hỏng.

## 7. Thông báo lỗi

| Nguồn | Hình dạng | Ai dịch |
|---|---|---|
| `policies/` · `permission/` | khoá i18n (`assignment_err_*`) kèm tên cột | giao diện |
| Trigger CSDL | câu tiếng Việt viết sẵn trong `RAISE EXCEPTION` | không cần dịch |
| Ràng buộc CSDL | `friendlyDbError` ánh xạ theo SQLSTATE | service |

⚠️ **Không bao giờ hiển thị thông điệp Postgres thô.** Và không bao giờ hiện
danh sách rỗng khi sự thật là *"bạn không có quyền"* — đó là lỗi `qa_logs` của
Phase 5, nơi giao diện nói với buyer *"chưa có phiếu kiểm nào"* trong khi thực
tế là họ không được xem. `unwrap.ts` tồn tại để chặn đúng lớp lỗi đó.

## 8. Checklist cho mỗi lệnh ghi mới

```
☐  Phân loại đúng: CREATE / UPDATE / DELETE / cộng dồn
☐  CREATE  → có requestId trong DTO, sinh lúc MỞ biểu mẫu
☐  CREATE  → service bắt 23505 và trả về dòng cũ với ok: true
☐  retry: 0 (mọi mutation, không ngoại lệ)
☐  Không optimistic update — trừ khi viết ra lý do
☐  onSuccess gọi *InvalidationKeys, không gọi invalidateQueries rời rạc
☐  Lỗi trả khoá i18n hoặc câu đã dịch, không trả thông điệp Postgres thô
☐  Bài kiểm sống: gửi HAI LẦN cùng khoá ⇒ đúng MỘT dòng
☐  Bài kiểm sống dọn sạch dư lượng (Điều XXXI)
```

## 9. Nợ đã ghi nhận

| Nợ | Khi nào phải trả |
|---|---|
| Chưa có kiểm soát phiên bản (last-write-wins) | trước khi Portal đối tác mở — hai phía cùng ghi vào một aggregate |
| `request_id` mới có ở Assignment | migration 033, từng miền một |
| Chưa có cảnh báo trùng lặp theo **khoá nghiệp vụ** (hai người lập hai phần việc giống nhau, hai khoá khác nhau) | khi có ca thật; `request_id` **không** giải bài toán này |
