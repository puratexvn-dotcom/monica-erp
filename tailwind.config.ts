import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // ⚠️ BẮT BUỘC — Hệ thẻ màu hiến định sống ở lib/design/tokens.ts.
    //
    // Thiếu dòng này thì Tailwind KHÔNG quét thư mục lib, mọi lớp màu khai
    // trong tệp thẻ màu bị cắt sạch khỏi CSS, và giao diện ra TRẮNG TRƠN ở
    // production trong khi dev vẫn đủ màu (dev còn giữ cache lớp cũ). Đây
    // đúng loại lỗi build xanh - màn hình hỏng mà Điều 44 sinh ra để chặn.
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        monica: {
          pink: "#E84393",
          cyan: "#00CEC9",
          green: "#BADC58",
          blue: "#0984E3",
          yellow: "#FDCB6E",
          red: "#FF7675",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;