# ADR-031 — Kho bằng chứng riêng tư, đọc qua Signed URL có kiểm quyền nghiệp vụ

| | |
|---|---|
| **Trạng thái** | 🟠 **ĐƯỢC BOARD DUYỆT TRIỂN KHAI** *(Directive 08/08/2026)*. Migration `057` **⛔ CHƯA chạy**. |
| **Ngày** | 08/08/2026 |
| **Người soạn** | Chief Solution Architect |
| **Nguồn nghiệp vụ** | Board Directive *EVIDENCE SECURITY IMPLEMENTATION* 08/08/2026 |
| **Đảo quyết định** | `013_storage_evidences.sql` — bucket công khai |
| **Migration thi hành** | `057_evidence_private_bucket.sql` |
| **Phản biện độc lập** | ⛔ **CHƯA có** — `ADR-011 §2.2` áp dụng |

---

## 1. BA KHUYẾT TẬT — ĐO BẰNG HÀNH VI, ⛔ KHÔNG ĐỌC POLICY

| | Đo được 08/08/2026 | Mức |
|---|---|---|
| **P0** | Tải tệp bằng `md001`, gọi URL bằng `fetch` **trần** ⇒ **`HTTP 200`** | 🔴 HIGH |
| **P1** | `md001` **tự xoá được** tệp mình tải ⇒ ĐƯỢC, ⛔ không một dòng vết | 🟠 MEDIUM |
| **P0-b** | Tải PDF ⇒ **`mime type application/pdf is not supported`** | 🟠 MEDIUM |

`013` **cố ý** đặt `public = true` và tự khai điều đó. ⇒ ADR này **ghi lại việc
đảo**, ⛔ không sửa `013` một cách im lặng.

---

## 2. 🔑 ĐIỂM KIẾN TRÚC CỐT LÕI — HỎI RLS, ⛔ KHÔNG VIẾT BỘ LUẬT THỨ HAI

Bốn policy của `013` chỉ hỏi hai câu: *"đã đăng nhập chưa"* và *"có phải người
tải lên ⛔"*. **⛔ Không cái nào hỏi *"người này có quyền với ĐƠN HÀNG đó ⛔"***
— vì `storage.objects` **⛔ không biết gì** về đơn hàng.

⇒ Phép kiểm nghiệp vụ **⛔ không đặt được ở tầng storage policy**. Nó phải nằm
ở Server Action, nơi đọc được cả hai bảng.

```
Người dùng → layUrlBangChung()
             ├─ ① tệp có THUỘC bản ghi ⛔  →  tra `md_documents`
             ├─ ② đọc được bản ghi cha ⛔   →  hỏi RLS bằng PHIÊN CỦA HỌ
             └─ ③ createSignedUrl(300s)
```

### ⚠️ Vì sao ② hỏi RLS thay vì tự phán quyết

`lib/mos/permission/` là bộ luật quyền của hệ thống, và RLS là bản thi hành của
nó ở tầng CSDL. Viết một phép kiểm quyền **thứ ba** ở đây là dựng **nguồn sự
thật thứ ba** — và ba nguồn thì lệch nhau đúng vào lúc ⛔ không ai để ý.

🔑 Hỏi RLS còn tự động đúng luật **Assignment** cho nhà thầu ngoài *(Playbook
Điều XXX)* mà ⛔ không phải chép lại luật đó.

### ⚠️ Vì sao ① tồn tại — chống `IDOR`

⛔ Không có ①, lệnh sau sẽ chạy:

```
layUrlBangChung('ORDER', <đơn TÔI có quyền>, '<đường dẫn tệp NGƯỜI KHÁC>')
```

Đúng người, đúng đơn, **sai tệp** — và ⛔ không phép kiểm quyền nào bắt được,
vì mọi thứ về *người* và *đơn* đều hợp lệ. Đây là lỗ hổng ⛔ không lộ ra ở bài
kiểm chỉ đo *"đúng vai, đúng bản ghi"*.

---

## 3. MỘT NGUỒN ALLOWLIST — và giới hạn thật của nó

`lib/mos/evidence/mime.ts` là **bản gốc**. Ứng dụng đọc thẳng; migration `057`
**chép** vào bucket.

⚠️ SQL ⛔ không đọc được TypeScript. Nên *"một nguồn sự thật"* ở đây thi hành
bằng **một phép ĐO**: `kiem-bang-chung.mjs §5.1` so hai bên và **HỎNG** nếu
lệch.

🔑 Đó là thứ duy nhất khiến lời hứa ấy thành sự thật. Hai tầng ⛔ không tự đồng
bộ được — điều làm được là **phát hiện ngay lúc chúng trôi ra xa nhau**, đúng
khuyết tật đã làm PDF hỏng hai ngày mà ⛔ không phép kiểm nào thấy.

---

## 4. XOÁ BẰNG CHỨNG — **PHƯƠNG ÁN A**, theo Board §4

> *"Evidence là bằng chứng nghiệp vụ. ⛔ Không cho user tự xoá vật lý… cùng
> mindset với `activity_log` immutability."*

⇒ Gỡ hẳn policy `DELETE` và `UPDATE`. Muốn bỏ một tệp: **lưu trữ mềm** bản ghi
`md_documents` *(`deleted_at`, có sẵn từ `052`)* — tệp vẫn nằm trong kho, bản
ghi biến khỏi danh sách, và **có vết**.

⚠️ Cái giá: tệp tải nhầm nằm lại vĩnh viễn trong kho. Đó là **cái giá của bất
biến**, giống hệt `056`, ⛔ không phải tác dụng phụ ngoài ý muốn.

---

## 5. ⚠️ GIỚI HẠN — NÓI THẲNG

| Vai | Chặn được? |
|---|---|
| `anon` · khách vãng lai | ✅ |
| `authenticated` *(mọi vai nghiệp vụ)* | ✅ ⛔ không đọc trực tiếp được |
| **`service_role`** | ⚠️ **VẪN đọc/xoá được** — `BYPASSRLS`, và storage ⛔ không có trigger như `056` |
| superuser | 🔴 ⛔ KHÔNG |

🔑 Storage **⛔ không đặt trigger được** như bảng thường, nên mẹo của `056` ⛔
không dùng lại được ở đây. Phòng thủ với `service_role` là **giữ khoá** — nó
chỉ tồn tại ở máy chủ và script chạy tay, **⛔ không bao giờ xuống trình duyệt**.

⇒ Phát biểu trung thực: **kín với mọi đường ứng dụng và mọi người dùng cuối;
⛔ KHÔNG kín trước người cầm khoá `service_role` hay superuser.**

---

## 6. TÍNH ĐẢO NGƯỢC — **ĐẢO ĐƯỢC HOÀN TOÀN**

```sql
UPDATE storage.buckets SET public = true WHERE id = 'evidences';
CREATE POLICY "evidences_public_read"  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'evidences');
CREATE POLICY "evidences_authenticated_delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'evidences' AND owner = auth.uid());
```

⚠️ **Đảo được lỗ hổng, ⛔ không đảo được hậu quả**: một URL đã rò ra ngoài
trong lúc kho công khai vẫn sống mãi. Hiện **⛔ chưa có URL nào từng được
phát** — đó là toàn bộ giá trị của việc vá lúc kho còn rỗng *(0 tệp · 0 tham
chiếu)*.
