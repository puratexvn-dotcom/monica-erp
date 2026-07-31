// ============================================================================
// VỊ TRÍ LỖI TRÊN SẢN PHẨM — Điều XVIII (tầng Domain, không biết React, không
// biết Supabase)
//
// ─── VÌ SAO BẢN ĐỒ VÙNG NẰM Ở ĐÂY CHỨ KHÔNG NẰM TRONG CSDL ───────────────
// Cơ sở dữ liệu chỉ giữ MỘT mã vị trí trên mỗi dòng lỗi. Việc xếp mã nào vào
// hàng nào của bản đồ nhiệt là chuyện TRÌNH BÀY. Để nó ở đây thì đổi cách bày
// biểu đồ chỉ sửa một tệp, không phải viết migration.
//
// ─── VÌ SAO KHÔNG VẼ HÌNH ÁO/QUẦN BẰNG SVG ───────────────────────────────
// Một nhà máy chạy cùng lúc áo, quần và đồ bảo hộ. Một hình bóng áo sẽ sai với
// hai phần ba số mã hàng, và lỗi ở "lưng quần" sẽ không có chỗ nào để chấm. Vì
// vậy bản đồ nhiệt ở đây là LƯỚI THEO VÙNG: đọc được cho mọi loại sản phẩm.
//
// ⚠️ Danh sách mã dưới đây phải KHỚP TỪNG CHỮ với ràng buộc CHECK
// `qa_logs_defect_location_valid` trong migration 023. Lệch một mã thì giao
// diện cho chọn một vị trí mà cơ sở dữ liệu từ chối ghi.
// ============================================================================

export const DEFECT_POSITIONS = [
  // Phần trên (áo)
  'COLLAR', 'SHOULDER', 'SLEEVE', 'CUFF', 'PLACKET',
  // Thân
  'FRONT_BODY', 'BACK_BODY', 'SIDE_SEAM', 'POCKET', 'HEM',
  // Phần dưới (quần)
  'WAISTBAND', 'FLY', 'RISE', 'THIGH', 'KNEE', 'LEG_OPENING', 'BELT_LOOP',
  // Ngoài đường may
  'FABRIC', 'LABEL', 'PACKING',
  'OTHER',
] as const;

export type DefectPosition = (typeof DEFECT_POSITIONS)[number];

export type DefectZone = 'TOP' | 'BODY' | 'BOTTOM' | 'NON_SEWN';

/** Mỗi vùng là MỘT HÀNG của bản đồ nhiệt. Thứ tự trong mảng là thứ tự cột. */
export const POSITION_ZONES: ReadonlyArray<{
  zone: DefectZone;
  positions: readonly DefectPosition[];
}> = [
  { zone: 'TOP', positions: ['COLLAR', 'SHOULDER', 'SLEEVE', 'CUFF', 'PLACKET'] },
  { zone: 'BODY', positions: ['FRONT_BODY', 'BACK_BODY', 'SIDE_SEAM', 'POCKET', 'HEM'] },
  { zone: 'BOTTOM', positions: ['WAISTBAND', 'FLY', 'RISE', 'THIGH', 'KNEE', 'LEG_OPENING', 'BELT_LOOP'] },
  { zone: 'NON_SEWN', positions: ['FABRIC', 'LABEL', 'PACKING', 'OTHER'] },
];

/** Thu hẹp kiểu cho giá trị đọc từ cơ sở dữ liệu — cột cho phép NULL và là
 *  VARCHAR, nên không thể tin nó luôn nằm trong danh sách. */
export function isDefectPosition(v: string | null | undefined): v is DefectPosition {
  return typeof v === 'string' && (DEFECT_POSITIONS as readonly string[]).includes(v);
}

// ── BẢN ĐỒ NHIỆT ────────────────────────────────────────────────────────────

export interface HeatCell {
  position: DefectPosition;
  qty: number;
  /** 0 → 1. Dùng để chọn độ đậm của ô. */
  intensity: number;
}

export interface HeatRow {
  zone: DefectZone;
  cells: HeatCell[];
  /** Tổng lỗi của cả vùng — để xếp hạng vùng nào tệ nhất */
  qty: number;
}

export interface HeatMap {
  rows: HeatRow[];
  /** Tổng số lỗi ĐÃ GHI NHẬN VỊ TRÍ. Khác với tổng lỗi của đơn: dòng không ghi
   *  vị trí sẽ không vào bản đồ này. */
  located: number;
  /** Số lỗi KHÔNG ghi vị trí. Phải hiện lên màn hình, nếu không người đọc sẽ
   *  tưởng bản đồ nhiệt đã bao trọn mọi lỗi của đơn. */
  unlocated: number;
  /** Ô đậm nhất, để chú thích thang màu bằng con số thật */
  peak: number;
}

/**
 * Dựng bản đồ nhiệt từ danh sách lỗi đã ghi vị trí.
 *
 * ─── VÌ SAO ĐỘ ĐẬM CHIA THEO Ô LỚN NHẤT, KHÔNG CHIA THEO TỔNG ────────────
 * Nếu chia theo tổng thì một đơn có lỗi rải đều hai mươi vị trí sẽ ra hai mươi
 * ô nhạt như nhau — nhìn vào tưởng không có vấn đề gì. Chia theo ô lớn nhất thì
 * chỗ tệ nhất LUÔN đậm nhất, và đó chính là câu hỏi người quản lý chất lượng
 * đang hỏi: "nên đến chỗ nào trước?".
 */
export function buildHeatMap(
  defects: ReadonlyArray<{ position: string | null; qty: number }>,
): HeatMap {
  const tally = new Map<DefectPosition, number>();
  let unlocated = 0;

  for (const d of defects) {
    const qty = Number.isFinite(d.qty) ? d.qty : 0;
    if (qty <= 0) continue;
    if (isDefectPosition(d.position)) {
      tally.set(d.position, (tally.get(d.position) ?? 0) + qty);
    } else {
      unlocated += qty;
    }
  }

  let peak = 0;
  for (const v of tally.values()) if (v > peak) peak = v;

  const rows: HeatRow[] = POSITION_ZONES.map((z) => {
    const cells = z.positions.map<HeatCell>((p) => {
      const qty = tally.get(p) ?? 0;
      return { position: p, qty, intensity: peak > 0 ? qty / peak : 0 };
    });
    return { zone: z.zone, cells, qty: cells.reduce((s, c) => s + c.qty, 0) };
  });

  return {
    rows,
    located: rows.reduce((s, r) => s + r.qty, 0),
    unlocated,
    peak,
  };
}
