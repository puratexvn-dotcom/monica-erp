'use client';

import { useEffect } from 'react';

// ============================================================================
// ĐĂNG KÝ SERVICE WORKER
//
// ⚠️ CHỈ đăng ký ở bản dựng thật. Ở chế độ phát triển, service worker sẽ đệm
// mã nguồn cũ và làm mọi thay đổi "không có tác dụng" — một trong những kiểu
// lỗi tốn thời gian nhất, vì nó trông y hệt lỗi biên dịch.
//
// ⚠️ KHÔNG dựng nút "Cài đặt ứng dụng" của riêng mình. Chrome và Edge đã có
// nút cài sẵn trên thanh địa chỉ, Safari có mục "Thêm vào Màn hình chính"
// trong menu Chia sẻ. Dựng thêm một nút nữa nghĩa là phải tự đoán xem người
// dùng đã cài chưa, đoán sai thì mời họ cài lại thứ đang chạy. Để hệ điều
// hành lo phần đó.
// ============================================================================

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const dangKy = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // Đăng ký hỏng thì ứng dụng vẫn chạy bình thường, chỉ mất phần ngoại
        // tuyến. Không hiện lỗi cho người dùng — họ không làm gì được với nó.
      });
    };

    // Đợi trang tải xong mới đăng ký: cài service worker trong lúc trang đang
    // dựng sẽ giành băng thông với chính những tài nguyên cần để vẽ màn hình.
    if (document.readyState === 'complete') dangKy();
    else {
      window.addEventListener('load', dangKy);
      return () => window.removeEventListener('load', dangKy);
    }
  }, []);

  return null;
}
