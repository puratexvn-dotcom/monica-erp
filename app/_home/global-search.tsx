'use client';

// ============================================================================
// 🔴 GLOBAL SEARCH — CỔNG ĐIỀU HƯỚNG TOÀN BỘ MONICA ONE
//
// 📐 Board Directive *MONICA ONE GLOBAL SEARCH + LANGUAGE MENU* 08/08/2026:
//   > *"MONICA ONE có thể phát triển thành hệ thống rất lớn với **hàng trăm/
//   > hàng nghìn module**. ⛔ Không được giải quyết bằng cách đưa tất cả module
//   > lên Homepage… Các module còn lại phải truy cập qua **GLOBAL SEARCH**."*
//   > Vị trí: `BUSINESS OPERATING SYSTEM → GLOBAL SEARCH → BUSINESS LAUNCHER`.
//
// ─── 🔑 VÌ SAO ĐỌC REGISTRY, ⛔ KHÔNG CHÉP DANH SÁCH MODULE ────────────
// Board §4: *"⛔ Không hard-code danh sách module nếu hệ thống đã có registry…
// sau này thêm module mới thì Search **tự** tìm thấy."*
// `lib/mos/registry/business-apps.ts` **đã là** nguồn ấy, và trang chủ đã đọc
// nó. Chép ra một mảng thứ hai ở đây là dựng **nguồn sự thật thứ hai** — thêm
// App thứ 25 thì Launcher có mà Search ⛔ không, và ⛔ không lỗi nào báo.
//
// ─── BA LOẠI KẾT QUẢ — Board §5 ────────────────────────────────────────
//   ⓐ MODULE       — từ Registry
//   ⓑ DỮ LIỆU      — PO · khách hàng · mã hàng, qua **một** lời gọi máy chủ
//   ⓒ THAO TÁC     — *"Tạo PO"* · *"Thêm khách hàng"* → mở thẳng biểu mẫu
//
// ⚠️ **HIỆU NĂNG — Board §14: *"Search ⛔ không được làm chậm First Paint."***
// Module và Thao tác lọc **tại chỗ** *(⛔ không mạng)*. Dữ liệu nghiệp vụ chỉ
// gọi máy chủ **sau khi gõ ≥ 2 ký tự** và **trễ 250 ms** — ⛔ không có lời gọi
// nào lúc trang tải. Người ⛔ không mở Search thì ⛔ không trả một byte nào.
//
// ⚠️ Tệp này ⛔ **KHÔNG chạm khu Lời Chúa** — Board §12 tuyên bố khu đó
// `IMMUTABLE`. Nó nằm ở `top-navbar.tsx` + `header-verse.tsx`, và ⛔ không
// tệp nào trong bản vá này nhập tới chúng.
// ============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, Loader2, Compass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { MODULES } from '@/lib/mos/registry/business-apps';
import { useLanguage } from '@/lib/i18n';
import { TYPE, FONT_WEIGHT } from '@/lib/design/typography';
import { SAC_O, oTimKiem, hopTimKiem, dongKetQuaChon, type SacOKey } from '@/components/ui';
import { timKiemToanCuc, type KetQuaTim } from './search.actions';

type Loai = 'MODULE' | 'DU_LIEU' | 'THAO_TAC';

interface Muc {
  id: string;
  loai: Loai;
  nhom: string;
  nhan: string;
  phu: string;
  icon: LucideIcon;
  sac: SacOKey;
  di: string;
  /** Điểm khớp — càng NHỎ càng lên trước. Xem `XEP_HANG`. */
  diem: number;
}

/** 🔴 Board §6 — **thứ tự ưu tiên là điều khoản, ⛔ không phải sở thích.**
 *    ① khớp tuyệt đối ② dữ liệu nghiệp vụ ③ module ④ thao tác ⑤ khớp một phần
 *
 *  🔑 Dữ liệu đứng TRÊN module vì người gõ `DEMO-PO-2601` đang tìm **đúng một
 *  đơn hàng**; trả về module *"PO"* trước là buộc họ bấm thêm một lần rồi tự
 *  tìm lại. Người gõ `Tech Pack` thì ⛔ không có dữ liệu nào khớp, nên module
 *  tự nhiên lên đầu — thứ tự này ⛔ không cần phân nhánh theo ý định. */
const XEP_HANG: Record<Loai, number> = { DU_LIEU: 10, MODULE: 20, THAO_TAC: 30 };

/** Chuẩn hoá để so khớp: bỏ dấu tiếng Việt, hạ chữ thường.
 *
 *  ⚠️ ⛔ KHÔNG bỏ qua bước này. *"Chiết tính"* gõ thành `chiet tinh` là cách
 *  gõ **thường gặp nhất** trên bàn phím ⛔ không dấu, và một Search bắt gõ đủ
 *  dấu là một Search phần lớn thời gian trả về rỗng. */
function chuan(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().trim();
}

/** ⛔ KHÔNG khớp ⇒ `null`. Khớp đầu chuỗi tốt hơn khớp giữa chuỗi. */
function khop(kho: string, tu: string): number | null {
  const a = chuan(kho); const b = chuan(tu);
  if (!b) return 0;
  if (a === b) return 0;          // khớp tuyệt đối
  if (a.startsWith(b)) return 1;  // khớp đầu
  if (a.includes(b)) return 2;    // khớp giữa
  return null;
}

/** 🔴 Board §5.C — THAO TÁC. Mỗi mục dẫn tới **đúng biểu mẫu**, ⛔ không chỉ
 *  mở trang rồi để người dùng tự tìm nút. `?tao=` là tham số `md-client` đã
 *  đọc sẵn để mở hộp thoại. */
const THAO_TAC: ReadonlyArray<{ id: string; nhan: string; phu: string; di: string; sac: SacOKey }> = [
  { id: 'act.po', nhan: 'Tạo PO', phu: 'Mở biểu mẫu đơn hàng mới', di: '/md?tao=po', sac: 'blue' },
  { id: 'act.kh', nhan: 'Thêm khách hàng', phu: 'Mở biểu mẫu khách hàng', di: '/md?tao=customers', sac: 'emerald' },
  { id: 'act.ct', nhan: 'Thêm chiết tính', phu: 'Mở biểu mẫu chiết tính', di: '/md?tao=costing', sac: 'violet' },
  { id: 'act.dm', nhan: 'Thêm định mức', phu: 'Mở biểu mẫu mã hàng & BOM', di: '/md?tao=styles', sac: 'orange' },
  { id: 'act.tp', nhan: 'Thêm Tech Pack', phu: 'Mở biểu mẫu hồ sơ kỹ thuật', di: '/md?tao=documents', sac: 'teal' },
  { id: 'act.npl', nhan: 'Yêu cầu NPL', phu: 'Mở biểu mẫu yêu cầu vật tư', di: '/md?tao=materials', sac: 'rose' },
];

const NHAN_NHOM: Record<Loai, string> = {
  MODULE: 'MODULE', DU_LIEU: 'DỮ LIỆU NGHIỆP VỤ', THAO_TAC: 'THAO TÁC',
};

export default function GlobalSearch() {
  const router = useRouter();
  const { t } = useLanguage();
  const [mo, setMo] = useState(false);
  const [tu, setTu] = useState('');
  const [chon, setChon] = useState(0);
  const [duLieu, setDuLieu] = useState<KetQuaTim[]>([]);
  const [dangTim, setDangTim] = useState(false);
  const boc = useRef<HTMLDivElement>(null);
  const o = useRef<HTMLInputElement>(null);

  // ─── ⓐ MODULE — lọc TẠI CHỖ từ Registry, ⛔ không lời gọi mạng nào ──────
  const mucModule = useMemo<Muc[]>(() => {
    if (!tu) return [];
    return MODULES.flatMap((m) => {
      // Tìm theo **tên sản phẩm** *(⛔ không dịch — `Hiến pháp §45.3`)* và theo
      // **mô tả đã dịch**, để gõ tiếng Việt vẫn ra đúng App.
      const d = Math.min(
        ...[m.name, t(m.shortKey), t(m.descKey)]
          .map((x) => khop(String(x), tu))
          .filter((x): x is number => x !== null),
      );
      if (!Number.isFinite(d)) return [];
      return [{
        id: `mod.${m.id}`, loai: 'MODULE' as const, nhom: NHAN_NHOM.MODULE,
        nhan: m.name, phu: String(t(m.shortKey)), icon: m.icon, sac: 'sky' as SacOKey,
        di: m.status === 'READY' ? m.href : '',
        // 🔴 **PHẠT ĐIỂM App ⛔ CHƯA CÓ ROUTE.** Đo bằng trình duyệt thật: gõ
        // `tech` thì `Documents` *(COMING_SOON)* đứng đầu và **được chọn sẵn**
        // ⇒ bấm `Enter` **⛔ không xảy ra gì**, ⛔ không một lời giải thích.
        // Một kết quả bấm ⛔ không tới đâu mà nằm ở vị trí số 1 là kết quả
        // **dạy người dùng rằng Search hỏng**.
        diem: XEP_HANG.MODULE + d + (m.status === 'READY' ? 0 : 5),
      }];
    });
  }, [tu, t]);

  // ─── ⓒ THAO TÁC — cũng tại chỗ ─────────────────────────────────────────
  const mucThaoTac = useMemo<Muc[]>(() => {
    if (!tu) return [];
    return THAO_TAC.flatMap((a) => {
      const d = khop(a.nhan, tu);
      if (d === null) return [];
      return [{
        id: a.id, loai: 'THAO_TAC' as const, nhom: NHAN_NHOM.THAO_TAC,
        nhan: `+ ${a.nhan}`, phu: a.phu, icon: Compass, sac: a.sac, di: a.di,
        diem: XEP_HANG.THAO_TAC + d,
      }];
    });
  }, [tu]);

  // ─── ⓑ DỮ LIỆU — **MỘT** lời gọi, có trễ, chỉ khi ≥ 2 ký tự ────────────
  // ⚠️ Board §14: *"⛔ Không tạo 10 module = 10 API calls."* `timKiemToanCuc`
  // là **một** Server Action gộp cả ba bảng.
  useEffect(() => {
    if (!mo || tu.trim().length < 2) { setDuLieu([]); setDangTim(false); return; }
    setDangTim(true);
    let huy = false;
    const h = setTimeout(() => {
      void timKiemToanCuc(tu)
        .then((r) => { if (!huy) { setDuLieu(r); setDangTim(false); } })
        .catch(() => { if (!huy) { setDuLieu([]); setDangTim(false); } });
    }, 250);
    return () => { huy = true; clearTimeout(h); };
  }, [tu, mo]);

  const mucDuLieu = useMemo<Muc[]>(
    () => duLieu.map((r) => ({
      id: `dl.${r.loai}.${r.id}`, loai: 'DU_LIEU' as const, nhom: NHAN_NHOM.DU_LIEU,
      nhan: r.ma, phu: r.phu, icon: Search, sac: (r.sac as SacOKey) ?? 'blue', di: r.di,
      diem: XEP_HANG.DU_LIEU + (khop(r.ma, tu) ?? 2),
    })),
    [duLieu, tu],
  );

  const ketQua = useMemo(
    () => [...mucDuLieu, ...mucModule, ...mucThaoTac].sort((a, b) => a.diem - b.diem).slice(0, 12),
    [mucDuLieu, mucModule, mucThaoTac],
  );

  // ⚠️ Chọn sẵn mục **ĐI ĐƯỢC** đầu tiên, ⛔ không cứng nhắc mục `0`. Khi mọi
  // kết quả đều ⛔ chưa mở thì rơi về `0` — lúc đó ⛔ không có lựa chọn nào tốt
  // hơn, và người dùng vẫn đọc được nhãn *"chưa mở"* để hiểu vì sao.
  useEffect(() => {
    const i = ketQua.findIndex((m) => m.di);
    setChon(i >= 0 ? i : 0);
  }, [ketQua]);

  const dong = useCallback(() => { setMo(false); setTu(''); }, []);

  const diToi = useCallback((m: Muc) => {
    if (!m.di) return;   // App `COMING_SOON` ⛔ chưa có route — ⛔ không điều hướng mù
    dong();
    router.push(m.di);
  }, [router, dong]);

  // ─── PHÍM TẮT — Board §7 ───────────────────────────────────────────────
  // ⚠️ `Ctrl+K` bắt ở cấp **document**, nhưng mọi phím còn lại chỉ xử lý **khi
  // Search đang mở**: *"Khi Search đang mở, ⛔ không được để phím tắt gây hành
  // vi ngoài ý muốn."* Bắt `↑`/`↓` toàn cục sẽ cướp phím cuộn trang.
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setMo(true); setTimeout(() => o.current?.focus(), 0);
      }
    };
    document.addEventListener('keydown', f);
    return () => document.removeEventListener('keydown', f);
  }, []);

  // Bấm ra ngoài ⇒ đóng — Board §16.
  useEffect(() => {
    if (!mo) return;
    const f = (e: MouseEvent) => {
      if (boc.current && !boc.current.contains(e.target as Node)) dong();
    };
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [mo, dong]);

  function phim(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { e.preventDefault(); dong(); o.current?.blur(); return; }
    if (!ketQua.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setChon((i) => (i + 1) % ketQua.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setChon((i) => (i - 1 + ketQua.length) % ketQua.length); }
    else if (e.key === 'Enter') { e.preventDefault(); diToi(ketQua[chon]); }
  }

  return (
    // ⚠️ `max-w-5xl` — **CÙNG bề rộng với lưới Business Launcher** ngay bên
    // dưới. Board §3: *"nằm cùng grid/container với Business Launcher."* Rộng
    // hơn thì Search đọc ra là một khối riêng đè lên Launcher; hẹp hơn thì nó
    // trông như bị lọt thỏm.
    <div ref={boc} className="relative z-30 mx-auto mb-8 max-w-5xl px-4">
      <button
        type="button"
        onClick={() => { setMo(true); setTimeout(() => o.current?.focus(), 0); }}
        className={`${oTimKiem} ${mo ? 'invisible absolute' : ''}`}
        aria-label="Mở tìm kiếm toàn hệ thống"
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        {/* ⚠️ Câu gợi ý **rút gọn ở khổ hẹp**, ⛔ không cắt bằng `truncate`:
            một câu bị cắt giữa chừng đọc ra là lỗi, ⛔ không phải là rút gọn. */}
        <span className={`min-w-0 flex-1 text-slate-400 ${TYPE.bodySm}`}>
          <span className="sm:hidden">Tìm module, PO, khách hàng...</span>
          <span className="hidden sm:inline">Tìm module, PO, khách hàng, mã hàng...</span>
        </span>
        <kbd className={`hidden shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-500 sm:inline ${TYPE.caption} ${FONT_WEIGHT.semibold}`}>
          Ctrl K
        </kbd>
      </button>

      {mo && (
        <div className={hopTimKiem}>
          <div className="flex items-center gap-2.5 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              ref={o}
              value={tu}
              onChange={(e) => setTu(e.target.value)}
              onKeyDown={phim}
              placeholder="Tìm module, PO, khách hàng, mã hàng..."
              aria-label="Tìm kiếm toàn hệ thống"
              aria-expanded={ketQua.length > 0}
              role="combobox"
              aria-controls="ket-qua-tim"
              className={`min-w-0 flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-400 ${TYPE.bodySm}`}
            />
            {dangTim && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-300" aria-hidden="true" />}
            <kbd className={`hidden shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-slate-500 sm:inline ${TYPE.caption}`}>
              Esc
            </kbd>
          </div>

          {tu.trim() !== '' && (
            <div id="ket-qua-tim" role="listbox" className="max-h-[min(60vh,420px)] overflow-y-auto border-t border-slate-100 p-1.5">
              {ketQua.length === 0 && !dangTim && (
                /* Board §6: *"⛔ Không hiển thị kết quả rác."* Rỗng thì nói
                   rõ là rỗng, và **chỉ đường** — một hộp trống ⛔ không dạy
                   người dùng cách gõ lại cho trúng. */
                <div className="px-3 py-6 text-center">
                  <p className={`text-slate-600 ${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>Không tìm thấy kết quả</p>
                  <p className={`mt-1 text-slate-400 ${TYPE.caption}`}>
                    Gợi ý: thử tên PO, khách hàng, mã hàng hoặc tên module.
                  </p>
                </div>
              )}

              {ketQua.map((m, i) => {
                const Icon = m.icon;
                const s = SAC_O[m.sac];
                const dauNhom = i === 0 || ketQua[i - 1].loai !== m.loai;
                return (
                  <div key={m.id}>
                    {dauNhom && (
                      <p className={`px-2.5 pb-1 pt-2 text-slate-400 ${TYPE.overline}`}>{m.nhom}</p>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === chon}
                      onMouseEnter={() => setChon(i)}
                      onClick={() => diToi(m)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${i === chon ? dongKetQuaChon : ''}`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.huy}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-slate-800 ${TYPE.bodySm} ${FONT_WEIGHT.semibold}`}>{m.nhan}</span>
                        <span className={`block truncate text-slate-500 ${TYPE.caption}`}>
                          {/* ⚠️ Chữ thuần, ⛔ KHÔNG ký tự emoji: `⛔` dựng
                              thành một hình tròn đỏ **có màu** giữa một bảng
                              lệnh xám — nó hút mắt mạnh hơn cả kết quả, và
                              Board vừa cấm *"UI giống game"*. */}
                          {m.phu}{!m.di && ' · chưa mở'}
                        </span>
                      </span>
                      {i === chon && m.di && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
