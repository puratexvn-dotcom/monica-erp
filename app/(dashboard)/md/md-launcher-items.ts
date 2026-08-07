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

export function O_LAUNCHER_MD(n: DemTheoTab): OLauncher[] {
  return [
    { id: 'po', nhan: 'PO', icon: PackageSearch, so: n.po, moTab: 'po' },
    { id: 'khach', nhan: 'Khách hàng', icon: Building2, so: n.customers, moTab: 'customers' },
    // 🔒 ⛔ Chưa có nguồn cho "số chuyền" — xem chú thích đầu tệp.
    { id: 'nhamay', nhan: 'Nhà máy', icon: Factory, so: null, khoa: true },
    { id: 'chiettinh', nhan: 'Chiết tính', icon: Calculator, so: n.costing, moTab: 'costing' },
    { id: 'techpack', nhan: 'Tech Pack', icon: FileText, so: n.documents, moTab: 'documents' },
    { id: 'dinhmuc', nhan: 'Định mức', icon: Shirt, so: n.styles, moTab: 'styles' },
    { id: 'npl', nhan: 'Yêu cầu NPL', icon: Boxes, so: n.materials, moTab: 'materials' },
    { id: 'giaohang', nhan: 'Giao hàng', icon: Ship, so: n.shipments, moTab: 'shipments' },
    { id: 'giacong', nhan: 'Gia công ngoài', icon: Users, so: null, href: '/subcon' },
    { id: 'traodoi', nhan: 'Trao đổi', icon: MessageSquare, so: n.comments, moTab: 'comments' },
  ];
}
