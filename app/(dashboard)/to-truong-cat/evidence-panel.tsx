'use client';

import { useState } from 'react';
import { Camera, CheckCircle2, Copy, ExternalLink } from 'lucide-react';

import { Card } from '@/components/ui';
import QuantityInputWithEvidence, { type EvidenceValue } from '@/components/quantity-input-with-evidence';

// ============================================================================
// KHAI BÁO SẢN LƯỢNG CẮT KÈM ẢNH BẰNG CHỨNG
//
// Ảnh được upload NGAY khi chọn (xem QuantityInputWithEvidence), nên khối này
// chỉ hiển thị kết quả để nghiệm thu: đường dẫn công khai và đường dẫn trong
// bucket.
//
// ─── CHƯA GHI VÀO CƠ SỞ DỮ LIỆU ──────────────────────────────────────────
// Bảng cut_tickets hiện KHÔNG có cột nào để lưu ảnh bằng chứng. Thêm cột là
// đổi schema của phân hệ Cắt — việc đó nằm ngoài phạm vi yêu cầu lần này, và
// làm nửa vời thì tệ hơn không làm. Vì vậy ở đây ảnh đã nằm an toàn trên
// Storage nhưng CHƯA gắn vào phiếu cắt nào.
// Bước tiếp theo: thêm cột evidence_path vào cut_tickets rồi truyền
// value.path xuống createCutTicket.
// ============================================================================

export default function EvidencePanel({ maxPcs }: { maxPcs?: number }) {
  const [value, setValue] = useState<EvidenceValue | null>(null);
  const [copied, setCopied] = useState(false);

  const ready = value?.quantity !== null && value?.quantity !== undefined && Boolean(value?.url);

  async function copyUrl() {
    if (!value?.url) return;
    await navigator.clipboard.writeText(value.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card title="Khai báo sản lượng kèm ảnh bằng chứng" icon={Camera}>
      <div className="space-y-4 p-5">
        <p className="text-sm leading-relaxed text-slate-500">
          Nhập số lượng thực cắt rồi chụp ảnh bàn cắt hoặc bảng ghi tay. Ảnh được tải lên ngay khi
          chọn, không cần bấm gửi.
        </p>

        <QuantityInputWithEvidence
          label="Sản lượng thực cắt"
          unit="pcs"
          max={maxPcs}
          folder="cutting"
          hint="Chụp ảnh bàn cắt hoặc bảng ghi để đối chiếu khi có tranh chấp"
          onChange={setValue}
        />

        {/* Kết quả upload — để nghiệm thu là ảnh đã lên máy chủ thật */}
        {value?.url && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              Ảnh đã lưu trên Supabase Storage
            </p>

            <dl className="mt-3 space-y-2 text-xs">
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-500">
                  Đường dẫn trong bucket
                </dt>
                <dd className="mt-0.5 break-all font-mono text-slate-700">{value.path}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-500">
                  Public URL
                </dt>
                <dd className="mt-0.5 break-all font-mono text-slate-700">{value.url}</dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyUrl()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {copied ? 'Đã sao chép' : 'Sao chép URL'}
              </button>
              <a
                href={value.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                Mở ảnh
              </a>
            </div>
          </div>
        )}

        {/* Nói thẳng giới hạn hiện tại, không để người dùng tưởng đã lưu vào phiếu */}
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
          Ảnh đã nằm trên Storage nhưng <strong>chưa gắn vào phiếu cắt nào</strong>: bảng
          <code className="mx-1 rounded bg-amber-100 px-1 font-mono">cut_tickets</code>
          chưa có cột lưu ảnh. Cần thêm cột <code className="font-mono">evidence_path</code> mới nối
          được vào nghiệp vụ.
          {ready && ' Số lượng và ảnh hiện đã sẵn sàng để truyền xuống khi có cột đó.'}
        </p>
      </div>
    </Card>
  );
}
