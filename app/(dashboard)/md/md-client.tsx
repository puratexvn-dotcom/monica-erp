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
  ChevronDown,
} from 'lucide-react';

import { Card, btnPrimary, btnGhost } from '@/components/ui';
import { NoData, ErrorState } from '@/components/data-state';
import PoFormDialog from '../orders/po-form-dialog';
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
import MosKpiGrid from '@/components/mos/command-center/mos-kpi-grid';
import MosAlertPanel from '@/components/mos/command-center/mos-alert-panel';
import {
  mdTasks, mdKpis, mdAlerts, MD_URGENCY, MD_WATCHING_HINT, MD_TASK_EMPTY_HINT,
  type MdKpiTarget,
} from '@/components/md/command-center/md-feed';
import MdWorkspaceHead from '@/components/md/command-center/md-workspace-head';
import MdDailyFocus from '@/components/md/command-center/md-daily-focus';
import MdTaskSection from '@/components/md/command-center/md-task-section';
import MdHoatDong from '@/components/md/command-center/md-hoat-dong';
import MdOrderCenter from './md-order-center';
import MdDialogs from './md-dialogs';
import MdTabBar from './md-tab-bar';
import KhoiGap from '@/components/ui/khoi-gap';
import { nhoTab, tabDaNho } from './md-tab-memory';
import { O_LAUNCHER_MD } from './md-launcher-items';
import { sinhLichTaChoDonCu } from './_actions/po.actions';
// 🔴 BUG-5 · Board 07/08/2026 — Lưu trữ. Nhập ở ĐÂY rồi truyền xuống bảng;
// xem chú thích tại chỗ dùng, và ở `customer-list.tsx`.
import { archiveCustomer, restoreCustomer, archiveStyle } from './_actions/revisions.actions';
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
  TABS, GROUPS, CREATE_LABEL, TAB_HANG_NGAY,
  type TabKey,
} from './md-tabs';
import {
  MaterialRequestTable, ProductionOrderTable, ShipmentTable,
} from './md-flow-tables';
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
  initialCc,
  initialSnapshot,
  initialPoRows,
  initialPoError,
  initialStyles,
  initialStyleError,
  poOptions,
}: {
  baoCaoNgay: BaoCaoNgay;
  role: Role | null;
  /** Command Center nạp SẴN ở máy chủ — xem chú thích tại `useState` bên dưới. */
  initialCc?: CommandCenterData;
  initialSnapshot: MdSnapshot;
  initialPoRows: PoRow[];
  initialPoError: string | null;
  initialStyles: StyleRow[];
  initialStyleError: string | null;
  poOptions: PoOption[];
}) {
  // Tab đang mở phải sống sót qua lần React dựng lại — lý do đầy đủ và ba
  // phép đo ở `./md-tab-memory.ts` (UAT `BUG-2`).
  const [tab, setTab] = useState<TabKey>(tabDaNho());
  const [snap, setSnap] = useState(initialSnapshot);
  const [poRows, setPoRows] = useState(initialPoRows);
  const [poError, setPoError] = useState(initialPoError);
  const [styles, setStyles] = useState(initialStyles);
  const [styleError, setStyleError] = useState(initialStyleError);
  // 🔴 Board §13: *"Hiển thị 5 Tab đầu + More ▼. ⛔ Không xoá tab."*
  // ⚠️ Tab **đang mở** luôn hiện dù ⛔ không thuộc nhóm hằng ngày — ⛔ không thì
  // người dùng bấm More, chọn một tab, rồi thấy chính tab đó biến mất.
  const [moTabPhu, setMoTabPhu] = useState(false);
  const [dialog, setDialog] = useState<TabKey | null>(null);
  // 🔴 BUG-5 — chế độ **Sửa**. MỘT ô nhớ cho cả năm chứng từ, ⛔ không năm ô;
  // lý lẽ và phép so `tab` ở `md-dialogs.tsx`.
  const [suaId, setSuaId] = useState<{ tab: TabKey; id: string } | null>(null);
  const moSua = useCallback((tab: TabKey, id: string) => {
    setSuaId({ tab, id });
    setDialog(tab);
  }, []);
  const [autoDialog, setAutoDialog] = useState<'material' | 'production' | null>(null);
  const [pending, startTransition] = useTransition();

  // Số liệu tổng quan nạp MỘT LẦN, dùng cho cả khối chỉ số lẫn khối biểu đồ
  const dashboard = useMdDashboard();

  // ─── COMMAND CENTER ──────────────────────────────────────────────────────
  // 🔴 KHỞI TẠO TỪ MÁY CHỦ — sửa lỗi "hiện giao diện CŨ vài giây".
  //
  // Bản trước khởi tạo `null` rồi gọi `getCommandCenterClient()` trong
  // `useEffect` ⇒ HTML đầu tiên ⛔ KHÔNG có ba cột, người dùng thấy khung cũ +
  // thanh tab rồi mới thấy Workspace mới thay vào.
  //
  // 🔑 Đó ⛔ không phải "chậm" — đó là **hai giao diện nối tiếp nhau**. Nay dữ
  // liệu đi cùng HTML, nên **lần vẽ đầu tiên đã là giao diện cuối cùng**.
  const [cc, setCc] = useState<CommandCenterData | null>(initialCc ?? null);

  // 🔑 Ba mảng chứng từ con dựng MỘT LẦN, dùng chung cho Command Center và
  // "Đơn hàng đang ở đâu?". Trước đây chỉ có màn hình hành trình map chúng;
  // nay hai chỗ cùng cần — map hai lần là mở cửa cho **hai kết quả khác nhau
  // trên cùng một màn hình**.
  const ctMaterials = useMemo(() => snap.materialRequests.map((r) => ({
    po_number: r.po_number, status: r.status,
    so: r.request_no, moc: r.needed_date, evidence_path: r.evidence_path,
  })), [snap.materialRequests]);
  const ctProductions = useMemo(() => snap.productionOrders.map((p) => ({
    po_number: p.po_number, status: p.status,
    so: p.order_no, moc: p.due_date, evidence_path: p.evidence_path,
  })), [snap.productionOrders]);
  const ctShipments = useMemo(() => snap.shipments.map((x) => ({
    po_number: x.po_number, status: x.status,
    so: x.shipment_no, moc: x.etd_date, evidence_path: x.evidence_path,
  })), [snap.shipments]);
  // ⚠️ GIỮ hàm nạp lại cho lúc SAU khi ghi. ⛔ Không gọi lúc mở trang: dữ liệu
  // đã đi cùng HTML, gọi thêm là một lượt mạng thừa.
  const loadCc = useCallback(() => {
    void getCommandCenterClient().then(setCc);
  }, []);
  useEffect(() => {
    if (initialCc) return;   // máy chủ đã đưa sẵn ⇒ ⛔ không gọi lại
    loadCc();
  }, [initialCc, loadCc]);

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
    // Ghi vào biến tầm module TRƯỚC khi đổi state: nếu Server Action dựng lại
    // component ngay sau đó, giá trị này là thứ duy nhất còn sống.
    nhoTab(target);
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
  // ⚠️ `useMemo`: bảng này là **phụ thuộc** của `oLauncher` ngay bên dưới.
  // Dựng lại mỗi lần vẽ thì `oLauncher` cũng dựng lại mỗi lần vẽ, và 10 ô
  // Launcher render thừa — ESLint bắt đúng chỗ.
  const counts: Record<TabKey, number | null> = useMemo(() => ({
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
  }), [customers, inquiries, costings, styles.length, poRows.length, snap, documents, comments, changes, risks, activity]);

  // ① BUSINESS IDENTITY — số lấy từ `counts` ĐÃ tính ở trên, ⛔ không truy vấn
  // thêm và ⛔ không dựng bảng đếm thứ hai (hai bảng là hai cơ hội lệch nhau).
  // ⚠️ `customers` ĐÃ có sẵn trong ảnh chụp máy chủ ⇒ dùng nó thay cho bảng
  // đếm theo tab (bảng đó chỉ có số **sau khi** người dùng mở tab). Ô Launcher
  // hiện ⚪ trong khi dữ liệu đã nằm sẵn trên trang là **⚪ sai sự thật**.
  const oLauncher = useMemo(
    () => O_LAUNCHER_MD({ ...counts, customers: counts.customers ?? snap.customers.length }),
    [counts, snap.customers.length],
  );

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
      // 🔴 MẢNG RỖNG — Board Directive 07/08 §2: hành động phải nằm ở **thẻ
      // nổi bật**, ⛔ không phải một dải nút nhỏ. `MdActionCards` đã mang đủ
      // cả hai lối cũ (`/orders` · `/subcon`) nên ⛔ không mất đường vào nào.
      // ⚠️ Tệp `md-quick-actions.ts` **GIỮ NGUYÊN** trong kho (ràng buộc ②) —
      // nó vẫn là khuôn hợp lệ của khung cho phân hệ khác; chỉ `/md` thôi dùng.
      hanhDongNhanh={[]}
      // 🔴 Board §2 + §3 — bỏ tiêu đề lặp và nút "Về Trang chủ" trùng logo.
      an="ca"
    >
      {/* ═══ DNA WORKSPACE — Board Directive 07/08/2026 (MD UX Redesign v2) ═══
          ① Command Center → ② Quick Actions → ③ Risk Center → ④ Business Flow
          → ⑤ Task → ⑥ Data → ⑦ Report.

          🔑 Thứ tự này **là toàn bộ nội dung của chỉ thị**. Board nói rõ MD mở
          MONICA ONE để biết *"hôm nay cần làm gì · vấn đề nào cần xử lý · đơn
          hàng đang ở đâu"* — ⛔ **không** phải để xem dashboard. Nên **danh
          sách PO tụt xuống bậc ⑥**: nó là **dữ liệu chi tiết**, ⛔ không phải
          thứ MD cần thấy đầu tiên.

          ⚠️ Ba khối đầu gom trong `md-workspace-head.tsx` — xem chú thích ở đó
          về lý do (trần 900 dòng của `md-client`, và ba khối phải đổi cùng nhau).

          🔴 BA KHỐI NÀY CHỈ HIỆN Ở TAB MẶC ĐỊNH. Chọn một tab nghiệp vụ = đã
          quyết định làm việc đó; dựng lại cả bản tin sáng ở 13 tab là **trùng
          lặp**, ⛔ không phải nhắc nhở. */}
      {tab !== 'po' ? (
        <button
          type="button"
          onClick={() => goTab('po')}
          className="mb-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left transition hover:border-blue-300"
        >
          <span className="text-sm font-semibold text-slate-700">
            📋 Bàn điều hành · {baoCaoNgay.canhBao.length} vấn đề cần xử lý
            {baoCaoNgay.rong ? ' · ⚪ chưa ai báo cáo' : ''}
          </span>
          <span className="text-xs font-bold text-blue-600">Về bàn điều hành →</span>
        </button>
      ) : cc === null ? (
        <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-14 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm font-medium">Đang tổng hợp việc cần làm...</span>
        </div>
      ) : (
        <MdWorkspaceHead
          pos={poRows}
          materials={ctMaterials}
          productions={ctProductions}
          shipments={ctShipments}
          inspections={snap.qaReports}
          today={vnTodayISO()}
          baoCao={baoCaoNgay}
          tasks={ccFeed?.tasks ?? []}
          alerts={ccFeed?.alerts ?? []}
          loi={cc.errors.all}
          onDi={(d) => goTab(d as TabKey)}
          oLauncher={oLauncher}
          onMoTab={(t) => goTab(t as TabKey)}
          // ⚠️ Sáu hành động ĐÚNG thứ tự Board §2. Mỗi cái mở **đúng chỗ làm
          // việc đó**, ⛔ không chỉ chuyển tab rồi để người dùng tự tìm nút.
          // ⚠️ Ba hành động MỚI (`BUG-1`) mở **đúng chỗ làm việc đó**, ⛔ không
          // chỉ đổi tab. `yeuCauThayDoi` CỐ Ý ⛔ không mở `dialog`: nút tạo nằm
          // bên trong màn hình đó (`CREATE_LABEL.changes === null`), và mở một
          // hộp thoại ⛔ không tồn tại là *"lời nói dối của giao diện"*.
          hanhDong={{
            taoPo: () => setDialog('po'),
            khachHang: () => { goTab('customers'); setDialog('customers'); },
            baoGia: () => { goTab('rfq'); setDialog('rfq'); },
            chietTinh: () => goTab('costing'),
            dinhMuc: () => goTab('styles'),
            techPack: () => goTab('documents'),
            yeuCauNpl: () => { goTab('materials'); setAutoDialog('material'); },
            sanXuat: () => { goTab('production'); setAutoDialog('production'); },
            yeuCauThayDoi: () => goTab('changes'),
          }}
          orderCenter={
            <MdOrderCenter
              pos={poRows}
              materials={ctMaterials}
              productions={ctProductions}
              shipments={ctShipments}
              inspections={snap.qaReports}
              today={vnTodayISO()}
              onOpenTab={(t) => goTab(t as TabKey)}
              poError={poError}
              onRefresh={refresh}
            />
          }
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          🔴 KHU LÀM VIỆC — CHỈ HIỆN KHI ĐÃ RỜI MÀN HÌNH MẶC ĐỊNH
          Board Directive *MD V5* §1:
            > *"Phần kết thúc **ngay sau `Danh sách PO`**."*
          §13: *"⛔ Không để cùng một chức năng xuất hiện lần thứ hai."*

          ─── 🔑 VÌ SAO GẮN CỔNG CHỨ ⛔ KHÔNG XOÁ ────────────────────────
          Trên ảnh Board gửi, mọi thứ dưới `Danh sách PO` đều là **bản thứ hai**
          của thứ đã có ở trên: thanh tab lặp lại 10 ô Business Launcher; thẻ
          *"ĐƠN HÀNG (PO)"* chỉ nói *"hành trình … nằm ở cột giữa phía trên"* —
          một khối tồn tại chỉ để chỉ sang khối khác.

          ⚠️ Nhưng 13 tab **⛔ không phải rác** — chúng là đường vào 13 khu
          nghiệp vụ. Xoá hẳn là mất đường vào *(ràng buộc ②)*. Nên: **màn hình
          mặc định `po` ⛔ không bày chúng**; chọn một ô ở Business Launcher là
          đã tuyên bố *"tôi muốn làm việc đó"* ⇒ khu tab mở ra, kèm nút
          *"Về bàn điều hành"* ở đầu trang để quay lại.

          🔑 Cùng một mã, hai màn hình khác nhau — thay vì hai bản sao. */}
      {tab !== 'po' && (
      <>
      {/* ═══ KHU LÀM VIỆC — 13 TAB NGHIỆP VỤ ════════════════════════════
          Hiện thẳng, KHÔNG bọc trong khối gấp. Trước đây khối này gấp lại để
          nhường chỗ cho ba khu điều hành, nhưng cái giá là mỗi lần muốn mở
          một tab phải bấm thêm một nhát — với người dùng vào đây hàng chục
          lần mỗi ngày thì đó là hàng chục cú bấm thừa.
          Ba khu điều hành ở trên vẫn giữ đúng thứ tự ưu tiên nhờ vị trí, không
          cần phải giấu phần còn lại đi mới nổi bật được. */}
      {/* 🔑 Thanh tab dời sang `md-tab-bar.tsx` ngày 07/08/2026 — bài kiểm ⑤
          chặn cứng 900 dòng và tệp này chạm 933 sau `BUG-1`/`BUG-5`. Sửa bằng
          CẤU TRÚC, ⛔ không bằng cách nới trần.
          ⚠️ Chú thích cũ ở đây nói tab phải Ở LẠI vì nợ màu/chữ sẽ thành nợ MỚI
          khi dời — điều đó đúng NẾU dời nguyên văn. Bản dời này thay mọi literal
          bằng thẻ `TYPE`/`FONT_WEIGHT`, nên nợ GIẢM THẬT. Xem đầu tệp đó. */}
      <MdTabBar
        ref={tabBarRef}
        tab={tab}
        onDi={goTab}
        counts={counts}
        errorOf={errorOf}
        moTabPhu={moTabPhu}
        onMoTabPhu={setMoTabPhu}
      />

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
          prefetch={false}
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
              <CustomerList
                rows={customers.rows}
                error={customers.error}
                onRefresh={reloaders.customers}
                onSua={(id) => moSua('customers', id)}
                // 🔴 `BUG-5` — Server Action truyền XUỐNG, ⛔ không để bảng tự
                // nhập từ `app/`: bài kiểm ③ chặn `components/ → app/` ở 39 tệp.
                onDoiHieuLuc={(id, dangHieuLuc) =>
                  (dangHieuLuc ? archiveCustomer(id) : restoreCustomer(id))}
              />
            )}
          </div>
        )}

        {tab === 'rfq' && (
          <div className="p-4">
            {inquiries === null ? Waiting : (
              <InquiryList
                rows={inquiries.rows}
                error={inquiries.error}
                onRefresh={reloaders.rfq}
                onSua={(id) => moSua('rfq', id)}
              />
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
              <CostingList
                role={role}
                rows={costings.rows}
                error={costings.error}
                onRefresh={reloaders.costing}
                onSua={(id) => moSua('costing', id)}
              />
            )}
          </div>
        )}

        {/* ── NHÓM TRIỂN KHAI ────────────────────────────────────────── */}
        {tab === 'styles' && (
          <div className="p-4">
            <StyleList
              rows={styles}
              error={styleError}
              onRefresh={refresh}
              onSua={(id) => moSua('styles', id)}
              onLuuTru={archiveStyle}
            />
          </div>
        )}

        {/* 🔴 XOÁ 07/08/2026 — Board *MD V5* §1 liệt kê thẻ *"ĐƠN HÀNG (PO)"*
            trong danh sách phải xoá.
            🔑 Nó là một khối tồn tại **chỉ để chỉ sang khối khác** — *"hành
            trình … nằm ở cột giữa phía trên"*. `tsc` xác nhận nó nay ⛔ không
            với tới được: cổng `tab !== 'po'` đã thu hẹp kiểu, nên nhánh
            `tab === 'po'` là **mã chết**, ⛔ không phải lựa chọn thẩm mỹ. */}

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
            onSua={(id) => moSua('materials', id)}
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

      {/* 🔴 XOÁ `MosKpiGrid` — Board §12 *"⛔ không được tồn tại KPI trùng"*.
          Nó **trùng TÊN** với khối chỉ số ở cột giữa nhưng **khác bộ số**
          *(4 ⟷ 5 ô)*. ⛔ Không phải thừa — **nguy hiểm**: người dùng ⛔ không
          biết bộ nào đúng, rồi thôi tin **mọi** con số khác.
          `MdCharts` xuống khối GẤP — Board §10 *"Analytics thu gọn"*.
          🔴 *MD V5* §1: khối *Phân tích* nay nằm TRONG cổng `tab !== 'po'`,
          nên màn hình mặc định ⛔ không còn nó. */}
      <div className="mt-6 border-t border-slate-200 pt-6">
        <KhoiGap tieuDe="Phân tích">
          <MdCharts data={dashboard.data} />
        </KhoiGap>
      </div>
      </>
      )}

      {/* Toàn bộ hộp thoại + panel PO 360 + bảng lệnh — tách sang
          `md-dialogs.tsx` vì trần 900 dòng. Sửa bằng **CẤU TRÚC**, ⛔ không
          bằng cách nới trần. */}
      <MdDialogs
        dialog={dialog}
        setDialog={setDialog}
        suaId={suaId}
        setSuaId={setSuaId}
        autoDialog={autoDialog}
        setAutoDialog={setAutoDialog}
        congDoanMo={congDoanMo}
        setCongDoanMo={setCongDoanMo}
        customerOptions={customerOptions}
        setCustomerOptions={setCustomerOptions}
        styles={styles}
        poRows={poRows}
        poOptions={poOptions}
        samByOrder={samByOrder}
        customers={customers?.rows ?? []}
        reloadRfq={reloaders.rfq}
        reloadCosting={reloaders.costing}
        loadTab={loadTab}
        refresh={refresh}
        po360={po360}
        setPo360={setPo360}
        loadCc={loadCc}
        paletteOpen={paletteOpen}
        setPaletteOpen={setPaletteOpen}
        openPo={openPo}
        goTab={goTab}
      />
    </WorkspaceShell>
  );
}
