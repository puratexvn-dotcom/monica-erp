# MONICA Garment ERP — Hệ thống Quản trị Sản xuất Dệt may đa phân hệ

Next.js App Router · Tailwind CSS · Lucide Icons · Supabase (realtime + fallback mock data)

## Cài đặt & chạy

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # kiểm tra TypeScript
```

## Khởi tạo Supabase (tùy chọn — không có vẫn chạy bằng mock data)

1. Mở Supabase → SQL Editor → chạy toàn bộ `supabase/schema.sql`.
2. Database → Replication → bật Realtime cho: `prod_logs`, `qa_logs`, `orders`, `approvals`, `notifications`.
3. Kiểm tra lại URL/Key trong `lib/supabase.ts` (⚠️ chú ý ký tự chữ **O** / số **0** trong key).
4. Muốn có dữ liệu demo trên DB thật: nhập tay theo cấu trúc trong `lib/mock-data.ts`
   (khi bảng trống, app tự hiển thị mock data nên không bắt buộc).

## 10 tài khoản demo

| Vai trò | Username | Password |
|---|---|---|
| Super Admin | `superadmin` | `monicasa` |
| Giám đốc | `giamdoc` | `monicagd` |
| Merchandiser | `md` | `monicamd` |
| QA/QC | `qa` | `monicaqa` |
| Tổ trưởng May | `totruongmay` | `monicattm` |
| Tổ trưởng Cắt | `totruongcat` | `monicattc` |
| Kho | `kho` | `monicakho` |
| Kế toán | `ketoan` | `monicakt` |
| Subcon | `subcon` | `monicasub` |
| Buyer | `buyer` | `monicabuyer` |

## Kiến trúc

```
lib/garment-math.ts   ← TẤT CẢ công thức ngành may (quy đổi vải, BOM, hao hụt,
                        AQL 2.5 chuẩn ISO 2859-1, DHU/RFT, takt/hiệu suất, công nợ)
lib/supabase.ts       ← data layer: fetch + realtime + fallback mock tự động
lib/mock-data.ts      ← bộ dữ liệu demo "có chuyện để kể" (PO trễ, xưởng lỗi >3%…)
lib/auth.ts           ← đăng nhập + RBAC matrix 10 vai trò
components/           ← sidebar + bộ UI dùng chung
app/(auth)/login      ← trang đăng nhập
app/(dashboard)/…     ← 10 module: admin, giam-doc, md, qa, to-truong-may,
                        to-truong-cat, kho, ke-toan, subcon, buyer
```

## Luồng đồng bộ (Single Source of Truth)

Tổ Cắt ghi nhật ký → sinh Bundle → **BTP khả dụng** của Chuyền may tự cập nhật →
Chuyền/Subcon báo sản lượng → QA kiểm Endline theo bảng AQL 2.5 →
lô **PASS** tự cộng vào **Kho Thành phẩm** và **Công nợ Kế toán**
(căn cứ thanh toán duy nhất) → Kế toán đối soát: nghiệm thu − phạt − tạm ứng.

## ⚠️ Bảo mật (bắt buộc trước khi lên production)

- Chuyển đăng nhập sang **Supabase Auth** (mật khẩu bcrypt), bỏ cột `password`.
- Bật **RLS policies** cho từng bảng theo vai trò; scope subcon/buyer bằng policy.
- Đưa URL/Key vào `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY`).
- Gỡ khối "tài khoản demo" ở trang đăng nhập.
