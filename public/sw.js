/* eslint-disable no-restricted-globals */
// ============================================================================
// SERVICE WORKER — MONICA ONE
//
// ═══ ⚠️ NGUYÊN TẮC SỐ MỘT: KHÔNG BAO GIỜ LƯU DỮ LIỆU NGHIỆP VỤ ══════════
// Đây là phần mềm điều hành nhà máy có phân quyền. Một bản đệm sai chỗ nghĩa
// là dữ liệu của người này còn nằm trên máy sau khi người khác đăng nhập —
// tức phá thẳng toàn bộ mô hình phân quyền mà ba tầng phòng thủ dựng lên.
//
// Nên service worker này CHỈ đệm phần vỏ TĨNH và CÔNG KHAI:
//   • tài nguyên trong /_next/static  (mã và CSS đã băm tên, bất biến)
//   • /icons/*                        (biểu tượng ứng dụng)
//   • trang /offline                  (trang báo mất mạng)
//
// TUYỆT ĐỐI KHÔNG đệm:
//   ✗ mọi thứ khác origin  → Supabase, xác thực, tệp đính kèm
//   ✗ /api/*               → dữ liệu nghiệp vụ
//   ✗ /auth/*  /login      → luồng xác thực
//   ✗ mọi phương thức khác GET → Server Action, biểu mẫu, ghi dữ liệu
//   ✗ mọi phản hồi có Set-Cookie hoặc Authorization
//   ✗ mọi phản hồi không phải mã 200
//
// ═══ ⚠️ ĐIỀU HƯỚNG DÙNG MẠNG-TRƯỚC, KHÔNG PHẢI ĐỆM-TRƯỚC ═══════════════
// Trang HTML của ứng dụng này được dựng ĐỘNG theo phiên đăng nhập. Đệm chúng
// lại là mời một người dùng nhìn thấy màn hình dựng cho người khác. Luôn đi
// mạng trước; mạng chết thì trả về trang /offline, KHÔNG trả về bản cũ.
//
// ═══ VÌ SAO KHÔNG BỊA DỮ LIỆU KHI MẤT MẠNG ═════════════════════════════
// Trang /offline nói thẳng là đang mất kết nối. Không có số liệu đệm, không
// có "dữ liệu lần cuối". Trong nhà máy, một con số cũ trông y hệt một con số
// mới — và người đọc không có cách nào phân biệt.
// ============================================================================

const PHIEN_BAN = 'monica-one-v1';
const VO_TINH = `${PHIEN_BAN}-shell`;
const TRANG_OFFLINE = '/offline';

// Chỉ những thứ CHẮC CHẮN công khai và tĩnh.
const NAP_SAN = [TRANG_OFFLINE, '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(VO_TINH)
      // `addAll` hỏng một mục là hỏng cả mẻ, nên nạp từng mục và bỏ qua mục lỗi:
      // thiếu một biểu tượng không đáng để cả service worker không cài được.
      .then((c) => Promise.allSettled(NAP_SAN.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ten) =>
        Promise.all(ten.filter((t) => !t.startsWith(PHIEN_BAN)).map((t) => caches.delete(t))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Đường dẫn TUYỆT ĐỐI không được đụng tới. */
function cam(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/update-password') ||
    url.searchParams.has('_rsc') // tải lại từng phần của React — luôn theo phiên
  );
}

/** Tài nguyên tĩnh, bất biến, đã băm tên ⇒ đệm-trước là an toàn. */
function tinh(url) {
  return url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/');
}

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Chỉ xử lý GET. Mọi thao tác GHI phải đi thẳng ra mạng, không qua tay ai.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Khác origin (Supabase, CDN…) — để trình duyệt tự lo. Đụng vào là rủi ro
  // lộ dữ liệu mà chẳng được lợi gì.
  if (url.origin !== self.location.origin) return;

  if (cam(url)) return;

  // ─── Tài nguyên tĩnh: đệm trước, mạng sau ────────────────────────────
  if (tinh(url)) {
    e.respondWith(
      caches.match(req).then(
        (co) =>
          co ||
          fetch(req).then((res) => {
            if (res.ok && res.status === 200) {
              const ban = res.clone();
              caches.open(VO_TINH).then((c) => c.put(req, ban));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // ─── Điều hướng trang: MẠNG TRƯỚC, mất mạng thì báo thật ─────────────
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() =>
        caches.match(TRANG_OFFLINE).then((r) => r || new Response('', { status: 503 })),
      ),
    );
  }

  // Mọi thứ còn lại: không can thiệp.
});
