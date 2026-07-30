/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    // Server Action mặc định chỉ nhận body 1 MB. Ảnh chụp bằng điện thoại
    // thường 2–5 MB, nên không nâng thì luồng upload ảnh bằng chứng lỗi với
    // thông báo "Body exceeded 1 MB limit" — chẳng nói gì về ảnh, rất khó đoán.
    // Để 10mb: nhiều hơn giới hạn 8 MB đang kiểm ở client, chừa phần overhead
    // của multipart encoding.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
