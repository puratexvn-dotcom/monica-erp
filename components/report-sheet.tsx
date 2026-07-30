'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

import Sheet from '@/components/sheet';
import { ProgressBar, Badge } from '@/components/ui';
import { ROLE_LABEL, type Role } from '@/lib/rbac';

// ============================================================================
// BẢNG BÁO CÁO THEO BỘ PHẬN + XUẤT RA ẢNH
//
// ─── VÌ SAO KHÔNG DÙNG THƯ VIỆN BIỂU ĐỒ ──────────────────────────────────
// Biểu đồ ở đây là thanh ngang một trục, vẽ bằng div là đủ và repo đã có sẵn
// ProgressBar trong components/ui.tsx. Kéo thêm recharts (~90 KB gzip) cho mấy
// thanh ngang là phí băng thông của điện thoại ở xưởng, lại thêm một nguồn
// design không khớp hệ màu đang dùng.
//
// ─── VÌ SAO html-to-image CHỨ KHÔNG html2canvas ──────────────────────────
// html2canvas tự dựng lại DOM bằng canvas nên thường xuyên sai font và sai
// gradient. html-to-image dùng SVG foreignObject, giữ đúng CSS thật.
//
// ─── CẠM BẪY KHI XUẤT ẢNH ────────────────────────────────────────────────
// foreignObject KHÔNG kế thừa nền trong suốt: nếu không truyền backgroundColor
// thì ảnh ra nền đen, chữ tối gần như không đọc được. Bắt buộc đặt nền trắng.
// ============================================================================

export interface ReportMetric {
  label: string;
  value: string;
  unit?: string;
  /** Phần trăm hoàn thành, để vẽ thanh tiến độ. Bỏ trống nếu không áp dụng. */
  pct?: number;
  tone?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate';
}

export default function ReportSheet({
  open,
  onClose,
  role,
  metrics,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  metrics: ReportMetric[];
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const vnNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const dateLabel = vnNow.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC', // đã bù 7 giờ ở trên
  });

  async function exportImage() {
    const node = captureRef.current;
    if (!node) return;

    setExporting(true);
    try {
      const dataUrl = await toPng(node, {
        // Nền trắng BẮT BUỘC: foreignObject không kế thừa nền, thiếu là ra ảnh đen
        backgroundColor: '#ffffff',
        // pixelRatio 2 để ảnh còn nét khi xem trên điện thoại màn hình dày đặc
        pixelRatio: 2,
        cacheBust: true,
      });

      const stamp = vnNow.toISOString().slice(0, 10);
      const link = document.createElement('a');
      link.download = `bao-cao-${role ?? 'chung'}-${stamp}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Đã lưu ảnh báo cáo', { description: link.download });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định';
      console.error('[report] xuất ảnh lỗi:', e);
      toast.error('Không xuất được ảnh', { description: msg });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Báo cáo bộ phận"
      subtitle={role ? ROLE_LABEL[role] : 'Chưa xác định bộ phận'}
      side="bottom"
      footer={
        <button
          type="button"
          onClick={() => void exportImage()}
          disabled={exporting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo ảnh...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> Xuất báo cáo thành ảnh
            </>
          )}
        </button>
      }
    >
      {/* Vùng được chụp — mọi thứ trong đây sẽ vào ảnh */}
      <div ref={captureRef} className="bg-white p-5">
        <div className="mb-5 border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
            Monica Garment ERP
          </p>
          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">
            Báo cáo {role ? ROLE_LABEL[role] : 'tổng hợp'}
          </h3>
          <p className="mt-1 text-sm capitalize text-slate-500">{dateLabel}</p>
        </div>

        {metrics.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-400">
            <BarChart3 className="h-8 w-8" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-600">Chưa có số liệu cho bộ phận này</p>
            <p className="max-w-xs text-xs">
              Số liệu xuất hiện khi bộ phận bắt đầu ghi nhận sản lượng trong ngày.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-600">{m.label}</p>
                  <p className="shrink-0 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">
                    {m.value}
                    {m.unit && <span className="ml-1 text-sm font-bold text-slate-400">{m.unit}</span>}
                  </p>
                </div>

                {m.pct !== undefined && (
                  <div className="mt-3">
                    <ProgressBar pct={m.pct} tone={m.tone ?? 'indigo'} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
          <Badge tone="slate">Nguồn: Monica ERP</Badge>
          <span className="text-[11px] text-slate-400">
            Ảnh xuất tự động, dùng để báo cáo nhanh qua Zalo/nhóm nội bộ.
          </span>
        </div>
      </div>
    </Sheet>
  );
}
