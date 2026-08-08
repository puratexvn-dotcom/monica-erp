import {
  PackageSearch, Building2, Factory, Calculator, FileText,
  Shirt, Boxes, Ship, Users, MessageSquare,
} from 'lucide-react';

import type { OLauncher } from '@/components/md/command-center/md-business-launcher';

// ============================================================================
// MƯỜI Ô CỦA BUSINESS LAUNCHER — phòng Merchandising
//
// `MD_WORKSPACE_BLUEPRINT_V4.md` §4.2. Board: *"⛔ Không xoá. ⛔ Không gộp."*
//
// ⚠️ Con số lấy từ **dữ liệu ĐÃ CÓ trên trang**, ⛔ KHÔNG thêm truy vấn nào.
// Mười ô × một truy vấn = mười lượt đi–về, và đó đúng là cách tạo lại lỗi
// **TTFB 901 ms** vừa mất công gỡ ở vòng trước.
//
// ⚠️ `V.1` — ô ⛔ chưa có nguồn dữ liệu trả **`null`** ⇒ màn hình hiện **⚪**,
// ⛔ KHÔNG hiện `0`. `0` ở ô *"Nhà máy"* đọc thành *"⛔ không có chuyền nào"*,
// một tin sai; `⚪` đọc thành *"⛔ chưa đo"*, đúng sự thật.
//
// 🔑 Hai ô **Nhà máy** và **Gia công ngoài** khoá 🔒 — Blueprint §12 đã khai
// rõ: kho **⛔ chưa có nguồn** cho *"số chuyền"*, và `/subcon` là phân hệ
// riêng ⛔ không thuộc `/md`. ⛔ Không bịa số để ô trông "đầy đủ".
// ============================================================================

/** Bảng đếm theo tab mà `md-client` đã tính sẵn — ⛔ KHÔNG dựng bảng trung
 *  gian thứ hai: hai bảng đếm là hai cơ hội để chúng lệch nhau. */
export type DemTheoTab = Record<string, number | null>;

// 🔴 **SẮC ĐỊNH DANH — Board Directive *MD UI VISUAL FIX* 08/08/2026.**
//   > *"Mỗi ô phải có màu nhận diện riêng **hoặc màu xen kẽ rõ ràng**…
//   > Các card phải **dễ phân biệt ngay bằng mắt**."*
//
// 🔑 Bảy sắc cho mười ô, **xếp để ⛔ không ô nào kề ô cùng màu**: `blue ·
// emerald · violet · orange · teal · rose · amber · emerald · violet · sky`.
// Board cho phép *"màu xen kẽ"*, và bảy sắc đủ để mắt phân biệt trong 2–3 giây
// mà ⛔ không biến hàng thẻ thành cầu vồng — đúng vế *"⛔ không quá nhiều màu"*.
//
// ⚠️ Sắc đi theo **NGHIỆP VỤ**, ⛔ không theo vị trí: *Giao hàng* xanh lá vì nó
// là mốc **hoàn thành**, *Yêu cầu NPL* hổ phách vì nó là việc **đang chờ**.
// Đổi thứ tự ô thì màu đi theo ô, ⛔ không ở lại chỗ cũ.
export function O_LAUNCHER_MD(n: DemTheoTab): OLauncher[] {
  return [
    { id: 'po', nhan: 'PO', icon: PackageSearch, so: n.po, moTab: 'po', sac: 'blue', moTa: 'Đơn hàng đang theo dõi' },
    { id: 'khach', nhan: 'Khách hàng', icon: Building2, so: n.customers, moTab: 'customers', sac: 'emerald', moTa: 'Đối tác đang hợp tác' },
    // 🔒 ⛔ Chưa có nguồn cho "số chuyền" — xem chú thích đầu tệp.
    { id: 'nhamay', nhan: 'Nhà máy', icon: Factory, so: null, khoa: true, sac: 'violet', moTa: 'Nhà máy sản xuất' },
    { id: 'chiettinh', nhan: 'Chiết tính', icon: Calculator, so: n.costing, moTab: 'costing', sac: 'orange', moTa: 'Bảng chiết & giá thành' },
    { id: 'techpack', nhan: 'Tech Pack', icon: FileText, so: n.documents, moTab: 'documents', sac: 'teal', moTa: 'Hồ sơ kỹ thuật' },
    { id: 'dinhmuc', nhan: 'Định mức', icon: Shirt, so: n.styles, moTab: 'styles', sac: 'rose', moTa: 'Mã hàng · BOM' },
    { id: 'npl', nhan: 'Yêu cầu NPL', icon: Boxes, so: n.materials, moTab: 'materials', sac: 'amber', moTa: 'Đề nghị mua nguyên phụ liệu' },
    { id: 'giaohang', nhan: 'Giao hàng', icon: Ship, so: n.shipments, moTab: 'shipments', sac: 'emerald', moTa: 'Lịch giao & kiểm hàng' },
    { id: 'giacong', nhan: 'Gia công ngoài', icon: Users, so: null, href: '/subcon', sac: 'violet', moTa: 'Đối tác gia công' },
    { id: 'traodoi', nhan: 'Trao đổi', icon: MessageSquare, so: n.comments, moTab: 'comments', sac: 'sky', moTa: 'Trao đổi & thông báo' },
  ];
}
