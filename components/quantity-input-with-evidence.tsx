'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Camera, ImageUp, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

import { inputCls } from '@/components/ui';

// ============================================================================
// Ô NHẬP SỐ LƯỢNG KÈM ẢNH BẰNG CHỨNG
//
// Dùng cho công nhân/tổ trưởng khai báo sản lượng ngay tại xưởng: nhập số rồi
// BẮT BUỘC chụp ảnh bó hàng / bảng ghi để đối chiếu khi có tranh chấp.
//
// ─── VÌ SAO DÙNG <input capture> CHỨ KHÔNG getUserMedia ──────────────────
// getUserMedia mở camera trong trang, nghe hiện đại nhưng ở nhà máy lại kém:
//   • Chỉ chạy trên HTTPS. Máy tính bàn ở xưởng thường vào bằng IP nội bộ
//     (http://192.168.x.x) — getUserMedia bị chặn thẳng, không có đường lùi.
//   • Cần xin quyền camera; công nhân bấm "Chặn" một lần là hỏng vĩnh viễn
//     cho tới khi vào cài đặt trình duyệt sửa lại.
//   • Chất lượng ảnh phụ thuộc canvas, thường tệ hơn app camera của máy.
// <input type="file" accept="image/*" capture="environment"> mở thẳng app
// camera của điện thoại, và trên máy tính tự chuyển thành hộp chọn tệp. Một
// đường code, chạy đúng ở cả hai nơi.
//
// ─── QUẢN LÝ BỘ NHỚ ──────────────────────────────────────────────────────
// Ảnh xem trước tạo bằng URL.createObjectURL, BẮT BUỘC revoke khi đổi ảnh và
// khi unmount. Không revoke thì mỗi lần chụp lại giữ luôn vài MB trong bộ nhớ
// — ca 8 tiếng khai báo liên tục là đủ làm treo máy tính cũ ở xưởng.
// ============================================================================

export interface EvidenceValue {
  quantity: number | null;
  file: File | null;
}

const MAX_MB = 8;

export default function QuantityInputWithEvidence({
  label,
  unit = 'pcs',
  max,
  hint,
  requireEvidence = true,
  onChange,
  error,
}: {
  label: string;
  unit?: string;
  /** Trần cho phép, vd tồn kho hiện có hoặc sản lượng kế hoạch */
  max?: number;
  hint?: string;
  requireEvidence?: boolean;
  onChange?: (v: EvidenceValue) => void;
  /** Lỗi từ tầng ngoài (Zod / máy chủ) */
  error?: string;
}) {
  const id = useId();
  const [qty, setQty] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  // Thu hồi URL cũ trước khi tạo URL mới, và khi component biến mất
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

  const emit = useCallback(
    (nextQty: string, nextFile: File | null) => {
      const n = nextQty === '' ? null : Number(nextQty);
      onChange?.({ quantity: Number.isFinite(n) ? n : null, file: nextFile });
    },
    [onChange],
  );

  function onQtyChange(v: string) {
    setQty(v);
    setLocalError(null);
    const n = Number(v);
    if (v !== '' && (!Number.isFinite(n) || n <= 0)) {
      setLocalError('Số lượng phải lớn hơn 0');
    } else if (max !== undefined && Number.isFinite(n) && n > max) {
      setLocalError(`Không được vượt ${new Intl.NumberFormat('vi-VN').format(max)} ${unit}`);
    }
    emit(v, file);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    // Cho phép chọn lại đúng tệp vừa chọn: nếu không reset value thì trình
    // duyệt coi là "không đổi" và không phát sinh sự kiện change lần hai.
    e.target.value = '';

    if (!f) return;

    if (!f.type.startsWith('image/')) {
      setLocalError('Chỉ nhận tệp ảnh (JPG, PNG, HEIC...)');
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setLocalError(`Ảnh vượt ${MAX_MB} MB. Chụp lại ở độ phân giải thấp hơn.`);
      return;
    }

    setLocalError(null);
    setFile(f);
    setPreviewSafely(URL.createObjectURL(f));
    emit(qty, f);
  }

  function clearPhoto() {
    setFile(null);
    setPreviewSafely(null);
    emit(qty, null);
  }

  const shown = error ?? localError;
  const missingEvidence = requireEvidence && qty !== '' && !file;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            max={max}
            value={qty}
            onChange={(e) => onQtyChange(e.target.value)}
            className={`${inputCls} pr-14 text-lg font-semibold tabular-nums`}
            placeholder="0"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
            {unit}
          </span>
        </div>

        {/* Nút chụp — capture="environment" mở camera sau trên điện thoại */}
        <label
          className="flex h-[42px] shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
          title="Chụp ảnh bằng chứng"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Chụp</span>
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onPick} />
        </label>

        {/* Đường lùi: chọn ảnh có sẵn (máy tính bàn, hoặc đã chụp trước đó) */}
        <label
          className="flex h-[42px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-slate-500 shadow-sm transition hover:bg-slate-50 active:scale-95"
          title="Chọn ảnh từ thiết bị"
        >
          <ImageUp className="h-4 w-4" aria-hidden="true" />
          <input type="file" accept="image/*" className="sr-only" onChange={onPick} />
        </label>
      </div>

      {hint && !shown && <p className="mt-1 text-xs text-slate-400">{hint}</p>}

      {shown && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-rose-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {shown}
        </p>
      )}

      {missingEvidence && !shown && (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-amber-600">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Cần chụp ảnh bằng chứng trước khi gửi
        </p>
      )}

      {/* Ảnh xem trước — dùng <img> vì đây là blob cục bộ, next/image không xử lý */}
      {preview && file && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Ảnh bằng chứng đã chụp" className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Đã có ảnh bằng chứng
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={clearPhoto}
            title="Xoá ảnh và chụp lại"
            className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
