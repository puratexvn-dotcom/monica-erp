'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImageUp, Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { uploadEvidence } from '@/app/actions/upload-action';

// ============================================================================
// UPLOAD ẢNH CHỨNG TỪ CHO FORM
//
// Khác components/quantity-input-with-evidence.tsx: cái đó dành cho khai báo
// sản lượng (có ô số lượng đi kèm), còn cái này chỉ đính kèm tài liệu gốc vào
// một phiếu — hợp đồng, PO của khách, báo giá NPL, packing list...
//
// ─── DÙNG <input capture> CHỨ KHÔNG getUserMedia ─────────────────────────
// getUserMedia đòi HTTPS. Máy tính ở xưởng thường vào bằng IP nội bộ
// (http://192.168.x.x) nên bị chặn thẳng, không có đường lùi. capture mở app
// camera trên điện thoại, tự thành hộp chọn tệp trên máy tính.
//
// ─── UPLOAD NGAY KHI CHỌN ────────────────────────────────────────────────
// Không đợi tới lúc submit form. Mạng ở xưởng chập chờn, upload sớm để lỗi lộ
// ra khi người dùng còn đứng đó chụp lại được, thay vì mất cả form đã điền.
//
// ─── KHÔNG BẮT BUỘC ──────────────────────────────────────────────────────
// Ảnh chứng từ là tuỳ chọn. Chặn cứng sẽ khiến không tạo nổi phiếu khi mạng
// hỏng — mà phiếu là thứ nghiệp vụ cần trước, ảnh có thể bổ sung sau.
// ============================================================================

const MAX_MB = 8;

export default function EvidenceUpload({
  label = 'Ảnh chứng từ',
  hint = 'Tuỳ chọn — hợp đồng, PO của khách, báo giá... Có thể bổ sung sau.',
  folder,
  onChange,
}: {
  label?: string;
  hint?: string;
  /** Thư mục con trong bucket: 'po' | 'material' | 'production' | 'shipment' */
  folder: string;
  /** Trả về đường dẫn trong bucket (không phải URL) để lưu vào DB */
  onChange: (path: string | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [path, setPath] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  // Thu hồi objectURL cũ trước khi tạo mới, và khi component biến mất. Không
  // revoke thì mỗi lần chọn lại giữ thêm vài MB trong bộ nhớ.
  const setPreviewSafely = useCallback((next: string | null) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next;
    setPreview(next);
  }, []);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    // Reset value để chọn lại đúng tệp vừa chọn vẫn phát sinh sự kiện change
    e.target.value = '';
    if (!f) return;

    if (!f.type.startsWith('image/')) {
      setErr('Chỉ nhận tệp ảnh (JPG, PNG, HEIC...)');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErr(`Ảnh vượt ${MAX_MB} MB. Chụp lại ở độ phân giải thấp hơn.`);
      return;
    }

    setErr(null);
    setFileName(f.name);
    setPreviewSafely(URL.createObjectURL(f));
    setPath(null);
    onChange(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('file', f);
      fd.append('folder', folder);
      const res = await uploadEvidence(fd);

      if (!res.ok) {
        setErr(res.message);
        toast.error('Không tải được ảnh chứng từ', { description: res.message });
        return;
      }

      setPath(res.path ?? null);
      onChange(res.path ?? null);
      console.log('[evidence] chứng từ đã lên:', { url: res.url, path: res.path });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định';
      setErr(msg);
      toast.error('Không tải được ảnh chứng từ', { description: msg });
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setPreviewSafely(null);
    setFileName(null);
    setPath(null);
    setErr(null);
    onChange(null);
  }

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>

      {!preview ? (
        <div className="flex gap-2">
          <label className="flex h-[42px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 active:scale-[0.98]">
            <Camera className="h-4 w-4" aria-hidden="true" />
            Chụp ảnh
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPick} />
          </label>

          <label className="flex h-[42px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 active:scale-[0.98]">
            <ImageUp className="h-4 w-4" aria-hidden="true" />
            Chọn tệp
            <input type="file" accept="image/*" className="sr-only" onChange={onPick} />
          </label>
        </div>
      ) : (
        <div
          className={`flex items-center gap-3 rounded-xl border p-2.5 ${
            path ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          {/* <img> vì đây là blob cục bộ, next/image không xử lý được */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Ảnh chứng từ" className="h-14 w-14 rounded-lg object-cover" />

          <div className="min-w-0 flex-1">
            {uploading ? (
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                Đang tải lên...
              </p>
            ) : path ? (
              <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Đã lưu trên máy chủ
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Chưa lên được máy chủ
              </p>
            )}
            <p className="mt-0.5 truncate text-[11px] text-slate-500">{fileName}</p>
          </div>

          <button
            type="button"
            onClick={clear}
            title="Xoá ảnh"
            className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {err ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-rose-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {err}
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}
