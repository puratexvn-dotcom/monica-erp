import { toBlob } from 'html-to-image';

// ============================================================================
// CHỤP MỘT KHỐI DOM THÀNH ẢNH PNG RỒI TẢI VỀ
//
// ─── VÌ SAO KHÔNG DÙNG toPng + data URL ────────────────────────────────────
// toPng trả về chuỗi data URL. Một tấm ảnh báo cáo ở pixelRatio 2 thường nặng
// 2–5 MB, tức chuỗi dài vài triệu ký tự. Gán chuỗi đó vào <a download> rồi
// click là nguyên nhân số một khiến "bấm nút mà không thấy ảnh đâu": Chrome
// lặng lẽ bỏ qua data URL quá dài, còn Safari trên iOS thì chặn hẳn.
// toBlob + URL.createObjectURL đưa cho trình duyệt một tham chiếu ngắn, tải về
// ổn định ở mọi trình duyệt.
//
// ─── VÌ SAO GỌI HAI LẦN ────────────────────────────────────────────────────
// Lỗi đã biết của html-to-image: lượt gọi ĐẦU TIÊN thường thiếu phông chữ và
// ảnh nhúng vì chúng còn đang tải trong bản sao vừa dựng. Lượt thứ hai chạy
// khi mọi thứ đã nằm trong bộ nhớ đệm nên đầy đủ. Bỏ lượt đầu đi, chỉ lấy
// lượt sau.
//
// ─── VÌ SAO PHẢI ĐỢI TRƯỚC KHI CHỤP ────────────────────────────────────────
// Recharts vẽ bằng SVG sau khi đo xong kích thước hộp chứa, việc đo đó xảy ra
// ở khung hình kế tiếp. Chụp ngay sau khi có dữ liệu thì phần biểu đồ trong
// ảnh ra trắng. Đợi phông chữ tải xong cộng hai khung hình là đủ.
// ============================================================================

export interface ExportResult {
  ok: boolean;
  /** Tên tệp đã tải về, chỉ có khi ok */
  fileName?: string;
  /** Đã phải mở tab mới thay vì tải thẳng (trình duyệt chặn tải blob) */
  openedInTab?: boolean;
  message: string;
}

/** Đợi phông chữ và hai khung hình vẽ. Tách riêng để chỗ gọi đọc ra ý đồ. */
async function waitUntilPainted(): Promise<void> {
  try {
    await document.fonts?.ready;
  } catch {
    // Trình duyệt cũ không có Font Loading API — bỏ qua, không phải lỗi chặn
  }
  await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
}

export async function exportNodeAsPng(
  node: HTMLElement,
  fileName: string,
  /** Bề rộng ép khi chụp. Trên điện thoại vùng chụp chỉ ~340px, ảnh xuất ra sẽ
   *  chật và biểu đồ bị bóp; ép 900px cho ra tấm đọc thoải mái ở mọi máy. */
  width = 900,
): Promise<ExportResult> {
  await waitUntilPainted();

  const options = {
    // Nền trắng BẮT BUỘC: foreignObject không kế thừa nền trong suốt, thiếu là
    // ảnh ra nền đen và chữ tối gần như không đọc được.
    backgroundColor: '#ffffff',
    pixelRatio: 2,
    cacheBust: true,
    width,
    style: { width: `${width}px` },
  } as const;

  let blob: Blob | null = null;
  try {
    // Lượt nháp: nạp phông và ảnh vào bộ nhớ đệm của bản sao
    await toBlob(node, options);
    blob = await toBlob(node, options);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error('[export-image] chụp thất bại:', e);
    return { ok: false, message: `Không dựng được ảnh: ${detail}` };
  }

  if (!blob) {
    return {
      ok: false,
      message:
        'Trình duyệt trả về ảnh rỗng. Thường gặp khi khối cần chụp đang bị ẩn hoặc cao bằng 0.',
    };
  }

  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();

    return {
      ok: true,
      fileName,
      message: `Đã lưu ${fileName} (${(blob.size / 1024 / 1024).toFixed(1)} MB).`,
    };
  } catch {
    // Một số trình duyệt di động chặn tải tệp khởi tạo bằng mã. Mở ra tab mới
    // để người dùng tự nhấn giữ và lưu ảnh — vẫn ra được ảnh, chỉ thêm một bước.
    window.open(url, '_blank', 'noopener');
    return {
      ok: true,
      fileName,
      openedInTab: true,
      message: 'Trình duyệt chặn tải tự động. Ảnh đã mở ở tab mới, hãy nhấn giữ để lưu.',
    };
  } finally {
    // Thu hồi muộn: thu hồi ngay thì tab vừa mở chưa kịp đọc xong đã mất nguồn
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
