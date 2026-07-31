'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { Download, Loader2, BarChart3, LayoutDashboard, ListOrdered } from 'lucide-react';
import { toast } from 'sonner';

import Sheet from '@/components/sheet';
import DeptReport from '@/components/report/dept-report';
import { getCeoReport, type DeptMetrics } from '@/app/actions/ceo-report';
import { ProgressBar, Badge } from '@/components/ui';
import { ROLE_LABEL, type Role } from '@/lib/rbac';
import { exportNodeAsPng } from '@/lib/export-image';
import { APP_NAME } from '@/lib/brand';

// Recharts nặng gần 100 kB — chỉ tải khi người dùng thật sự mở tab Giám đốc,
// không nhét vào gói chung của mọi trang chỉ vì thanh điều hướng có nút Báo cáo.
const CeoReportPanel = dynamic(() => import('@/components/report/ceo-report'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="text-sm font-medium">Đang tải bảng báo cáo...</span>
    </div>
  ),
});

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

  // Hai chế độ xem. Giám đốc mở là muốn thấy toàn nhà máy; tổ trưởng mở là
  // muốn thấy đúng số của tổ mình. Giữ CẢ HAI thay vì thay thế bản cũ —
  // bảng theo bộ phận vẫn là thứ duy nhất chạy được cho các tổ sản xuất.
  const [view, setView] = useState<'ceo' | 'dept'>('ceo');

  // Số liệu doanh thu / AOV / sản lượng nạp KHI MỞ tab, không nạp sẵn: nút Báo
  // cáo có mặt ở mọi trang, nạp sẵn là tính lại toàn bộ đơn hàng cho mỗi lần
  // mở bất kỳ trang nào.
  const [dept, setDept] = useState<DeptMetrics | null>(null);
  useEffect(() => {
    if (open && view === 'dept' && dept === null) {
      void getCeoReport().then((r) => setDept(r.dept));
    }
  }, [open, view, dept]);

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
    if (!node || node.offsetHeight === 0) {
      toast.error('Chưa chụp được', { description: 'Bảng số liệu chưa hiện xong.' });
      return;
    }

    setExporting(true);
    try {
      const stamp = vnNow.toISOString().slice(0, 10);
      const res = await exportNodeAsPng(node, `bao-cao-${role ?? 'chung'}-${stamp}.png`);
      if (res.ok) {
        toast.success(res.openedInTab ? 'Ảnh đã mở ở tab mới' : 'Đã lưu ảnh báo cáo', {
          description: res.message,
        });
      } else {
        toast.error('Không xuất được ảnh', { description: res.message, duration: 9000 });
      }
    } finally {
      setExporting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Báo cáo"
      subtitle={role ? ROLE_LABEL[role] : 'Chưa xác định bộ phận'}
      side="bottom"
      footer={
        view === 'ceo' ? null : (
        <button
          type="button"
          onClick={() => void exportImage()}
          disabled={exporting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
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
        )
      }
    >
      {/* Chuyển chế độ xem — để NGOÀI vùng chụp, ảnh báo cáo không nên có tab */}
      <div role="tablist" aria-label="Chế độ xem báo cáo" className="flex gap-1.5 border-b border-slate-100 bg-slate-50/70 p-2">
        <button
          type="button"
          role="tab"
          aria-selected={view === 'ceo'}
          onClick={() => setView('ceo')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
            view === 'ceo' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:text-blue-600'
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Báo cáo Giám đốc
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === 'dept'}
          onClick={() => setView('dept')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
            view === 'dept' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:text-blue-600'
          }`}
        >
          <ListOrdered className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Số liệu bộ phận
        </button>
      </div>

      {view === 'ceo' && <CeoReportPanel />}

      {view === 'dept' && (
      /* Vùng được chụp — khoá cùng bề rộng điện thoại như bản Giám đốc để hai
         loại ảnh xuất ra đồng dạng, và để hàm chụp lấy đúng kích thước thật
         (không còn mảng trắng thừa bên phải). */
      <div className="flex justify-center overflow-x-auto px-2 py-2">
      <div ref={captureRef} className="w-[390px] min-w-[390px] shrink-0 overflow-hidden bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-3 border-b-2 border-blue-600 pb-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
              {APP_NAME}
            </p>
            <h3 className="mt-0.5 text-lg font-extrabold leading-tight tracking-tight text-slate-900">
              Số liệu bộ phận
            </h3>
            <p className="mt-0.5 text-xs capitalize text-slate-500">{dateLabel}</p>
          </div>
          <div className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1.5 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-blue-200">Bộ phận</p>
            <p className="text-xs font-bold text-white">{role ? ROLE_LABEL[role] : 'Không rõ'}</p>
          </div>
        </div>

        {dept === null ? (
          <p className="flex items-center justify-center gap-2 py-14 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tính số liệu...
          </p>
        ) : (
          <DeptReport dept={dept} metrics={metrics} />
        )}
      </div>
      </div>
      )}
    </Sheet>
  );
}
