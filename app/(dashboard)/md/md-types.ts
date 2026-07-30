// Kiểu dùng chung giữa Server Component và các form client của phân hệ MD.
// Tách riêng khỏi md-actions.ts vì file đó có 'use server' — mọi export ở file
// server action bắt buộc phải là hàm async, export type thì được nhưng export
// hằng số hay interface dùng ở client thì dễ vướng. Để riêng cho gọn.

export interface PoOption {
  id: string;
  po_number: string;
  style_code: string;
  customer_name: string;
}
