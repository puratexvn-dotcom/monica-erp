'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CutBundle {
  id: string
  bundle_code: string
  color_code: string
  size_code: string
  start_ply_no: number
  end_ply_no: number
  quantity: number
  shade_lot: string
  status: string
}

export interface CutTicket {
  id: string
  ticket_no: string
  po_number?: string
  style_code?: string
  marker_code: string
  marker_length_m: number
  ply_count: number
  total_planned_pcs: number
  total_actual_pcs: number
  bom_allowance_m: number
  total_fabric_used_m: number
  remnant_length_m: number
  defect_length_m: number
  notes?: string
  created_at: string
  cut_bundles?: CutBundle[]
}

/**
 * Lấy danh sách Phiếu Bàn Cắt kèm các Bó Phối kiện
 */
export async function getCutTickets(): Promise<CutTicket[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('cut_tickets')
    .select(`
      *,
      orders ( po_number, style_code ),
      cut_bundles ( id, bundle_code, color_code, size_code, start_ply_no, end_ply_no, quantity, shade_lot, status )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Lỗi lấy danh sách phiếu cắt:', error.message)
    return []
  }

  return data.map((item: any) => ({
    ...item,
    po_number: item.orders?.po_number || 'N/A',
    style_code: item.orders?.style_code || 'N/A',
  })) as CutTicket[]
}

/**
 * Lấy danh sách PO và Cuộn Vải khả dụng cho Dropdown
 */
export async function getOptionsForCutting() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, po_number, style_code')
    .order('created_at', { ascending: false })

  const { data: rolls } = await supabase
    .from('fabric_rolls')
    .select('id, roll_code, shade_lot, current_length_m')
    .gt('current_length_m', 0)
    .order('roll_code', { ascending: true })

  return { orders: orders || [], rolls: rolls || [] }
}

/**
 * Tạo Phiếu Bàn Cắt mới + Tự động sinh Phối kiện (Bundles) + Cập nhật Cuộn Vải
 */
export async function createCutTicket(formData: FormData) {
  const supabase = await createClient()

  const order_id = formData.get('order_id') as string
  const roll_id = formData.get('roll_id') as string
  const marker_code = formData.get('marker_code') as string
  const marker_length_m = parseFloat(formData.get('marker_length_m') as string)
  const ply_count = parseInt(formData.get('ply_count') as string, 10)
  const total_actual_pcs = parseInt(formData.get('total_actual_pcs') as string, 10)
  const bom_allowance_m = parseFloat(formData.get('bom_allowance_m') as string)
  const total_fabric_used_m = parseFloat(formData.get('total_fabric_used_m') as string)
  const remnant_length_m = parseFloat(formData.get('remnant_length_m') as string || '0')
  const defect_length_m = parseFloat(formData.get('defect_length_m') as string || '0')
  const color_code = (formData.get('color_code') as string || 'BLACK').toUpperCase()
  const size_code = (formData.get('size_code') as string || 'M').toUpperCase()
  const notes = formData.get('notes') as string

  if (!order_id || !marker_code || isNaN(marker_length_m) || isNaN(ply_count) || isNaN(total_actual_pcs)) {
    return { error: 'Vui lòng điền đầy đủ các thông số bàn cắt bắt buộc!' }
  }

  // Lấy thông tin cuộn vải nếu có chọn
  let shade_lot = 'SHADE-A1'
  if (roll_id) {
    const { data: roll } = await supabase
      .from('fabric_rolls')
      .select('shade_lot, current_length_m')
      .eq('id', roll_id)
      .single()

    if (roll) {
      shade_lot = roll.shade_lot
      // Cập nhật mét vải còn lại của cuộn
      const newRollLength = Math.max(0, roll.current_length_m - total_fabric_used_m)
      await supabase
        .from('fabric_rolls')
        .update({ current_length_m: newRollLength, updated_at: new Date().toISOString() })
        .eq('id', roll_id)
    }
  }

  const ticket_no = `PK-${Date.now().toString().slice(-6)}`

  // 1. Tạo Bàn Cắt Master
  const { data: ticket, error: ticketError } = await supabase
    .from('cut_tickets')
    .insert([
      {
        ticket_no,
        order_id,
        marker_code,
        marker_length_m,
        ply_count,
        total_planned_pcs: total_actual_pcs,
        total_actual_pcs,
        bom_allowance_m,
        total_fabric_used_m,
        remnant_length_m,
        defect_length_m,
        notes,
      },
    ])
    .select()
    .single()

  if (ticketError || !ticket) {
    return { error: `Không thể lưu phiếu bàn cắt: ${ticketError?.message}` }
  }

  // 2. Tự động sinh 2 Bó Phối Kiện mẫu (Bundles) phân theo khoảng lớp vải
  const bundle1Qty = Math.floor(total_actual_pcs / 2)
  const bundle2Qty = total_actual_pcs - bundle1Qty

  const bundlesToInsert = [
    {
      cut_ticket_id: ticket.id,
      bundle_code: `BDL-${ticket_no}-${color_code}-${size_code}-01`,
      color_code,
      size_code,
      start_ply_no: 1,
      end_ply_no: Math.floor(ply_count / 2),
      quantity: bundle1Qty,
      shade_lot,
    },
    {
      cut_ticket_id: ticket.id,
      bundle_code: `BDL-${ticket_no}-${color_code}-${size_code}-02`,
      color_code,
      size_code,
      start_ply_no: Math.floor(ply_count / 2) + 1,
      end_ply_no: ply_count,
      quantity: bundle2Qty,
      shade_lot,
    },
  ]

  const { error: bundleError } = await supabase.from('cut_bundles').insert(bundlesToInsert)

  if (bundleError) {
    console.error('Lỗi tự động sinh bó hàng:', bundleError.message)
  }

  revalidatePath('/to-truong-cat')
  return { success: true }
}