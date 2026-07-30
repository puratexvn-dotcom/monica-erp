'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertOctagon, BarChart3, CheckCircle2, Download, Loader2, RefreshCw, TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

import { getCeoReport, type CeoReport } from '@/app/actions/ceo-report';
import { exportNodeAsPng } from '@/lib/export-image';
import { ROLE_LABEL } from '@/lib/rbac';

// ============================================================================
// BÁO CÁO GIÁM ĐỐC HẰNG NGÀY — BẢN CHỤP GỬI ZALO
//
// ─── VÌ SAO KHÔNG DÙNG html2canvas ─────────────────────────────────────────
// html2canvas dựng lại DOM bằng canvas nên hay sai phông chữ tiếng Việt và sai
// gradient. html-to-image dùng SVG foreignObject, giữ đúng CSS thật — đã có
// sẵn trong dự án, không phải thêm phụ thuộc.
//
// ─── BA CẠM BẪY KHI CHỤP ẢNH ───────────────────────────────────────────────
// 1. foreignObject KHÔNG kế thừa nền trong suốt: thiếu backgroundColor là ra
//    ảnh nền đen, chữ tối gần như không đọc được.
// 2. Recharts vẽ bằng SVG có kích thước theo phần trăm; lúc chụp phải để vùng
//    chụp ở bề rộng CỐ ĐỊNH, không thì biểu đồ ra méo hoặc mất hẳn.
// 3. Phải đợi biểu đồ vẽ xong mới chụp. Chụp ngay khi vừa có dữ liệu thì SVG
//    còn rỗng và ảnh ra trắng phần biểu đồ.
//
// ─── VÌ SAO CON SỐ NÀO CŨNG CÓ THỂ LÀ "—" ──────────────────────────────────
// Ảnh này gửi thẳng cho giám đốc và nằm lại vĩnh viễn trong nhóm chat. Một số 0
// hiện ra khi thật ra là lỗi quyền thì không ai phát hiện được nữa.
// ============================================================================

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const dash = (n: number | null) => (n === null ? '—' : nf.format(n));

const PIE_COLORS = ['#059669', '#e11d48'];

const LEVEL_STYLE = {
  OK: { card: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-900', icon: CheckCircle2, iconCls: 'text-emerald-600' },
  WARN: { card: 'border-amber-200 bg-amber-50', text: 'text-amber-900', icon: TriangleAlert, iconCls: 'text-amber-600' },
  CRITICAL: { card: 'border-rose-200 bg-rose-50', text: 'text-rose-900', icon: AlertOctagon, iconCls: 'text-rose-600' },
} as const;

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold tabular-nums tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p>
    </div>
  );
}

function Panel({
  title,
  hint,
  error,
  isEmpty,
  emptyText,
  children,
}: {
  title: string;
  hint?: string;
  error?: string | null;
  isEmpty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-slate-600">{title}</h4>
      {hint && <p className="mb-1 mt-0.5 text-[10px] text-slate-400">{hint}</p>}
      {error ? (
        <p className="flex h-[180px] items-center justify-center rounded-lg bg-rose-50/60 px-3 text-center text-xs font-semibold text-rose-700">
          {error}
        </p>
      ) : isEmpty ? (
        <div className="flex h-[180px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 text-center">
          <BarChart3 className="h-10 w-10 text-slate-200" strokeWidth={1.25} aria-hidden="true" />
          <p className="text-[11px] text-slate-400">{emptyText ?? 'Chưa có số liệu'}</p>
        </div>
      ) : (
        <div className="h-[180px]">{children}</div>
      )}
    </section>
  );
}

export default function CeoReportPanel({ onBusyChange }: { onBusyChange?: (busy: boolean) => void }) {
  const [data, setData] = useState<CeoReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    void getCeoReport().then((d) => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const vnNow = data ? new Date(data.generatedAt) : new Date();
  const dateLabel = vnNow.toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
  });
  const timeLabel = vnNow.toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false,
  });

  async function exportImage() {
    const node = captureRef.current;
    if (!node) {
      toast.error('Không tìm thấy vùng cần chụp');
      return;
    }
    // Khối đang ẩn hoặc cao bằng 0 thì html-to-image trả về ảnh rỗng mà không
    // báo lỗi. Chặn trước để thông báo nói đúng nguyên nhân.
    if (node.offsetHeight === 0 || node.offsetWidth === 0) {
      toast.error('Chưa chụp được', {
        description: 'Bảng báo cáo chưa hiện xong. Hãy đợi số liệu tải rồi bấm lại.',
      });
      return;
    }

    setExporting(true);
    onBusyChange?.(true);
    try {
      const name = `bao-cao-giam-doc-${data?.generatedAt.slice(0, 10) ?? 'hom-nay'}.png`;
      const res = await exportNodeAsPng(node, name);
      if (res.ok) {
        toast.success(res.openedInTab ? 'Ảnh đã mở ở tab mới' : 'Đã lưu ảnh báo cáo', {
          description: res.message,
        });
      } else {
        toast.error('Không xuất được ảnh', { description: res.message, duration: 9000 });
      }
    } finally {
      setExporting(false);
      onBusyChange?.(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="text-sm font-medium">Đang tổng hợp số liệu toàn nhà máy...</span>
      </div>
    );
  }
  if (!data) return null;

  const k = data.kpi;
  const onTime = data.delivery.find((d) => d.name === 'Giao đúng hạn')?.value ?? 0;
  const onTimeRate = data.deliveryBase > 0 ? (onTime / data.deliveryBase) * 100 : null;

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <p className="text-[11px] font-semibold text-slate-500">
          Số liệu chốt lúc {timeLabel} giờ Việt Nam
        </p>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Tính lại
        </button>
      </div>

      {/* ── VÙNG ĐƯỢC CHỤP ─────────────────────────────────────────────────
          Mọi thứ trong khối này sẽ vào ảnh. Nút bấm và thanh công cụ để NGOÀI
          — ảnh báo cáo có nút "Tính lại" nhìn rất nghiệp dư. */}
      <div ref={captureRef} className="bg-white p-4">
        {/* Đầu báo cáo */}
        <div className="mb-4 flex items-start justify-between gap-3 border-b-2 border-indigo-600 pb-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
              Monica Garment ERP
            </p>
            <h3 className="mt-0.5 text-lg font-extrabold leading-tight tracking-tight text-slate-900">
              Báo cáo điều hành hằng ngày
            </h3>
            <p className="mt-0.5 text-xs capitalize text-slate-500">
              {dateLabel} · {timeLabel}
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-right">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-200">Người lập</p>
            <p className="text-xs font-bold text-white">
              {data.role ? ROLE_LABEL[data.role] : 'Không rõ'}
            </p>
          </div>
        </div>

        {/* Bốn chỉ số đầu */}
        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Metric
            label="Đơn đang chạy"
            value={dash(k.runningOrders)}
            sub={k.runningQuantity === null ? 'chưa đọc được' : `${nf.format(k.runningQuantity)} sản phẩm`}
          />
          <Metric
            label={`Giá trị đang chạy (${k.currency})`}
            value={k.runningValue === null ? '—' : nf.format(k.runningValue)}
            sub={
              k.ordersWithoutPrice === null
                ? 'chưa đọc được'
                : k.runningValue === null
                  ? `${k.ordersWithoutPrice} đơn đang chạy đều chưa nhập đơn giá`
                  : k.ordersWithoutPrice > 0
                    ? `chưa gồm ${k.ordersWithoutPrice} đơn thiếu đơn giá`
                    : 'đã gồm mọi đơn đang chạy'
            }
          />
          <Metric
            label="Tỷ lệ giao đúng hạn"
            value={onTimeRate === null ? '—' : `${nf2.format(onTimeRate)}%`}
            sub={data.deliveryBase === 0 ? 'chưa đơn nào tới hạn' : `trên ${data.deliveryBase} đơn đã tới hạn`}
          />
          <Metric
            label="Mốc tiến độ trễ"
            value={dash(data.risks.find((r) => r.key === 'SCHEDULE')?.count ?? null)}
            sub={data.risks.find((r) => r.key === 'SCHEDULE')?.detail ?? ''}
          />
        </div>

        {/* Hai biểu đồ chính */}
        <div className="mb-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
          <Panel
            title="Giá trị đơn giao theo tháng"
            hint={`6 tháng gần nhất, đơn vị ${k.currency} — chỉ cộng đơn đã có đơn giá`}
            error={data.errors.orders}
            isEmpty={data.revenue.every((r) => r.value === 0)}
            emptyText="Chưa đơn nào có đơn giá trong 6 tháng gần đây"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenue} margin={{ top: 4, right: 6, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={52}
                  tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
                <Tooltip
                  formatter={(v: unknown) => [`${nf.format(Number(v))} ${k.currency}`, 'Giá trị']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="value" name="Giá trị" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel
            title="Giao đúng hạn so với trễ"
            hint="chỉ tính các đơn ĐÃ tới ngày giao"
            error={data.errors.orders}
            isEmpty={data.deliveryBase === 0}
            emptyText="Chưa đơn nào tới ngày giao"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.delivery} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="78%" paddingAngle={2}>
                  {data.delivery.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown, n: unknown) => [`${nf.format(Number(v))} đơn`, String(n)]}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        {/* Ba nhóm cảnh báo rủi ro */}
        <section>
          <h4 className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-600">
            Cảnh báo rủi ro nhà máy
          </h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {data.risks.map((r) => {
              const st = LEVEL_STYLE[r.level];
              const Icon = st.icon;
              return (
                <div key={r.key} className={`rounded-xl border p-3 ${st.card}`}>
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 shrink-0 ${st.iconCls}`} aria-hidden="true" />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-700">{r.label}</p>
                  </div>
                  <p className={`mt-1 text-2xl font-extrabold tabular-nums tracking-tight ${st.text}`}>
                    {r.count === null ? '—' : r.key === 'QA' ? `${nf2.format(r.count)}%` : nf.format(r.count)}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-slate-600">{r.detail}</p>
                </div>
              );
            })}
          </div>
        </section>

        <p className="mt-3 border-t border-slate-200 pt-2 text-[9px] leading-relaxed text-slate-400">
          Ảnh xuất tự động từ Monica Garment ERP. Con số hiển thị &quot;—&quot; nghĩa là hệ thống
          KHÔNG đọc được dữ liệu tại thời điểm chốt, không phải bằng không.
        </p>
      </div>

      <div className="px-3 pb-3">
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
              <Download className="h-4 w-4" /> Xuất báo cáo (ảnh)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
