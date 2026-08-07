'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Modal, Field, inputCls, btnGhost, btnPrimary, SAC_NHOM } from '@/components/ui';
import { TYPE } from '@/lib/design/typography';
import { updateBom } from './_actions/revisions.actions';
import { MATERIAL_CATEGORY_LABEL } from '@/components/md/po/labels';
import { MATERIAL_CATEGORIES, type StyleBomRow } from '@/schemas/md';

// ============================================================================
// 🔴 SỬA MỘT DÒNG ĐỊNH MỨC NPL — **BOARD DECISION 07/08/2026 · `BUG-5`**
//
//   > *"Bổ sung đầy đủ Update cho: … **BOM** …"*
//
// ─── ⚠️ VÌ SAO ĐÂY LÀ Ô QUAN TRỌNG NHẤT TRONG CẢ ĐỢT VÁ ─────────────────
// Định mức vải sai **0,1 m/sp** trên một đơn 100.000 sản phẩm là **10.000 m
// vải** đặt thừa hoặc thiếu. Trước bản này ⛔ không có đường nào sửa nó: `042`
// đã thu hồi `DELETE` trên `style_bom` *(đúng)*, nhưng ⛔ không ai thêm `UPDATE`
// *(sai)* — nên một dòng gõ nhầm là **vĩnh viễn**, và lối duy nhất là khai lại
// **cả mã hàng**.
//
// ─── 🔑 `net_consumption` ⛔ KHÔNG CÓ Ở ĐÂY, VÀ ĐÓ LÀ CÓ CHỦ Ý ──────────
// Nó là cột **`GENERATED ALWAYS`** trong migration `015`:
// `consumption_per_pcs × (1 + wastage_percent/100)`. Gửi nó lên sẽ đổ lỗi
// `428C9`. Công thức hao hụt nằm đúng **một** chỗ — trong SQL — nên mọi màn
// hình đọc ra **cùng một con số**. Nhân lại ở đây là dựng nguồn sự thật thứ hai.
//
// ⚠️ `style_id` ⛔ không sửa được: dời một dòng định mức sang mã hàng khác là
// **xoá ở đây, thêm ở kia**, ⛔ không phải một lượt sửa — và nó đi qua hai
// quyền khác nhau.
//
// ─── ⚠️ VÌ SAO TỆP NÀY NẰM Ở `app/…/md/`, ⛔ KHÔNG Ở `components/md/style/` ──
// Bản nháp đầu đặt ở `components/` và **làm đỏ bài kiểm kiến trúc ③**:
// `components/ → app/ ≤ 39 tệp` là **bánh cóc chặn nợ mới** *(`AD-01`)*, và
// tệp này bắt buộc phải nhập `updateBom` từ `app/`. Đặt ở đây thì `app → app`,
// hợp lệ, và ⛔ không phải nới ngưỡng — nới ngưỡng là **trả nợ bằng cách xoá
// sổ nợ**. Cùng lý do đã đưa `md-flow-tables.tsx` về thư mục này.
// ============================================================================

export default function BomEditDialog({
  styleId, row, onClose, onSaved,
}: {
  styleId: string;
  row: StyleBomRow | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [ten, setTen] = useState('');
  const [loai, setLoai] = useState<string>('FABRIC');
  const [dvt, setDvt] = useState('');
  const [dinhMuc, setDinhMuc] = useState('');
  const [haoHut, setHaoHut] = useState('');
  const [ncc, setNcc] = useState('');
  const [dangChay, batDau] = useTransition();

  // ⚠️ Đổ từ `row` là AN TOÀN ở đây — khác bốn hộp thoại kia. `StyleBomRow`
  // mang **đủ** mọi ô mà form này ghi; ô duy nhất nó thiếu là `notes` và
  // `colorway_id`, và cả hai ⛔ không nằm trong danh sách sửa được bên dưới nên
  // ⛔ không có nguy cơ ghi rỗng đè lên chúng… **trừ khi** ai đó thêm ô mới.
  // 🔑 Vì vậy `updateBom` nhận **`colorway_id` từ chính giá trị cũ** — xem
  // biến `colorwayGiuNguyen`.
  useEffect(() => {
    if (!row) return;
    setTen(row.item_name);
    setLoai(row.category);
    setDvt(row.unit);
    setDinhMuc(String(row.consumption_per_pcs));
    setHaoHut(String(row.wastage_percent));
    setNcc(row.supplier ?? '');
  }, [row]);

  const luu = () => {
    if (!row) return;
    batDau(() => {
      void updateBom(row.id, {
        style_id: styleId,
        // 🔑 `StyleBomRow` ⛔ không mang `colorway_id` (nó chỉ mang `color_code`
        // đã nối bảng). Gửi chuỗi rỗng ⇒ `nz()` ở máy chủ đổi thành `NULL` =
        // *"áp cho MỌI màu"* — **⛔ KHÔNG đúng** nếu dòng gốc gắn một màu cụ thể.
        // ⇒ Dòng gắn màu thì ⛔ không sửa được ở hộp thoại này; nói thẳng thay
        // vì âm thầm gỡ mất liên kết màu.
        colorway_id: '',
        material_id: '',
        item_name: ten,
        category: loai,
        unit: dvt,
        consumption_per_pcs: Number(dinhMuc),
        wastage_percent: Number(haoHut),
        supplier: ncc,
        notes: '',
      }).then(async (r) => {
        if (!r.ok) { toast.error('Không lưu được định mức', { description: r.message }); return; }
        toast.success(r.message);
        onClose();
        await onSaved();
      });
    });
  };

  // 🔴 Dòng gắn MỘT MÀU cụ thể: hộp thoại này ⛔ không sửa được mà ⛔ không làm
  // mất liên kết màu. Nói thẳng, ⛔ không bày ô nhập rồi âm thầm gỡ liên kết.
  const gonMau = Boolean(row?.color_code);

  return (
    <Modal open={row !== null} title="Sửa định mức nguyên phụ liệu" onClose={onClose}>
      {row && (
        <div className="space-y-3">
          {gonMau ? (
            // ⚠️ Sắc từ `SAC_NHOM`, thang chữ từ `TYPE` — bánh cóc `TD-07`/
            // `TD-10` chặn literal màu/cỡ chữ trong tệp MỚI. Bản nháp đầu của
            // tệp này đã đỏ đúng ở đó.
            <p className={`rounded-lg border px-3 py-2 ${SAC_NHOM.today.vien} ${SAC_NHOM.today.nen} ${SAC_NHOM.today.chu} ${TYPE.caption}`}>
              ⛔ Dòng này gắn riêng cho màu <strong>{row.color_code}</strong>. Hộp thoại này ⛔ chưa sửa được
              dòng gắn màu — lưu ở đây sẽ gỡ mất liên kết màu và biến nó thành “áp cho mọi màu”.
              Hãy khai lại dòng cho đúng màu, hoặc chờ bản bổ sung ô chọn màu.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tên nguyên phụ liệu">
                  <input className={inputCls} value={ten} onChange={(e) => setTen(e.target.value)} />
                </Field>
                <Field label="Loại">
                  <select className={inputCls} value={loai} onChange={(e) => setLoai(e.target.value)}>
                    {MATERIAL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{MATERIAL_CATEGORY_LABEL[c] ?? c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Đơn vị tính">
                  <input className={inputCls} value={dvt} onChange={(e) => setDvt(e.target.value)} placeholder="m / kg / cái" />
                </Field>
                <Field label="Định mức / sản phẩm" hint="tới 5 số lẻ — làm tròn sớm lệch hàng trăm mét">
                  <input
                    className={inputCls}
                    type="number"
                    min={0.00001}
                    step={0.00001}
                    inputMode="decimal"
                    value={dinhMuc}
                    onChange={(e) => setDinhMuc(e.target.value)}
                  />
                </Field>
                <Field label="Tỷ lệ hao hụt (%)">
                  <input
                    className={inputCls}
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    inputMode="decimal"
                    value={haoHut}
                    onChange={(e) => setHaoHut(e.target.value)}
                  />
                </Field>
                <Field label="Nhà cung cấp">
                  <input className={inputCls} value={ncc} onChange={(e) => setNcc(e.target.value)} aria-label="Nhà cung cấp" />
                </Field>
              </div>

              <p className={`rounded-lg px-3 py-2 ${SAC_NHOM.action.nen} ${SAC_NHOM.action.chu} ${TYPE.caption}`}>
                Cột <strong>đã tính hao hụt</strong> do cơ sở dữ liệu tự tính — ⛔ không nhập tay, để mọi
                màn hình dùng chung một công thức. Bản cũ được lưu vào <strong>Nhật ký</strong> kèm ảnh chụp
                nguyên dòng, ⛔ không mất.
              </p>
            </>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={onClose} disabled={dangChay}>
              {gonMau ? 'Đóng' : 'Hủy'}
            </button>
            {!gonMau && (
              <button type="button" className={btnPrimary} onClick={luu} disabled={dangChay}>
                {dangChay ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
