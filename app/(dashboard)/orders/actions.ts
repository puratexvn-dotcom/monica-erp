'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Order {
  id: string
  po_number: string
  style_code: string
  customer_name: string
  total_quantity: number
  delivery_date: string
  status: 'DRAFT' | 'APPROVED' | 'IN_PRODUCTION' | 'COMPLETED'
  created_at: string
}

/**
 * Lấy danh sách toàn bộ đơn hàng PO từ Supabase
 */
export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Lỗi khi lấy danh sách PO:', error.message)
    return []
  }

  return data as Order[]
}

/**
 * Khởi tạo đơn hàng PO mới
 */
export async function createOrder(formData: FormData) {
  const supabase = await createClient()

  const po_number = formData.get('po_number') as string
  const style_code = formData.get('style_code') as string
  const customer_name = formData.get('customer_name') as string
  const total_quantity = parseInt(formData.get('total_quantity') as string, 10)
  const delivery_date = formData.get('delivery_date') as string

  if (!po_number || !style_code || !customer_name || !total_quantity || !delivery_date) {
    return { error: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc!' }
  }

  const { error } = await supabase.from('orders').insert([
    {
      po_number,
      style_code,
      customer_name,
      total_quantity,
      delivery_date,
      status: 'APPROVED',
    },
  ])

  if (error) {
    console.error('Lỗi khi tạo PO:', error.message)
    return { error: `Không thể tạo PO: ${error.message}` }
  }

  // Cập nhật lại giao diện ngay lập tức mà không cần reload trang
  revalidatePath('/orders')
  return { success: true }
}