'use client';

// ============================================================================
// HỘP THOẠI · PANEL PO 360 · BẢNG LỆNH — tách khỏi `md-client.tsx`
//
// ⚠️ Tách vì phép kiểm trần **900 dòng** bắt được. Sửa bằng **CẤU TRÚC**, ⛔
// không bằng cách nới trần — trần đó tồn tại để `md-client` ⛔ không phình
// thêm, và `TD-39` *(tách `md-client`)* vẫn đang chờ.
//
// 🔑 Và chỗ này **đúng hơn** chỗ cũ: mọi thứ ở đây là **lớp phủ** — chúng ⛔
// không thuộc dòng chảy của trang, chúng chỉ mở ra khi được gọi. Gom lại một
// nơi thì thân `md-client` chỉ còn **bố cục**, ⛔ không lẫn lớp phủ.
//
// ⚠️ Component này ⛔ **không giữ state nào**. Mọi ô nhớ vẫn ở `md-client` —
// nhân đôi state sang đây là mở cửa cho hai nguồn sự thật.
// ============================================================================
import CommandPalette from '@/components/md/command-palette';
import Po360Sheet from '@/components/md/po/po-360-sheet';
import PoFormDialog from '../orders/po-form-dialog';
import StyleFormDialog from '@/components/md/style/style-form-dialog';
import CustomerFormDialog from '@/components/md/crm/customer-form-dialog';
import InquiryFormDialog from '@/components/md/rfq/inquiry-form-dialog';
import { CostingFormDialog, CostingByOperationsDialog } from '@/components/md/costing/costing-form-dialog';
import { MaterialGenDialog, ProductionGenDialog } from '@/components/md/planning/auto-generate-dialogs';
import {
  CustomerFormDialog as LegacyCustomerFormDialog,
  MaterialRequestDialog, ProductionOrderDialog, ShipmentFormDialog,
} from './md-forms';
import { listCustomerOptionsClient } from './_actions/md4.client';
import type { TabKey } from './md-tabs';
import type { PoRow, StyleRow, CustomerRow } from '@/schemas/md';
import type { PoOption } from './md-types';

export default function MdDialogs(p: {
  dialog: TabKey | null;
  setDialog: (v: TabKey | null) => void;
  autoDialog: 'material' | 'production' | null;
  setAutoDialog: (v: 'material' | 'production' | null) => void;
  congDoanMo: boolean;
  setCongDoanMo: (v: boolean) => void;
  customerOptions: { id: string; customer_code: string; name: string }[];
  setCustomerOptions: (v: { id: string; customer_code: string; name: string }[]) => void;
  styles: StyleRow[];
  poRows: PoRow[];
  poOptions: PoOption[];
  samByOrder: Record<string, number | null>;
  customers: CustomerRow[];
  reloadRfq: () => void;
  reloadCosting: () => void;
  loadTab: (k: TabKey, force?: boolean) => Promise<void>;
  refresh: () => void;
  po360: { id: string; no: string } | null;
  setPo360: (v: { id: string; no: string } | null) => void;
  loadCc: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  openPo: (orderId: string, poNumber: string) => void;
  goTab: (t: TabKey) => void;
}) {
  return (
    <>
      {/* ── Các hộp thoại tạo mới ──────────────────────────────────────── */}
      <CustomerFormDialog
        open={p.dialog === 'customers'}
        onClose={() => p.setDialog(null)}
        onCreated={async () => {
          await p.loadTab('customers', true);
          p.setCustomerOptions(await listCustomerOptionsClient());
        }}
      />
      <InquiryFormDialog
        open={p.dialog === 'rfq'}
        customers={p.customerOptions}
        onClose={() => p.setDialog(null)}
        onCreated={p.reloadRfq}
      />
      <CostingFormDialog
        open={p.dialog === 'costing'}
        customers={p.customerOptions}
        styles={p.styles}
        onClose={() => p.setDialog(null)}
        onCreated={p.reloadCosting}
      />
      {/* 🔴 Tính giá theo công đoạn — Board 06/08/2026. Dùng chung state
          `dialog` nhưng khoá riêng, để nút "Tạo bản chiết tính" (nhập tay) và
          nút "Tính theo công đoạn" ⛔ không giành nhau một ô nhớ. */}
      <CostingByOperationsDialog
        open={p.congDoanMo}
        customers={p.customerOptions}
        onClose={() => p.setCongDoanMo(false)}
        onDone={p.reloadCosting}
      />
      <PoFormDialog open={p.dialog === 'po'} onClose={() => p.setDialog(null)} onCreated={p.refresh} />
      <StyleFormDialog open={p.dialog === 'styles'} onClose={() => p.setDialog(null)} onCreated={p.refresh} />
      <MaterialRequestDialog open={p.dialog === 'materials'} onClose={() => p.setDialog(null)} onDone={p.refresh} pos={p.poOptions} />
      <ProductionOrderDialog open={p.dialog === 'production'} onClose={() => p.setDialog(null)} onDone={p.refresh} pos={p.poOptions} />
      <ShipmentFormDialog open={p.dialog === 'shipments'} onClose={() => p.setDialog(null)} onDone={p.refresh} pos={p.poOptions} />

      {/* ── Sinh tự động ───────────────────────────────────────────────── */}
      <MaterialGenDialog
        open={p.autoDialog === 'material'}
        pos={p.poRows}
        onClose={() => p.setAutoDialog(null)}
        onDone={p.refresh}
      />
      <ProductionGenDialog
        open={p.autoDialog === 'production'}
        pos={p.poRows}
        styleSam={p.samByOrder}
        onClose={() => p.setAutoDialog(null)}
        onDone={p.refresh}
      />

      {/*
        Form khách hàng RÚT GỌN đời đầu vẫn được giữ nguyên trong md-forms.tsx
        và mount ở đây để không mất đường cũ; hiện chưa gắn vào nút nào vì form
        đầy đủ ở trên là bản mở rộng của chính nó (có thêm đồng tiền, điều kiện
        giao hàng, điều khoản thanh toán, hạn mức công nợ).
      */}
      <LegacyCustomerFormDialog open={false} onClose={() => {}} onDone={p.refresh} />

      {/* ═══ HIỂN THỊ LŨY TIẾN: xem nhanh PO mà KHÔNG rời màn hình ═══════
          Panel trượt phủ 100% trên điện thoại, ~40% trên màn rộng. Đóng lại
          là mắt đã ở sẵn chỗ cũ trong Command Center, không phải định vị lại
          như khi chuyển trang. */}
      <Po360Sheet
        orderId={p.po360?.id ?? null}
        poNumber={p.po360?.no ?? null}
        onClose={() => {
          p.setPo360(null);
          // Xử lý xong một PO thì việc và cảnh báo liên quan có thể đã đổi
          p.loadCc();
        }}
      />

      <CommandPalette
        open={p.paletteOpen}
        onClose={() => p.setPaletteOpen(false)}
        pos={p.poRows}
        styles={p.styles}
        customers={p.customers}
        onPickPo={p.openPo}
        onPickStyle={() => p.goTab('styles')}
        onPickCustomer={() => p.goTab('customers')}
      />
    </>
  );
}
