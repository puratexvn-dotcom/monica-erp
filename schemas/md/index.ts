// ============================================================================
// CỬA VÀO DUY NHẤT CHO LƯỢC ĐỒ MERCHANDISER
//
// Mọi nơi import từ '@/schemas/md', không import thẳng từng file con. Nhờ vậy
// khi tách hay gộp file bên trong thì chỗ dùng không phải sửa gì.
//
// ⚠️ File này CHỈ export lược đồ, kiểu dữ liệu và hàm thuần. Tuyệt đối không
// import Server Action vào đây: mọi thứ ở đây phải dùng được ở CẢ client lẫn
// server, mà Server Action thì chỉ chạy được ở server.
// ============================================================================

export * from './common';
export * from './commercial.schema';
export * from './style.schema';
export * from './order.schema';
export * from './execution.schema';
export * from './collaboration.schema';
export * from './planning.schema';
