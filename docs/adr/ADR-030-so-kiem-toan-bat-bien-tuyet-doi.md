# ADR-030 — Sổ kiểm toán bất biến **tuyệt đối**, kể cả `service_role`

| | |
|---|---|
| **Trạng thái** | 🔴 **ĐỀ XUẤT — CHỜ BOARD.** Migration `056` **⛔ CHƯA chạy**. |
| **Ngày** | 08/08/2026 |
| **Người soạn** | Chief Solution Architect |
| **Nguồn nghiệp vụ** | Board Directive *FAST SECURITY FIX* 08/08/2026 |
| **Đảo quyết định** | 🔴 **`041` §"INSERT VÀ SELECT GIỮ NGUYÊN"** — xem §1 |
| **Migration thi hành** | `056_activity_log_absolute_immutable.sql` |
| **Phản biện độc lập** | ⛔ **CHƯA có** — ADR-011 §2.2 áp dụng *(chạm quyền tầng CSDL)* |

---

## 0. ĐO ĐƯỢC TRƯỚC KHI VIẾT — ⛔ không suy đoán

Chạy bằng khoá `service_role` thật trên CSDL đang chạy, 08/08/2026:

```
service_role INSERT ....... ĐƯỢC
service_role UPDATE ....... 🔴 ĐƯỢC
service_role DELETE ....... 🔴 ĐƯỢC
dòng thử còn lại .......... 0
```

⛔ **Không có trigger nào** trên `activity_log`.

---

## 1. 🔴 ĐÂY LÀ ĐẢO MỘT QUYẾT ĐỊNH CÓ CHỦ Ý, ⛔ KHÔNG PHẢI VÁ MỘT SƠ SUẤT

Điều quan trọng nhất của tài liệu này, và ⛔ không được nói khác đi:

> `041` **CỐ Ý** để `service_role` giữ đủ quyền. Nguyên văn:
>
> *"`service_role` GIỮ NGUYÊN mọi quyền — cùng lý lẽ `029b:61`. **Ba đường hợp
> lệ** để sửa dữ liệu bất biến *(Migration · Maintenance Script · Recovery
> Procedure)* đều đi bằng khoá đó, và cả ba đều để lại dấu vết."*

⇒ Trạng thái hiện nay **⛔ không phải lỗi lọt lưới**. Nó là **thiết kế**, được
ghi rõ trong chính tệp migration và trong `COMMENT ON TABLE`.

### ⚠️ Nhưng nó mâu thuẫn với `K-1`

`tests/README.md` §K-1 phát biểu ngược lại:

> *"Ghi một dòng vào sổ cái để kiểm trigger ⇒ **⛔ không xoá ra được, kể cả
> bằng `service_role`**."*

🔑 Hai văn bản của cùng một kho **nói hai điều khác nhau** về cùng một bảng, và
tình trạng đó tồn tại từ 04/08/2026. `K-1` còn nhắc tới *"trigger"* — một
trigger **⛔ chưa từng tồn tại**.

⇒ Board Directive 08/08/2026 chọn phía `K-1`. ADR này **ghi lại việc đảo**, ⛔
không sửa `041` một cách im lặng.

### 💸 Cái giá phải trả, nói thẳng

Ba đường phục hồi mà `041` dựa vào **ĐÓNG LẠI**. Từ nay muốn sửa/xoá một dòng
sổ kiểm toán, đường duy nhất là:

```sql
ALTER TABLE public.activity_log DISABLE TRIGGER mos_activity_log_immutable;
  -- … thao tác …
ALTER TABLE public.activity_log ENABLE  TRIGGER mos_activity_log_immutable;
```

— và lệnh đó **chỉ chủ sở hữu bảng chạy được**, tức phải qua **SQL Editor**,
tức **để lại vết trong lịch sử migration/thao tác**.

🔑 Đó chính là **mục đích**: đổi *"sửa được lặng lẽ bằng một khoá API"* lấy
*"sửa được nhưng phải mở khoá công khai"*.

---

## 2. CƠ CHẾ — VÌ SAO **⛔ KHÔNG** DÙNG RLS

| Cơ chế | Chặn được `service_role`? | Vì sao |
|---|---|---|
| **Policy RLS** | 🔴 **⛔ KHÔNG** | `service_role` mang thuộc tính **`BYPASSRLS`**. Mọi policy viết ra đều bị nó đi vòng. Dùng RLS ở đây là **giải pháp giả** — đúng thứ Board §3 cấm. |
| **`REVOKE` quyền bảng** | ✅ **CÓ** | `BYPASSRLS` chỉ bỏ qua **policy**, ⛔ không bỏ qua **`GRANT`**. `service_role` ⛔ không phải superuser và ⛔ không sở hữu bảng ⇒ quyền bảng áp lên nó. |
| **`TRIGGER`** | ✅ **CÓ** | Trigger nổ với **mọi vai**, kể cả chủ sở hữu. Đây là lớp duy nhất còn đứng khi một migration tương lai lỡ `GRANT ALL` trở lại. |

### ⇒ Dùng **CẢ HAI**, và đó ⛔ không phải thừa

- `REVOKE` là **hàng rào chính** — rẻ, rõ, đọc được bằng `information_schema`.
- `TRIGGER` là **lưới cuối** — nó bắt đúng ca `041` đã cảnh báo: *"`GRANT` là
  phép CỘNG, ⛔ không bao giờ thu hẹp"*. Kho này **đã một lần** mất quyền kiểm
  soát vì `ALTER DEFAULT PRIVILEGES` của Supabase cấp lại `GRANT ALL`.

🔑 Một hàng rào **có thể bị vô hiệu bởi một dòng `GRANT`** ⛔ không phải hàng
rào cho một sổ kiểm toán.

### `TRUNCATE` cần trigger RIÊNG

Trigger cấp **dòng** ⛔ **không** bắt được `TRUNCATE`. Phải có thêm một trigger
`BEFORE TRUNCATE ... FOR EACH STATEMENT`. Thiếu nó là để nguyên lối *"một lệnh,
sạch cả bảng, ⛔ không một dấu vết"* mà chính `041` đã chỉ ra.

---

## 3. ⚠️ GIỚI HẠN — ĐIỀU NÀY **⛔ KHÔNG** LÀM ĐƯỢC

Board §5: *"Nếu ⛔ không đạt được mục tiêu, **⛔ KHÔNG được giả vờ PASS**."*

| Vai | Chặn được? |
|---|---|
| `anon` | ✅ |
| `authenticated` *(mọi vai nghiệp vụ)* | ✅ |
| **`service_role`** | ✅ — **đúng mục tiêu Board đặt ra** |
| Chủ sở hữu bảng *(`postgres` qua SQL Editor)* | ⚠️ **Chặn bởi trigger**, nhưng **gỡ được** bằng `DISABLE TRIGGER` |
| **Superuser** | 🔴 **⛔ KHÔNG** — `SET session_replication_role = 'replica'` tắt mọi trigger |

🔑 **⛔ Không cơ chế nào TRONG PostgreSQL chặn được superuser.** Đó là giới hạn
của chính hệ quản trị, ⛔ không phải của thiết kế này. Ai giữ được superuser thì
giữ được cả CSDL — phòng thủ ở tầng đó là **quản lý khoá**, ⛔ không phải SQL.

⇒ Phát biểu trung thực: **bất biến với mọi đường mà ứng dụng đi qua, gồm cả
`service_role`; ⛔ không bất biến trước người cầm khoá superuser.**

---

## 4. HỆ QUẢ ĐÃ BIẾT — bài kiểm sẽ ⛔ không tự dọn được nữa

`K-1` đã nói trước điều này:

> *"Bài kiểm thất bại **chính vì** thứ nó kiểm đang chạy đúng. Phải viết một
> Maintenance Script để dọn."*

Hai bài UAT hiện **xoá dòng `activity_log`** trong khối `finally`:
`scripts/uat-md-vong-doi.mjs` · `scripts/uat-md-form-dau-vao.mjs`.

⇒ Sau `056`, lệnh xoá đó **⛔ không chạy được nữa**. Bản vá kèm theo:

- Hai bài kiểm **thôi xoá** sổ kiểm toán và **nói rõ** vì sao trong log.
- `supabase/maintenance/M003_purge_uat_audit.sql` — dọn khi cần, chạy bằng
  **chủ sở hữu** qua SQL Editor, có `DISABLE/ENABLE TRIGGER` tường minh.

⚠️ Dòng kiểm toán của dữ liệu UAT vì vậy **tích lại**. Đó là **đúng ngữ nghĩa**
của một sổ chỉ-ghi-thêm — nó ghi rằng *"đã từng có một dòng ở đây"* — và giá đó
rẻ hơn nhiều so với một sổ xoá được.

---

## 5. PHÂN TÍCH TÁC ĐỘNG

| | |
|---|---|
| **Bảng chạm** | `activity_log` — 2 trigger, thu hồi quyền. ⛔ Không đụng cột, ⛔ không đụng dữ liệu. |
| **Ai mất quyền gì** | `service_role` mất `UPDATE` · `DELETE` · `TRUNCATE`. `INSERT` · `SELECT` **giữ nguyên** — sổ ngừng ghi được là hỏng nặng hơn lỗ hổng đang vá. |
| **Mã ứng dụng** | ⛔ **KHÔNG tệp nào** `.update()`/`.delete()` bảng này *(đã đối chiếu; `041` cũng đã kiểm cùng kết luận)*. |
| **RLS** | ⛔ **KHÔNG chạm policy nào.** Xem §2 — RLS ⛔ không phải công cụ đúng ở đây. |
| **Bài kiểm** | 2 bài UAT phải bỏ bước xoá sổ kiểm toán — xem §4. |

---

## 6. TÍNH ĐẢO NGƯỢC — **ĐẢO ĐƯỢC**

```sql
DROP TRIGGER IF EXISTS mos_activity_log_immutable   ON public.activity_log;
DROP TRIGGER IF EXISTS mos_activity_log_no_truncate ON public.activity_log;
GRANT UPDATE, DELETE, TRUNCATE ON public.activity_log TO service_role;
```

⚠️ Đảo là **quay lại đúng trạng thái Board vừa yêu cầu đóng**. Chỉ làm khi có
quyết định Board bằng văn bản.
