'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileUp, Trash2, Loader2, FileText, ImageIcon } from 'lucide-react';

import { uploadEvidence } from '@/app/actions/upload-action';
import { Field, inputCls, SAC_O } from '@/components/ui';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { DOC_TYPES, DOC_TYPE_LABEL, type DocType } from '@/schemas/md';

// ============================================================================
// 🔴 ĐÍNH KÈM HÌNH ẢNH & TÀI LIỆU CHO PO — Board 08/08/2026
//
//   > *"Trong tạo PO phải **thêm được hình ảnh và tài liệu** của PO đó."*
//
// ─── 🔑 VÌ SAO ⛔ KHÔNG DÙNG LẠI `EvidenceUpload` ───────────────────────
// `components/evidence-upload.tsx` nhận **đúng MỘT tệp** và ghi vào một cột
// `evidence_path` duy nhất. Một PO thật mang **nhiều** tệp cùng lúc: ảnh mẫu ·
// PO của khách · bảng màu · packing list. Ép chúng vào một ô là bắt MD chọn
// **giữ tệp nào, bỏ tệp nào** — một lựa chọn ⛔ không nên tồn tại.
//
// ⚠️ `EvidenceUpload` **⛔ KHÔNG bị xoá** *(ràng buộc giao diện #2)*: nó vẫn là
// đường đính kèm của `md-forms.tsx`. Đây là khối thứ hai cho một nhu cầu khác,
// ⛔ không phải bản thay thế.
//
// ─── HAI BƯỚC, VÀ THỨ TỰ LÀ CÓ CHỦ Ý ──────────────────────────────────
//   ① **Tải tệp lên NGAY khi chọn** — mạng ở xưởng chập chờn; lỗi phải lộ ra
//      lúc người dùng còn đứng đó chọn lại được, ⛔ không phải lúc bấm Lưu và
//      mất cả biểu mẫu đã điền.
//   ② **Ghi bản ghi `md_documents` SAU khi PO tạo xong** — lúc tạo, PO ⛔ chưa
//      có `id`, nên ⛔ không có gì để gắn tài liệu vào.
//
// 🔑 Hệ quả phải nói rõ: **hủy biểu mẫu giữa chừng sẽ để lại tệp mồ côi trong
// kho lưu trữ**. Đó là cái giá đã biết của việc tải sớm, và nó rẻ hơn nhiều so
// với việc người dùng mất một biểu mẫu 20 ô vì tệp hỏng lúc bấm Lưu.
//
// ⚠️ **Word/Excel CỐ Ý ⛔ KHÔNG được nhận** — `upload-action.ts` đã chốt: hai
// định dạng đó mang **macro chạy được**, và tệp ở đây được nhà thầu/khách tải
// về mở trên máy họ. Mở allowlist cho chúng là quyết định **bảo mật**, cần
// Board. Ai cần gửi Excel thì xuất PDF.
// ============================================================================

export interface TepDinhKem {
  /** Khoá tạm ở client — ⛔ không phải id trong CSDL, tệp ⛔ chưa có bản ghi. */
  khoa: string;
  path: string;
  title: string;
  size: number;
  mime: string;
  docType: DocType;
}

const NHAN = 'Hình ảnh & tài liệu đính kèm';

/** Đoán loại tài liệu từ MIME. **Gợi ý, ⛔ không phải phán quyết** — người dùng
 *  đổi được ở ô chọn ngay cạnh. Đoán sai mà sửa được thì rẻ hơn bắt khai từ
 *  đầu cho mọi tệp. */
function doanLoai(mime: string): DocType {
  return mime.startsWith('image/') ? 'ARTWORK' : 'OTHER';
}

export default function PoDinhKem({
  ds, onChange,
}: {
  ds: readonly TepDinhKem[];
  onChange: (ds: TepDinhKem[]) => void;
}) {
  const [dangTai, setDangTai] = useState(0);
  const o = useRef<HTMLInputElement>(null);
  const s = SAC_O.sky;

  const chon = useCallback(async (fl: FileList | null) => {
    if (!fl || fl.length === 0) return;
    const files = Array.from(fl);
    setDangTai((n) => n + files.length);
    const them: TepDinhKem[] = [];

    // ⚠️ Tải **tuần tự**, ⛔ không song song: `bodySizeLimit` là 10 MB cho MỖI
    // lời gọi, và mạng xưởng nghẽn thì năm lời gọi cùng lúc hỏng cả năm. Chậm
    // hơn vài giây, đổi lấy việc lỗi chỉ rơi vào đúng tệp gây ra nó.
    for (const f of files) {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('folder', 'po');
      const r = await uploadEvidence(fd);
      setDangTai((n) => n - 1);
      if (!r.ok || !r.path) {
        toast.error(`Không tải được ${f.name}`, { description: r.message });
        continue;
      }
      them.push({
        khoa: `${Date.now()}-${f.name}`,
        path: r.path,
        // Tên tệp gốc dùng làm **tiêu đề tài liệu** — người dùng nhận ra nó,
        // còn tên trong kho lưu trữ là UUID do máy chủ đặt (⛔ không tin tên
        // tệp client gửi lên).
        title: f.name.replace(/\.[^.]+$/, '').slice(0, 200) || 'Tài liệu',
        size: f.size,
        mime: f.type,
        docType: doanLoai(f.type),
      });
    }
    if (them.length) {
      onChange([...ds, ...them]);
      toast.success(`Đã tải lên ${them.length} tệp`);
    }
    if (o.current) o.current.value = '';
  }, [ds, onChange]);

  return (
    <div className="sm:col-span-2">
      {/* ⚠️ Dùng lại `Field` thay vì tự dựng nhãn: bánh cóc `TD-10` bắt đúng
          khi tôi viết `tracking-wide` thẳng ở đây *(nợ chữ phình 111 ⇒ 112)*.
          Bánh cóc **đúng** — và cách sửa là **dùng thành phần đã có**, ⛔ không
          phải thêm tên tệp vào sổ nợ. */}
      <Field label={NHAN}>
      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-3 transition ${s.vong.replace('ring-', 'border-')} ${s.than} hover:opacity-80`}
      >
        <FileUp className={`h-4 w-4 shrink-0 ${s.chu}`} aria-hidden="true" />
        <span className={`${s.chu} ${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>Chọn tệp để tải lên</span>
        <input
          ref={o}
          type="file"
          multiple
          // ⚠️ Danh sách này phải **khớp `ALLOWED_MIME` ở máy chủ**. Rộng hơn
          // thì người dùng chọn được tệp rồi bị máy chủ từ chối — mời họ làm
          // một việc chắc chắn thất bại.
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
          className="sr-only"
          onChange={(e) => void chon(e.target.files)}
        />
      </label>
      <span className={`mt-1 block text-slate-500 ${TYPE.caption}`}>
        Ảnh mẫu · PO của khách · bảng màu · packing list — JPG, PNG, WEBP, HEIC, PDF, tối đa 8 MB mỗi tệp.
        Word/Excel xin xuất PDF trước.
      </span>

      {dangTai > 0 && (
        <p className={`mt-2 flex items-center gap-2 text-slate-500 ${TYPE.caption}`}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Đang tải {dangTai} tệp...
        </p>
      )}

      </Field>

      {ds.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {ds.map((t) => {
            const Icon = t.mime.startsWith('image/') ? ImageIcon : FileText;
            return (
              <li key={t.khoa} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <span className={`min-w-0 flex-1 truncate text-slate-700 ${TYPE.caption}`}>
                  {t.title}
                  <span className="ml-1.5 text-slate-400">{(t.size / 1024 / 1024).toFixed(1)} MB</span>
                </span>
                {/* Loại tài liệu **đổi được**: đoán từ MIME chỉ là gợi ý, và
                    một ảnh có thể là bảng màu, artwork hay ảnh mẫu duyệt. */}
                <select
                  className={`${inputCls} w-auto shrink-0 py-1`}
                  value={t.docType}
                  onChange={(e) => onChange(ds.map((x) =>
                    x.khoa === t.khoa ? { ...x, docType: e.target.value as DocType } : x))}
                  aria-label={`Loại tài liệu của ${t.title}`}
                >
                  {DOC_TYPES.map((d) => <option key={d} value={d}>{DOC_TYPE_LABEL[d]}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => onChange(ds.filter((x) => x.khoa !== t.khoa))}
                  aria-label={`Gỡ ${t.title}`}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
