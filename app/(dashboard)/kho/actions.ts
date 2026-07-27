'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Material {
  id: string
  material_code: string
  name: string
  category: string
  unit: string
  stock_qty: number
  min_stock_qty: number
}

export interface Transaction {
  id: string
  transaction_type: 'IN' | 'OUT'
  material_id: string
  material_code?: string
  material_name?: string
  quantity: number
  reference_no?: string
  notes?: string
  created_at: string
}

/**
 * Lấy danh sách Vật tư & Tồn kho thực tế
 */
export async function getMaterials(): Promise<Material[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('material_code', { ascending: true })

  if (error) {
    console.error('Lỗi lấy danh sách vật tư:', error.message)
    return []
  }
  return data as Material[]
}

/**
 * Lấy Lịch sử Giao dịch Nhập / Xuất kho
 */
export async function getWarehouseTransactions(): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('warehouse_transactions')
    .select(`
      *,
      materials ( material_code, name )
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Lỗi lấy nhật ký kho:', error.message)
    return []
  }

  return data.map((item: any) => ({
    ...item,
    material_code: item.materials?.material_code || 'N/A',
    material_name: item.materials?.name || 'N/A',
  })) as Transaction[]
}

/**
 * Lấy danh sách PO khả dụng
 */
export async function getOrdersForWarehouse() {
  const supabase = await createClient()
  const { data } = await supabase.from('orders').select('id, po_number, style_code')
  return data || []
}

/**
 * Xử lý Giao dịch Nhập / Xuất kho & Tự động cập nhật Tồn kho Realtime
 */
export async function createWarehouseTransaction(formData: FormData) {
  const supabase = await createClient()

  const material_id = formData.get('material_id') as string
  const transaction_type = formData.get('transaction_type') as 'IN' | 'OUT'
  const quantity = parseFloat(formData.get('quantity') as string)
  const order_id = formData.get('order_id') as string
  const reference_no = formData.get('reference_no') as string
  const notes = formData.get('notes') as string

  if (!material_id || !transaction_type || isNaN(quantity) || quantity <= 0) {
    return { error: 'Vui lòng nhập đầy đủ thông tin vật tư và số lượng hợp lệ!' }
  }

  // 1. Kiểm tra tồn kho hiện tại nếu là lệnh XUẤT (OUT)
  const { data: material } = await supabase
    .from('materials')
    .select('stock_qty, name')
    .eq('id', material_id)
    .single()

  if (transaction_type === 'OUT' && material) {
    if (material.stock_qty < quantity) {
      return {
        error: `Không đủ tồn kho! Tồn hiện tại của "${material.name}" là ${material.stock_qty}, không thể xuất ${quantity}.`,
      }
    }
  }

  // 2. Ghi nhận Phiếu Nhập/Xuất Kho
  const { error: transError } = await supabase.from('warehouse_transactions').insert([
    {
      material_id,
      transaction_type,
      quantity,
      order_id: order_id || null,
      reference_no,
      notes,
    },
  ])

  if (transError) {
    return { error: `Lỗi lưu phiếu kho: ${transError.message}` }
  }

  // 3. Tự động cộng/trừ Tồn kho Realtime trong bảng materials
  const newStockQty =
    transaction_type === 'IN'
      ? (material?.stock_qty || 0) + quantity
      : (material?.stock_qty || 0) - quantity

  await supabase
    .from('materials')
    .update({ stock_qty: newStockQty, updated_at: new Date().toISOString() })
    .eq('id', material_id)

  revalidatePath('/kho')
  return { success: true }
}