'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
// ⚠️ 13 biểu tượng tab + `LucideIcon` đã theo `TABS` sang `md-tabs.ts`. Giữ lại
// ở đây những cái tệp này còn dựng thật — `AlertTriangle` vẫn dùng ở thanh tab.
// `Users` **⛔ đã KHÔNG được dùng TỪ TRƯỚC** đợt tách — gỡ luôn, vì nó nằm đúng
// dòng đang sửa và gỡ nó ⛔ không đổi hành vi.
import {
  Plus, RefreshCw, AlertTriangle, Sparkles, Loader2, Handshake, ArrowUpRight,
} from 'lucide-react';

import { Card, btnPrimary, btnGhost } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import PoFormDialog from '../orders/po-form-dialog';
import PoList from '@/components/md/po/po-list';
import StyleList from '@/components/md/style/style-list';
import StyleFormDialog from '@/components/md/style/style-form-dialog';
import CustomerList from '@/components/md/crm/customer-list';
import CustomerFormDialog from '@/components/md/crm/customer-form-dialog';
import InquiryList from '@/components/md/rfq/inquiry-list';
import InquiryFormDialog from '@/components/md/rfq/inquiry-form-dialog';
import CostingList from '@/components/md/costing/costing-list';
import { CostingFormDialog, CostingByOperationsDialog } from '@/components/md/costing/costing-form-dialog';
import DocumentCenter from '@/components/md/collab/document-center';
import CommentCenter from '@/components/md/collab/comment-center';
import ChangeCenter from '@/components/md/collab/change-center';
import ActivityCenter from '@/components/md/collab/activity-center';
import RiskCenter from '@/components/md/collab/risk-center';
import {
  MaterialGenDialog, ProductionGenDialog,
} from '@/components/md/planning/auto-generate-dialogs';
import { useMdDashboard } from '@/components/md/dashboard/use-md-dashboard';
import MosTaskInbox from '@/components/mos/command-center/mos-task-inbox';
import WorkspaceShell from '@/components/workspace/workspace-shell';
import { VIEC_NHANH_MD } from '@/components/md/command-center/md-quick-actions';
import MosKpiGrid from '@/components/mos/command-center/mos-kpi-grid';
import MosAlertPanel from '@/components/mos/command-center/mos-alert-panel';
import {
  mdTasks, mdKpis, mdAlerts, MD_URGENCY, MD_WATCHING_HINT, MD_TASK_EMPTY_HINT,
  type MdKpiTarget,
} from '@/components/md/command-center/md-feed';
import ActionablePoList from '@/components/md/command-center/actionable-po';
import CommandPalette from '@/components/md/command-palette';
import Po360Sheet from '@/components/md/po/po-360-sheet';
import type { CommandCenterData } from './_services/command-center.service';
import type {
  PoRow, StyleRow, CustomerRow, InquiryRow, CostingRow, ActivityRow,
} from '@/schemas/md';
import type {
  DocumentCenterRow, CommentCenterRow, ChangeCenterRow, RiskCenterRow,
} from './_services/collaboration.service';
import { GROUP_TONE } from '@/components/md/semantic-tone';
// 🔑 Siêu dữ liệu 13 tab dời sang `md-tabs.ts` — Board Directive 06/08/2026 ·
// `KD-4` `TD-39`. Phép dời THUẦN: ⛔ không đổi nghiệp vụ, giao diện hay API.
import {
  TABS, GROUPS, CREATE_LABEL,
  type TabKey,
} from './md-tabs';
import {
  MaterialRequestTable, ProductionOrderTable, ShipmentTable,
} from './md-flow-tables';
import MdOrderJourney from './md-order-journey';
import DailyDigestCard from '@/components/md/dashboard/daily-digest-card';
import type { BaoCaoNgay } from '@/lib/mos/md/daily-digest';
import { vnTodayISO } from '@/lib/mos/po-flow';
import type { Role } from '@/lib/rbac';
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
// ⚠️ Ở LẠI đây, ⛔ không sang `md-tabs.ts`: JSX trạng thái-đang-tải mang
// `text-sm` — nợ chữ `TD-10` đã có. Xem khối chú thích đầu `md-tabs.ts`.
const MdCharts = dynamic(() => import('@/components/md/dashboard/md-dashboard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-12 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="text-sm font-medium">Đang tải biểu đồ...</span>
    </div>
  ),
});

export default function MdClient({
  baoCaoNgay,
  role,
  initialSnapshot,
  initialPoRows,
  initialPoError,
  initialStyles,
  initialStyleError,
  poOptions,
}: {
  baoCaoNgay: BaoCaoNgay;
  role: Role | null;
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

  const [paletteOpen, setPaletteOpen] = useState(false);
  // Màn hình tích công đoạn — mở từ nút riêng ở tab Chiết tính.
  const [congDoanMo, setCongDoanMo] = useState(false);

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

  // Ba khu dùng chung khung MOS; lớp chuyển đổi gắn icon, màu và hành động.
  const ccFeed = useMemo(
    () => (cc === null ? null : { tasks: mdTasks(cc, openPo), alerts: mdAlerts(cc, openPo) }),
    [cc, openPo],
  );
  const kpiCards = useMemo(
    () => (dashboard.data === null ? null : mdKpis(dashboard.data, (t: MdKpiTarget) => goTab(t as TabKey))),
    [dashboard.data, goTab],
  );

  // ─── TÌM NHANH cho ba tab bảng trần (Vật tư · Sản xuất · Giao hàng) ──────
  // Ba tab DUY NHẤT ⛔ không có ô tìm, mà lại là ba bảng DÀI NHẤT khi chạy
  // thật. Lọc trên dữ liệu ĐÃ TẢI, ⛔ không truy vấn lại CSDL.
  // Đổi tab thì xoá từ khoá — giữ lại sẽ khiến tab mới mở ra đã bị lọc sẵn.
  const [q, setQ] = useState('');
  useEffect(() => { setQ(''); }, [tab]);
  const timTrong = useCallback(
    <T,>(rows: T[], truong: (r: T) => (string | null)[]): T[] => {
      const k = q.trim().toLowerCase();
      return k ? rows.filter((r) => truong(r).some((v) => (v ?? '').toLowerCase().includes(k))) : rows;
    },
    [q],
  );

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
    <WorkspaceShell
      moduleKey="merchandising"
      tenModule="Merchandising"
      moTaKey="appDesc.merchandising"
      // Khung KHONG dung ba khoi o day — /md dat KPI BEN TRONG mot tab.
      bocCuc="tuyBien"
      feed={null}
      hanhDongNhanh={VIEC_NHANH_MD}
    >
      {/* ═══ BA KHU ĐIỀU HÀNH ════════════════════════════════════════════
          Máy bàn chia hai cột: cột trái rộng gấp rưỡi cho hai khu cần đọc
          kỹ, cột phải cho cảnh báo luôn nằm trong tầm mắt. Điện thoại xếp
          dọc theo đúng thứ tự khẩn: việc phải làm → đơn đang chạy → cảnh
          báo đỏ. */}
      {/* 🔴 BÁO CÁO NGÀY — đặt TRÊN mọi thứ khác. Board: *"mỗi ngày MD chỉ cần
          kiểm tra lại các báo cáo"* ⇒ đây là thứ đầu tiên phải thấy khi mở máy.
          Trực quan trước: biểu đồ ⇒ cảnh báo ⇒ nhắc việc. */}
      {/* 🔴 BẢN TIN SÁNG CHỈ HIỆN Ở TAB MẶC ĐỊNH — sửa sau đợt rà thực chiến
          06/08/2026.
          
          Trước bản này, **báo cáo ngày + việc cần làm + cảnh báo + 14 đơn đang
          chạy** dựng lại ở **CẢ 13 TAB**. Vào tab "Vật tư" để duyệt một phiếu
          NPL, người dùng phải cuộn qua toàn bộ bản tin sáng đã đọc từ lúc mở
          máy. Đó là **trùng lặp**, ⛔ không phải nhắc nhở.
          
          🔑 Chọn tab nghiệp vụ = đã quyết định làm việc đó. Bản tin lùi thành
          **một dòng tóm tắt** bấm được để quay lại — ⛔ không mất lối vào, chỉ
          thôi chiếm chỗ. */}
      {tab === 'po' ? (
      <div className="mb-5">
        <DailyDigestCard bc={baoCaoNgay} />
      </div>
      ) : (
        <button
          type="button"
          onClick={() => goTab('po')}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left transition hover:border-blue-300"
        >
          <span className="text-sm font-semibold text-slate-700">
            📋 Báo cáo ngày · {baoCaoNgay.canhBao.length} cảnh báo
            {baoCaoNgay.rong ? ' · ⚪ chưa ai báo cáo' : ''}
          </span>
          <span className="text-xs font-bold text-blue-600">Xem ở tab Đơn hàng →</span>
        </button>
      )}

      {tab !== 'po' ? null : cc === null ? (
        <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-14 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium">Đang tổng hợp việc cần làm...</span>
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-3">
            <MosTaskInbox
              title="Việc cần làm hôm nay"
              tasks={ccFeed?.tasks ?? []}
              error={cc.errors.all}
              wording={MD_URGENCY}
              emptyTitle="Không có việc nào tới hạn"
              emptyHint={MD_TASK_EMPTY_HINT}
            />
            <ActionablePoList pos={cc.pos} error={cc.errors.orders} onOpenPo={openPo} />
          </div>
          <div className="lg:col-span-2">
            <MosAlertPanel
              title="Cảnh báo nguy cấp"
              alerts={ccFeed?.alerts ?? []}
              error={cc.errors.all}
              emptyTitle="Không có cảnh báo đỏ nào"
              watchingHint={MD_WATCHING_HINT}
            />
          </div>
        </div>
      )}

      {/* ═══ KHU LÀM VIỆC — 13 TAB NGHIỆP VỤ ════════════════════════════
          Hiện thẳng, KHÔNG bọc trong khối gấp. Trước đây khối này gấp lại để
          nhường chỗ cho ba khu điều hành, nhưng cái giá là mỗi lần muốn mở
          một tab phải bấm thêm một nhát — với người dùng vào đây hàng chục
          lần mỗi ngày thì đó là hàng chục cú bấm thừa.
          Ba khu điều hành ở trên vẫn giữ đúng thứ tự ưu tiên nhờ vị trí, không
          cần phải giấu phần còn lại đi mới nổi bật được. */}
      {/* ⚠️ Thanh tab Ở LẠI đây: nó mang nợ màu/chữ `TD-07`·`TD-10` đã có, dời
          sang tệp mới thì bánh cóc đọc ra là nợ MỚI — xem đầu `md-tabs.ts`. */}
      <div ref={tabBarRef} className="-mx-1 mb-5 space-y-2 px-1 pt-1">
        {GROUPS.map((g) => {
          // Mỗi nhóm một sắc màu riêng — xem bảng GROUP_TONE và số đo tương phản
          // ở components/md/semantic-tone.ts
          const tone = GROUP_TONE[g];
          return (
          <div key={g} className="flex items-center gap-2">
            <span
              className={`hidden w-24 shrink-0 text-right text-[10px] font-bold uppercase tracking-wider lg:block ${tone.label}`}
            >
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
                    // ring-inset thay cho border: viền vẽ vào PHÍA TRONG nên nút
                    // không đổi kích thước giữa hai trạng thái, hàng tab không
                    // nhích qua lại mỗi lần bấm.
                    className={`flex shrink-0 touch-manipulation select-none items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition active:scale-95 ${
                      on ? tone.active : tone.idle
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.short}</span>
                    {n !== null && n > 0 && (
                      <span
                        className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                          on ? tone.countActive : tone.countIdle
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
          );
        })}
      </div>

      {/* ═══ LỐI VÀO MÀN HÌNH PHẦN VIỆC ═════════════════════════════════════
          ⚠️ Route `/md/assignments` tồn tại và có tiêu đề riêng trong
          PAGE_IDENTITY, nhưng TRƯỚC BẢN VÁ NÀY không một `<Link>` hay
          `router.push` nào trong toàn bộ mã giao diện trỏ tới nó — người dùng
          chỉ tới được bằng cách gõ tay địa chỉ. Một màn hình không có đường vào
          là một màn hình không tồn tại đối với người vận hành.

          CỐ Ý KHÔNG thêm tab thứ 14: bố cục 13 tab đã được nghiệm thu, và
          `/md/assignments` là một ROUTE riêng chứ không phải một lát cắt trong
          trang này — nhét nó vào hàng tab sẽ nói dối về hành vi (bấm tab thì
          đổi nội dung tại chỗ, bấm cái này thì chuyển trang). Để riêng một hàng
          ngay dưới thanh tab: thấy ngay, nhưng không giả làm tab. */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href="/md/assignments"
          className="flex touch-manipulation items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-95"
        >
          <Handshake className="h-4 w-4 shrink-0" aria-hidden="true" />
          Phần việc giao đối tác
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
        </Link>
        <span className="text-[11px] font-semibold leading-tight text-slate-400">
          Giao việc cho nhà thầu · theo dõi báo cáo ngày
        </span>
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
          <div className="space-y-3 p-4">
            {/* 🔑 Lối vào chính của chiết tính: TÍCH CÔNG ĐOẠN, ⛔ không phải
                gõ tay từng khoản. Nút nhập tay vẫn còn ở thanh trên cùng cho
                trường hợp ngoại lệ — ⛔ không bỏ đường cũ. */}
            <button type="button" className={btnPrimary} onClick={() => setCongDoanMo(true)}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Tính giá theo công đoạn
            </button>
            {costings === null ? Waiting : (
              <CostingList role={role} rows={costings.rows} error={costings.error} onRefresh={reloaders.costing} />
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
          <div className="space-y-4 p-4">
            {/* 🔑 "Đơn hàng đang ở đâu?" — Board Directive 06/08/2026.
                Đặt TRÊN danh sách: câu hỏi này là câu merchandiser hỏi trước
                khi hỏi "có những đơn nào". */}
            <MdOrderJourney
              pos={poRows}
              // 🔑 Truyền `so` · `moc` · `evidence_path` để cột BẰNG CHỨNG và
              // MỐC có dữ liệu thật — ⛔ không bịa.
              materials={snap.materialRequests.map((r) => ({
                po_number: r.po_number, status: r.status,
                so: r.request_no, moc: r.needed_date, evidence_path: r.evidence_path,
              }))}
              productions={snap.productionOrders.map((p) => ({
                po_number: p.po_number, status: p.status,
                so: p.order_no, moc: p.due_date, evidence_path: p.evidence_path,
              }))}
              shipments={snap.shipments.map((s) => ({
                po_number: s.po_number, status: s.status,
                so: s.shipment_no, moc: s.etd_date, evidence_path: s.evidence_path,
              }))}
              inspections={snap.qaReports}
              today={vnTodayISO()}
              onOpenTab={(t) => goTab(t as TabKey)}
            />
            <PoList rows={poRows} error={poError} onRefresh={refresh} />
          </div>
        )}

        {/* 🔑 Ba bảng dời sang `md-flow-tables.tsx` — Board Directive 06/08/2026
            Step 1. Phép dời thuần; xem khối chú thích đầu tệp đó. */}
        {tab === 'materials' && (
          <MaterialRequestTable
            rows={snap.materialRequests}
            error={snap.errors.materialRequests}
            onRetry={() => void refresh()}
            q={q}
            onQ={setQ}
            onDone={() => void refresh()}
          />
        )}

        {tab === 'production' && (
          <ProductionOrderTable
            rows={snap.productionOrders}
            error={snap.errors.productionOrders}
            onRetry={() => void refresh()}
            q={q}
            onQ={setQ}
            onDone={() => void refresh()}
          />
        )}

        {tab === 'shipments' && (
          <ShipmentTable
            rows={snap.shipments}
            error={snap.errors.shipments}
            onRetry={() => void refresh()}
            q={q}
            onQ={setQ}
            onDone={() => void refresh()}
          />
        )}

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
        <MosKpiGrid
          title="Tổng quan điều hành"
          kpis={kpiCards}
          loading={dashboard.loading}
          onReload={dashboard.reload}
          columns="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
        />
        <MdCharts data={dashboard.data} />
      </div>

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
      {/* 🔴 Tính giá theo công đoạn — Board 06/08/2026. Dùng chung state
          `dialog` nhưng khoá riêng, để nút "Tạo bản chiết tính" (nhập tay) và
          nút "Tính theo công đoạn" ⛔ không giành nhau một ô nhớ. */}
      <CostingByOperationsDialog
        open={congDoanMo}
        customers={customerOptions}
        onClose={() => setCongDoanMo(false)}
        onDone={reloaders.costing}
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
    </WorkspaceShell>
  );
}
