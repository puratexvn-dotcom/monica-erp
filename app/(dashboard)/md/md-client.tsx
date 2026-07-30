'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Building2, PackageSearch, Boxes, Factory, Ship, Plus, RefreshCw, AlertTriangle, Shirt,
  FileQuestion, Calculator, FileText, MessageSquare, ClipboardList, TriangleAlert, History,
  Sparkles, Loader2, ChevronDown,
  type LucideIcon,
} from 'lucide-react';

import { Card, Badge, thCls, tdCls, btnPrimary, btnGhost } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import PoFormDialog from '../orders/po-form-dialog';
import PoList from '@/components/md/po/po-list';
import StyleList from '@/components/md/style/style-list';
import StyleFormDialog from '@/components/md/style/style-form-dialog';
import dynamic from 'next/dynamic';
import CustomerList from '@/components/md/crm/customer-list';
import CustomerFormDialog from '@/components/md/crm/customer-form-dialog';
import InquiryList from '@/components/md/rfq/inquiry-list';
import InquiryFormDialog from '@/components/md/rfq/inquiry-form-dialog';
import CostingList from '@/components/md/costing/costing-list';
import { CostingFormDialog } from '@/components/md/costing/costing-form-dialog';
import DocumentCenter from '@/components/md/collab/document-center';
import CommentCenter from '@/components/md/collab/comment-center';
import ChangeCenter from '@/components/md/collab/change-center';
import ActivityCenter from '@/components/md/collab/activity-center';
import RiskCenter from '@/components/md/collab/risk-center';
import {
  MaterialGenDialog, ProductionGenDialog,
} from '@/components/md/planning/auto-generate-dialogs';
import KpiGrid, { type KpiTarget } from '@/components/md/dashboard/kpi-grid';
import { useMdDashboard } from '@/components/md/dashboard/use-md-dashboard';
import TaskInbox from '@/components/md/command-center/task-inbox';
import ActionablePoList from '@/components/md/command-center/actionable-po';
import CriticalAlerts from '@/components/md/command-center/critical-alerts';
import CommandPalette from '@/components/md/command-palette';
import Po360Sheet from '@/components/md/po/po-360-sheet';
import type { CommandCenterData } from './_services/command-center.service';
import type {
  PoRow, StyleRow, CustomerRow, InquiryRow, CostingRow, ActivityRow,
} from '@/schemas/md';
import type {
  DocumentCenterRow, CommentCenterRow, ChangeCenterRow, RiskCenterRow,
} from './_services/collaboration.service';
import type { PoOption } from './md-types';
import { loadMdSnapshot, type MdSnapshot } from './md-actions';
import { listPoRowsClient, listStylesClient } from './_actions/md360.client';
import {
  listCustomersClient, listInquiriesClient, listCostingsClient,
  listDocumentsClient, listCommentsClient, listChangeRequestsClient,
  listActivityClient, listRisksClient, listCustomerOptionsClient,
  getCommandCenterClient,
} from './_actions/md4.client';
import {
  CustomerFormDialog as LegacyCustomerFormDialog,
  MaterialRequestDialog, ProductionOrderDialog, ShipmentFormDialog,
} from './md-forms';
import {
  MATERIAL_CATEGORY_LABEL, MR_STATUS_LABEL, PROD_STATUS_LABEL,
  type MaterialCategory,
} from './md-schema';

// ============================================================================
// BÀN LÀM VIỆC MERCHANDISER — TRUNG TÂM QUẢN TRỊ VÒNG ĐỜI ĐƠN HÀNG
//
// ─── BA NHÓM, MƯỜI BA TAB ────────────────────────────────────────────────
// THƯƠNG MẠI: khách hàng → yêu cầu báo giá → chiết tính giá
// TRIỂN KHAI: mã hàng → đơn hàng → vật tư → sản xuất → giao hàng
// PHỐI HỢP:   tài liệu · thảo luận · thay đổi · rủi ro · nhật ký
// Xếp đúng thứ tự vòng đời thật, đọc từ trái sang phải là đi hết một đơn hàng
// từ lúc khách hỏi giá tới lúc lên tàu.
//
// ─── VÌ SAO NẠP DỮ LIỆU THEO TAB ─────────────────────────────────────────
// Mười ba tab mà nạp hết một lượt là mười ba nhóm truy vấn cho mỗi lần mở
// trang, trong khi người dùng thường chỉ làm việc trên hai ba tab. Mỗi tab tự
// nạp lần đầu được mở, sau đó giữ lại trong bộ nhớ cho tới khi bấm Tải lại.
//
// ─── HAI LỐI TẠO Ở TAB VẬT TƯ VÀ SẢN XUẤT ────────────────────────────────
// "Sinh tự động" lấy định mức và SAM có sẵn để tính ra; "Tạo thủ công" giữ
// nguyên đường cũ cho các trường hợp ngoại lệ. Không bỏ đường cũ đi.
// ============================================================================

// Thư viện biểu đồ nặng gần 100 kB. Tách thành gói riêng, tải sau khi trang đã
// dùng được: mạng ở xưởng chậm, không nên bắt chờ biểu đồ mới bấm được vào tab.
// Khối chỉ số KHÔNG nằm trong gói này — nó không đụng tới thư viện biểu đồ.
const MdCharts = dynamic(() => import('@/components/md/dashboard/md-dashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-12 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="text-sm font-medium">Đang tải biểu đồ...</span>
    </div>
  ),
});

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

type TabKey =
  | 'customers' | 'rfq' | 'costing'
  | 'styles' | 'po' | 'materials' | 'production' | 'shipments'
  | 'documents' | 'comments' | 'changes' | 'risks' | 'audit';

interface TabDef {
  key: TabKey;
  label: string;
  short: string;
  icon: LucideIcon;
  group: 'Thương mại' | 'Triển khai' | 'Phối hợp';
}

const TABS: TabDef[] = [
  { key: 'customers', label: 'Khách hàng', short: 'Khách', icon: Building2, group: 'Thương mại' },
  { key: 'rfq', label: 'Yêu cầu báo giá', short: 'Báo giá', icon: FileQuestion, group: 'Thương mại' },
  { key: 'costing', label: 'Chiết tính giá', short: 'Chiết tính', icon: Calculator, group: 'Thương mại' },
  { key: 'styles', label: 'Mã hàng', short: 'Mã hàng', icon: Shirt, group: 'Triển khai' },
  { key: 'po', label: 'Đơn hàng (PO)', short: 'PO', icon: PackageSearch, group: 'Triển khai' },
  { key: 'materials', label: 'Vật tư', short: 'Vật tư', icon: Boxes, group: 'Triển khai' },
  { key: 'production', label: 'Sản xuất', short: 'Sản xuất', icon: Factory, group: 'Triển khai' },
  { key: 'shipments', label: 'Giao hàng', short: 'Giao', icon: Ship, group: 'Triển khai' },
  { key: 'documents', label: 'Tài liệu', short: 'Tài liệu', icon: FileText, group: 'Phối hợp' },
  { key: 'comments', label: 'Thảo luận', short: 'Thảo luận', icon: MessageSquare, group: 'Phối hợp' },
  { key: 'changes', label: 'Yêu cầu thay đổi', short: 'Thay đổi', icon: ClipboardList, group: 'Phối hợp' },
  { key: 'risks', label: 'Rủi ro', short: 'Rủi ro', icon: TriangleAlert, group: 'Phối hợp' },
  { key: 'audit', label: 'Nhật ký', short: 'Nhật ký', icon: History, group: 'Phối hợp' },
];

const GROUPS = ['Thương mại', 'Triển khai', 'Phối hợp'] as const;

function fmtDate(v: string | null): string {
  if (!v) return '—';
  const [y, m, d] = v.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Nhãn nút tạo mới của từng tab. Tab nào không tạo trực tiếp được thì để null
 *  và ẩn nút — hiện một nút bấm vào không làm gì là tệ hơn không có nút. */
const CREATE_LABEL: Record<TabKey, string | null> = {
  customers: 'Thêm khách hàng',
  rfq: 'Nhận yêu cầu báo giá',
  costing: 'Tạo bản chiết tính',
  styles: 'Tạo mã hàng',
  po: 'Tạo PO',
  materials: 'Tạo thủ công',
  production: 'Tạo thủ công',
  shipments: 'Tạo lệnh giao hàng',
  documents: null,
  comments: null,
  changes: null, // có nút riêng bên trong màn hình
  risks: null,
  audit: null,
};

export default function MdClient({
  initialSnapshot,
  initialPoRows,
  initialPoError,
  initialStyles,
  initialStyleError,
  poOptions,
}: {
  initialSnapshot: MdSnapshot;
  initialPoRows: PoRow[];
  initialPoError: string | null;
  initialStyles: StyleRow[];
  initialStyleError: string | null;
  poOptions: PoOption[];
}) {
  const [tab, setTab] = useState<TabKey>('po');
  const [snap, setSnap] = useState(initialSnapshot);
  const [poRows, setPoRows] = useState(initialPoRows);
  const [poError, setPoError] = useState(initialPoError);
  const [styles, setStyles] = useState(initialStyles);
  const [styleError, setStyleError] = useState(initialStyleError);
  const [dialog, setDialog] = useState<TabKey | null>(null);
  const [autoDialog, setAutoDialog] = useState<'material' | 'production' | null>(null);
  const [pending, startTransition] = useTransition();

  // Số liệu tổng quan nạp MỘT LẦN, dùng cho cả khối chỉ số lẫn khối biểu đồ
  const dashboard = useMdDashboard();

  // ─── COMMAND CENTER ──────────────────────────────────────────────────────
  const [cc, setCc] = useState<CommandCenterData | null>(null);
  const loadCc = useCallback(() => {
    void getCommandCenterClient().then(setCc);
  }, []);
  useEffect(loadCc, [loadCc]);

  // PO 360° mở từ BẤT KỲ đâu: một việc trong hộp việc, một dòng PO, một cảnh
  // báo, hay kết quả tìm nhanh. Giữ state ở đây để mọi chỗ dùng chung một panel
  // thay vì mỗi khu tự dựng một cái.
  const [po360, setPo360] = useState<{ id: string; no: string } | null>(null);
  const openPo = useCallback((orderId: string, poNumber: string) => {
    setPo360({ id: orderId, no: poNumber });
  }, []);

  // Khu làm việc cũ (13 tab + biểu đồ) mặc định gấp lại: chúng vẫn ở đó,
  // nhưng không tranh chỗ với ba khu điều hành.
  const [workAreaOpen, setWorkAreaOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ctrl+K / Cmd+K mở tìm nhanh. Chặn hành vi mặc định của trình duyệt
  // (Chrome dùng phím này cho thanh địa chỉ).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    // Nút tìm kiếm trên thanh đầu trang nằm ở cây component khác (layout), nên
    // nó gọi qua một sự kiện trên window thay vì truyền prop.
    const onAsk = () => setPaletteOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('monica:open-palette', onAsk);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('monica:open-palette', onAsk);
    };
  }, []);


  // Thanh tab nằm trên cùng còn khối chỉ số nằm dưới cuối, nên bấm vào một thẻ
  // chỉ số phải cuộn ngược lên — không thì người dùng đổi tab mà màn hình không
  // đổi gì, tưởng nút hỏng.
  const tabBarRef = useRef<HTMLDivElement>(null);
  // Nhận TabKey chứ không riêng KpiTarget: thẻ chỉ số chỉ nhảy tới 5 tab,
  // nhưng bảng lệnh tìm nhanh còn nhảy tới tab Mã hàng và Khách hàng. KpiTarget
  // là tập con của TabKey nên KpiGrid vẫn truyền vào được, không phải ép kiểu.
  const goTab = useCallback((target: TabKey) => {
    setWorkAreaOpen(true);
    setTab(target);
    tabBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // ─── Dữ liệu nạp theo tab ─────────────────────────────────────────────────
  const [customers, setCustomers] = useState<{ rows: CustomerRow[]; error: string | null } | null>(null);
  const [inquiries, setInquiries] = useState<{ rows: InquiryRow[]; error: string | null } | null>(null);
  const [costings, setCostings] = useState<{ rows: CostingRow[]; error: string | null } | null>(null);
  const [documents, setDocuments] = useState<{ rows: DocumentCenterRow[]; error: string | null } | null>(null);
  const [comments, setComments] = useState<{ rows: CommentCenterRow[]; error: string | null } | null>(null);
  const [changes, setChanges] = useState<{ rows: ChangeCenterRow[]; error: string | null } | null>(null);
  const [risks, setRisks] = useState<{ rows: RiskCenterRow[]; error: string | null } | null>(null);
  const [activity, setActivity] = useState<{ rows: ActivityRow[]; error: string | null } | null>(null);
  const [loadingTab, setLoadingTab] = useState(false);

  // Danh sách khách hàng cho các ô chọn trong form báo giá / chiết tính
  const [customerOptions, setCustomerOptions] = useState<
    Array<{ id: string; customer_code: string; name: string }>
  >([]);

  // ─── VÌ SAO SOI TRẠNG THÁI QUA REF ───────────────────────────────────────
  // loadTab cần biết tab nào đã nạp rồi. Nếu đọc thẳng tám biến trạng thái thì
  // chúng phải nằm trong danh sách phụ thuộc, khiến loadTab đổi danh tính sau
  // MỖI lần nạp. loadTab đổi thì refresh đổi, refresh đổi thì mọi bảng con
  // nhận prop mới và vẽ lại — đó chính là cảm giác giật khi chuyển tab.
  // Ref giữ bản sao mới nhất mà không tham gia vào danh tính hàm.
  const loadedRef = useRef<Record<string, boolean>>({});

  /** Nạp dữ liệu của MỘT tab. force = true để bỏ qua bộ nhớ tạm khi bấm Tải lại. */
  const loadTab = useCallback(async (key: TabKey, force = false) => {
    const need = () => force || !loadedRef.current[key];
    const done = () => {
      loadedRef.current[key] = true;
    };
    setLoadingTab(true);
    try {
      switch (key) {
        case 'customers':
          if (need()) { setCustomers(await listCustomersClient()); done(); }
          break;
        case 'rfq':
          if (need()) { setInquiries(await listInquiriesClient()); done(); }
          break;
        case 'costing':
          if (need()) { setCostings(await listCostingsClient()); done(); }
          break;
        case 'documents':
          if (need()) { setDocuments(await listDocumentsClient()); done(); }
          break;
        case 'comments':
          if (need()) { setComments(await listCommentsClient()); done(); }
          break;
        case 'changes':
          if (need()) { setChanges(await listChangeRequestsClient()); done(); }
          break;
        case 'risks':
          if (need()) { setRisks(await listRisksClient()); done(); }
          break;
        case 'audit':
          if (need()) { setActivity(await listActivityClient()); done(); }
          break;
        default:
          break;
      }
    } finally {
      setLoadingTab(false);
    }
  }, []);

  useEffect(() => {
    void loadTab(tab);
    // Chỉ chạy khi ĐỔI TAB. Đưa loadTab vào danh sách phụ thuộc sẽ chạy lại
    // sau mỗi lần setState của chính nó — thành vòng lặp nạp không dứt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Bảng lệnh tìm cả khách hàng, nên cần danh sách đó dù người dùng chưa mở
  // tab Khách hàng bao giờ. Đặt SAU phần khai báo `customers` — hook đọc biến
  // nào thì biến đó phải được khai trước, không thì vướng vùng chết tạm thời.
  useEffect(() => {
    if (paletteOpen && customers === null) void listCustomersClient().then(setCustomers);
  }, [paletteOpen, customers]);

  // Ô chọn khách hàng cần cho form ở tab Báo giá và Chiết tính
  useEffect(() => {
    if ((tab === 'rfq' || tab === 'costing') && customerOptions.length === 0) {
      void listCustomerOptionsClient().then(setCustomerOptions);
    }
  }, [tab, customerOptions.length]);

  /** Tải lại phần lõi (ảnh chụp + PO + mã hàng) và tab đang mở */
  const refresh = useCallback(async () => {
    const [s, o, st] = await Promise.all([loadMdSnapshot(), listPoRowsClient(), listStylesClient()]);
    setSnap(s);
    setPoRows(o.rows);
    setPoError(o.error);
    setStyles(st.rows);
    setStyleError(st.error);
    await loadTab(tab, true);
  }, [tab, loadTab]);

  const doRefresh = () => startTransition(() => { void refresh(); });

  // Bọc memo chỉ có tác dụng khi PROP ổn định. Hàm mũi tên viết thẳng trong
  // JSX sinh danh tính mới ở mỗi lượt vẽ, làm memo vô hiệu hoàn toàn. Dựng sẵn
  // một hàm tải lại cho mỗi tab, chỉ tạo đúng một lần.
  const reloaders = useMemo(() => {
    const make = (k: TabKey) => () => loadTab(k, true);
    return {
      customers: make('customers'), rfq: make('rfq'), costing: make('costing'),
      documents: make('documents'), comments: make('comments'),
      changes: make('changes'), risks: make('risks'), audit: make('audit'),
    };
  }, [loadTab]);

  // Đếm để hiện trên tab — người dùng biết ngay nhóm nào có việc.
  // Tab chưa nạp thì trả null (ẩn số) chứ không trả 0: hiện 0 khi thật ra
  // chưa đọc sẽ khiến người dùng tưởng là không có dữ liệu.
  const counts: Record<TabKey, number | null> = {
    customers: customers?.rows.length ?? null,
    rfq: inquiries?.rows.length ?? null,
    costing: costings?.rows.length ?? null,
    styles: styles.length,
    po: poRows.length,
    materials: snap.materialRequests.length,
    production: snap.productionOrders.length,
    shipments: snap.shipments.length,
    documents: documents?.rows.length ?? null,
    comments: comments?.rows.length ?? null,
    changes: changes?.rows.length ?? null,
    risks: risks?.rows.length ?? null,
    audit: activity?.rows.length ?? null,
  };

  const errorOf: Record<TabKey, string | null> = {
    customers: customers?.error ?? null,
    rfq: inquiries?.error ?? null,
    costing: costings?.error ?? null,
    styles: styleError,
    po: poError,
    materials: snap.errors.materialRequests,
    production: snap.errors.productionOrders,
    shipments: snap.errors.shipments,
    documents: documents?.error ?? null,
    comments: comments?.error ?? null,
    changes: changes?.error ?? null,
    risks: risks?.error ?? null,
    audit: activity?.error ?? null,
  };

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const createLabel = CREATE_LABEL[tab];

  // Bảng tra SAM theo đơn hàng, để hộp thoại sinh lệnh sản xuất xem trước được
  // số ngày ngay khi người dùng còn đang gõ.
  // Dựng lại mỗi lần vẽ sẽ tạo một đối tượng mới, khiến hộp thoại sinh lệnh
  // sản xuất nhận prop khác nhau ở mọi lượt và vẽ lại vô ích.
  const samByOrder = useMemo(() => {
    const m: Record<string, number | null> = {};
    for (const p of poRows) m[p.id] = p.sam_minutes;
    return m;
  }, [poRows]);

  const Waiting = (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="text-sm font-medium">Đang tải dữ liệu...</span>
    </div>
  );

  return (
    <>
      {/* ═══ BA KHU ĐIỀU HÀNH ════════════════════════════════════════════
          Máy bàn chia hai cột: cột trái rộng gấp rưỡi cho hai khu cần đọc
          kỹ, cột phải cho cảnh báo luôn nằm trong tầm mắt. Điện thoại xếp
          dọc theo đúng thứ tự khẩn: việc phải làm → đơn đang chạy → cảnh
          báo đỏ. */}
      {cc === null ? (
        <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-14 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium">Đang tổng hợp việc cần làm...</span>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <TaskInbox tasks={cc.tasks} error={cc.errors.all} onOpenPo={openPo} />
            <ActionablePoList pos={cc.pos} error={cc.errors.orders} onOpenPo={openPo} />
          </div>
          <div className="lg:col-span-2">
            <CriticalAlerts alerts={cc.alerts} error={cc.errors.all} onOpenPo={openPo} />
          </div>
        </div>
      )}

      {/* ═══ KHU LÀM VIỆC CHI TIẾT — GẤP LẠI ═════════════════════════════
          Mười ba tab nghiệp vụ vẫn còn NGUYÊN VẸN, chỉ là gấp lại để không
          tranh sự chú ý với ba khu điều hành. Mở ra một lần là nhớ trạng
          thái trong suốt phiên làm việc. */}
      <button
        type="button"
        onClick={() => setWorkAreaOpen((v) => !v)}
        aria-expanded={workAreaOpen}
        className="mb-3 flex w-full touch-manipulation items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-300"
      >
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${workAreaOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-800">Khu làm việc chi tiết</span>
          <span className="block truncate text-[11px] text-slate-500">
            13 phân hệ nghiệp vụ · khách hàng, báo giá, chiết tính, mã hàng, PO, vật tư, sản xuất,
            giao hàng, tài liệu, thảo luận, thay đổi, rủi ro, nhật ký
          </span>
        </span>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
          {workAreaOpen ? 'Thu gọn' : 'Mở ra'}
        </span>
      </button>

      {workAreaOpen && (
      <>
      <div ref={tabBarRef} className="-mx-1 mb-5 space-y-2 px-1 pt-1">
        {GROUPS.map((g) => (
          <div key={g} className="flex items-center gap-2">
            <span className="hidden w-24 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400 lg:block">
              {g}
            </span>
            <div
              role="tablist"
              aria-label={`Nhóm ${g}`}
              className="flex flex-1 gap-1.5 overflow-x-auto pb-1"
            >
              {TABS.filter((t) => t.group === g).map((t) => {
                const on = t.key === tab;
                const Icon = t.icon;
                const n = counts[t.key];
                return (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(t.key)}
                    className={`flex shrink-0 touch-manipulation select-none items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition active:scale-95 ${
                      on
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.short}</span>
                    {n !== null && n > 0 && (
                      <span
                        className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                          on ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {n}
                      </span>
                    )}
                    {errorOf[t.key] && (
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700">
            <active.icon className="h-4 w-4 text-blue-500" aria-hidden="true" />
            {active.label}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btnGhost} onClick={doRefresh} disabled={pending}>
              <RefreshCw className={`h-4 w-4 ${pending ? 'animate-spin' : ''}`} /> Tải lại
            </button>

            {/* Hai lối ở tab Vật tư và Sản xuất: sinh tự động hoặc tạo tay */}
            {tab === 'materials' && (
              <button type="button" className={btnPrimary} onClick={() => setAutoDialog('material')}>
                <Sparkles className="h-4 w-4" /> Sinh từ định mức
              </button>
            )}
            {tab === 'production' && (
              <button type="button" className={btnPrimary} onClick={() => setAutoDialog('production')}>
                <Sparkles className="h-4 w-4" /> Sinh từ SAM
              </button>
            )}

            {createLabel && (
              <button
                type="button"
                className={tab === 'materials' || tab === 'production' ? btnGhost : btnPrimary}
                onClick={() => setDialog(tab)}
              >
                <Plus className="h-4 w-4" /> {createLabel}
              </button>
            )}
          </div>
        </div>

        {/* ── NHÓM THƯƠNG MẠI ────────────────────────────────────────── */}
        {tab === 'customers' && (
          <div className="p-4">
            {customers === null ? Waiting : (
              <CustomerList rows={customers.rows} error={customers.error} onRefresh={reloaders.customers} />
            )}
          </div>
        )}

        {tab === 'rfq' && (
          <div className="p-4">
            {inquiries === null ? Waiting : (
              <InquiryList rows={inquiries.rows} error={inquiries.error} onRefresh={reloaders.rfq} />
            )}
          </div>
        )}

        {tab === 'costing' && (
          <div className="p-4">
            {costings === null ? Waiting : (
              <CostingList rows={costings.rows} error={costings.error} onRefresh={reloaders.costing} />
            )}
          </div>
        )}

        {/* ── NHÓM TRIỂN KHAI ────────────────────────────────────────── */}
        {tab === 'styles' && (
          <div className="p-4">
            <StyleList rows={styles} error={styleError} onRefresh={refresh} />
          </div>
        )}

        {tab === 'po' && (
          <div className="p-4">
            <PoList rows={poRows} error={poError} onRefresh={refresh} />
          </div>
        )}

        {tab === 'materials' &&
          (snap.errors.materialRequests ? (
            <ErrorState message={snap.errors.materialRequests} onRetry={() => void refresh()} />
          ) : snap.materialRequests.length === 0 ? (
            <NoData
              title="Chưa có đề nghị mua NPL"
              sub="Bấm Sinh từ định mức để hệ thống tự tính nhu cầu từng loại nguyên phụ liệu theo mã hàng và số lượng đơn."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={thCls}>Số phiếu</th>
                    <th className={thCls}>PO</th>
                    <th className={thCls}>Nguyên phụ liệu</th>
                    <th className={thCls}>Loại</th>
                    <th className={thCls}>Số lượng</th>
                    <th className={thCls}>Cần ngày</th>
                    <th className={thCls}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {snap.materialRequests.map((r) => (
                    <tr key={r.id} className="transition hover:bg-slate-50/70">
                      <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{r.request_no}</td>
                      <td className={`${tdCls} font-mono text-xs text-slate-500`}>{r.po_number ?? '—'}</td>
                      <td className={`${tdCls} font-medium text-slate-800`}>{r.material_name}</td>
                      <td className={`${tdCls} text-xs text-slate-500`}>
                        {MATERIAL_CATEGORY_LABEL[r.category as MaterialCategory] ?? r.category}
                      </td>
                      <td className={`${tdCls} tabular-nums font-semibold`}>
                        {nf.format(r.quantity)} <span className="font-normal text-slate-400">{r.unit}</span>
                      </td>
                      <td className={tdCls}>{fmtDate(r.needed_date)}</td>
                      <td className={tdCls}>
                        <Badge tone={r.status === 'REJECTED' ? 'rose' : r.status === 'RECEIVED' ? 'emerald' : 'indigo'}>
                          {MR_STATUS_LABEL[r.status] ?? r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === 'production' &&
          (snap.errors.productionOrders ? (
            <ErrorState message={snap.errors.productionOrders} onRetry={() => void refresh()} />
          ) : snap.productionOrders.length === 0 ? (
            <NoData
              title="Chưa có lệnh sản xuất"
              sub="Bấm Sinh từ SAM để tính số ngày sản xuất từ thời gian chuẩn của mã hàng và năng lực chuyền."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={thCls}>Số lệnh</th>
                    <th className={thCls}>PO</th>
                    <th className={thCls}>SL kế hoạch</th>
                    <th className={thCls}>Bắt đầu</th>
                    <th className={thCls}>Tới hạn</th>
                    <th className={thCls}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {snap.productionOrders.map((p) => (
                    <tr key={p.id} className="transition hover:bg-slate-50/70">
                      <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{p.order_no}</td>
                      <td className={`${tdCls} font-mono text-xs text-slate-500`}>{p.po_number ?? '—'}</td>
                      <td className={`${tdCls} tabular-nums font-semibold`}>{nf.format(p.planned_qty)} pcs</td>
                      <td className={tdCls}>{fmtDate(p.start_date)}</td>
                      <td className={tdCls}>{fmtDate(p.due_date)}</td>
                      <td className={tdCls}>
                        <Badge
                          tone={
                            p.status === 'CANCELLED' ? 'rose'
                            : p.status === 'COMPLETED' ? 'emerald'
                            : p.status === 'PENDING' ? 'amber'
                            : 'indigo'
                          }
                        >
                          {PROD_STATUS_LABEL[p.status] ?? p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === 'shipments' &&
          (snap.errors.shipments ? (
            <ErrorState message={snap.errors.shipments} onRetry={() => void refresh()} />
          ) : snap.shipments.length === 0 ? (
            <NoData title="Chưa có lệnh giao hàng" sub="Bấm Tạo lệnh giao hàng để lập lệnh đầu tiên." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className={thCls}>Số lệnh</th>
                    <th className={thCls}>PO</th>
                    <th className={thCls}>Container</th>
                    <th className={thCls}>Cảng đến</th>
                    <th className={thCls}>ETD</th>
                    <th className={thCls}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {snap.shipments.map((s) => (
                    <tr key={s.id} className="transition hover:bg-slate-50/70">
                      <td className={`${tdCls} font-mono font-semibold text-slate-800`}>{s.shipment_no}</td>
                      <td className={`${tdCls} font-mono text-xs text-slate-500`}>{s.po_number ?? '—'}</td>
                      <td className={`${tdCls} font-mono text-xs`}>{s.container_no ?? '—'}</td>
                      <td className={tdCls}>{s.destination_port ?? '—'}</td>
                      <td className={tdCls}>{fmtDate(s.etd_date)}</td>
                      <td className={tdCls}>
                        <Badge tone={s.status === 'DRAFT' ? 'amber' : 'indigo'}>{s.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {/* ── NHÓM PHỐI HỢP ──────────────────────────────────────────── */}
        {tab === 'documents' && (
          <div className="p-4">
            {documents === null ? Waiting : (
              <DocumentCenter rows={documents.rows} error={documents.error} onRefresh={reloaders.documents} />
            )}
          </div>
        )}

        {tab === 'comments' && (
          <div className="p-4">
            {comments === null ? Waiting : (
              <CommentCenter rows={comments.rows} error={comments.error} onRefresh={reloaders.comments} />
            )}
          </div>
        )}

        {tab === 'changes' && (
          <div className="p-4">
            {changes === null ? Waiting : (
              <ChangeCenter
                rows={changes.rows}
                error={changes.error}
                pos={poRows}
                onRefresh={reloaders.changes}
              />
            )}
          </div>
        )}

        {tab === 'risks' && (
          <div className="p-4">
            {risks === null ? Waiting : (
              <RiskCenter rows={risks.rows} error={risks.error} onRefresh={reloaders.risks} />
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div className="p-4">
            {activity === null ? Waiting : (
              <ActivityCenter rows={activity.rows} error={activity.error} onRefresh={reloaders.audit} />
            )}
          </div>
        )}

        {loadingTab && (
          <p className="border-t border-slate-100 px-5 py-2 text-xs text-slate-400">Đang cập nhật...</p>
        )}
      </Card>

      {/* ── TỔNG QUAN ĐIỀU HÀNH + BIỂU ĐỒ: nằm trong khu gấp ─────────── */}
      <div className="mt-6 space-y-6 border-t border-slate-200 pt-6">
        <KpiGrid
          data={dashboard.data}
          loading={dashboard.loading}
          onReload={dashboard.reload}
          onGo={goTab}
        />
        <MdCharts data={dashboard.data} />
      </div>
      </>
      )}

      {/* ── Các hộp thoại tạo mới ──────────────────────────────────────── */}
      <CustomerFormDialog
        open={dialog === 'customers'}
        onClose={() => setDialog(null)}
        onCreated={async () => {
          await loadTab('customers', true);
          setCustomerOptions(await listCustomerOptionsClient());
        }}
      />
      <InquiryFormDialog
        open={dialog === 'rfq'}
        customers={customerOptions}
        onClose={() => setDialog(null)}
        onCreated={reloaders.rfq}
      />
      <CostingFormDialog
        open={dialog === 'costing'}
        customers={customerOptions}
        styles={styles}
        onClose={() => setDialog(null)}
        onCreated={reloaders.costing}
      />
      <PoFormDialog open={dialog === 'po'} onClose={() => setDialog(null)} onCreated={refresh} />
      <StyleFormDialog open={dialog === 'styles'} onClose={() => setDialog(null)} onCreated={refresh} />
      <MaterialRequestDialog open={dialog === 'materials'} onClose={() => setDialog(null)} onDone={refresh} pos={poOptions} />
      <ProductionOrderDialog open={dialog === 'production'} onClose={() => setDialog(null)} onDone={refresh} pos={poOptions} />
      <ShipmentFormDialog open={dialog === 'shipments'} onClose={() => setDialog(null)} onDone={refresh} pos={poOptions} />

      {/* ── Sinh tự động ───────────────────────────────────────────────── */}
      <MaterialGenDialog
        open={autoDialog === 'material'}
        pos={poRows}
        onClose={() => setAutoDialog(null)}
        onDone={refresh}
      />
      <ProductionGenDialog
        open={autoDialog === 'production'}
        pos={poRows}
        styleSam={samByOrder}
        onClose={() => setAutoDialog(null)}
        onDone={refresh}
      />

      {/*
        Form khách hàng RÚT GỌN đời đầu vẫn được giữ nguyên trong md-forms.tsx
        và mount ở đây để không mất đường cũ; hiện chưa gắn vào nút nào vì form
        đầy đủ ở trên là bản mở rộng của chính nó (có thêm đồng tiền, điều kiện
        giao hàng, điều khoản thanh toán, hạn mức công nợ).
      */}
      <LegacyCustomerFormDialog open={false} onClose={() => {}} onDone={refresh} />

      {/* ═══ HIỂN THỊ LŨY TIẾN: xem nhanh PO mà KHÔNG rời màn hình ═══════
          Panel trượt phủ 100% trên điện thoại, ~40% trên màn rộng. Đóng lại
          là mắt đã ở sẵn chỗ cũ trong Command Center, không phải định vị lại
          như khi chuyển trang. */}
      <Po360Sheet
        orderId={po360?.id ?? null}
        poNumber={po360?.no ?? null}
        onClose={() => {
          setPo360(null);
          // Xử lý xong một PO thì việc và cảnh báo liên quan có thể đã đổi
          loadCc();
        }}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        pos={poRows}
        styles={styles}
        customers={customers?.rows ?? []}
        onPickPo={openPo}
        onPickStyle={() => goTab('styles')}
        onPickCustomer={() => goTab('customers')}
      />
    </>
  );
}
