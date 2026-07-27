'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/** Lấy dữ liệu cho cả 2 Tab: Tiến độ QC và Đóng Thùng */
export async function getFinishingAndPackingData() {
  const supabase = await createClient()

  // 1. Lấy danh sách Bundles (Bán thành phẩm)
  const { data: rawBundles } = await supabase
    .from('cut_bundles')
    .select(`
      id, bundle_code, color_code, size_code, quantity, current_stage,
      cut_tickets ( orders ( id, po_number, total_quantity ) ),
      finishing_logs ( trimming_qty, ironing_qty, final_qc_passed_qty, final_qc_defect_qty )
    `)
    .order('created_at', { ascending: false })

  // 2. Lấy danh sách Thùng Carton đã đóng tại xưởng (Chưa nhập kho)
  const { data: cartons } = await supabase
    .from('cartons')
    .select('id, carton_code, color_code, size_code, quantity_per_carton, status, created_at, orders(po_number)')
    .eq('status', 'PACKED')
    .order('created_at', { ascending: false })

  // Xử lý logic tính toán
  const bundles = (rawBundles || []).map((b: any) => {
    const logs = b.finishing_logs || []
    return {
      id: b.id,
      bundle_code: b.bundle_code,
      color_code: b.color_code,
      size_code: b.size_code,
      quantity: b.quantity,
      current_stage: b.current_stage,
      order_id: b.cut_tickets?.orders?.id,
      po_number: b.cut_tickets?.orders?.po_number || 'N/A',
      po_total_qty: b.cut_tickets?.orders?.total_quantity || 0,
      trimming_qty: logs.reduce((sum: number, l: any) => sum + (l.trimming_qty || 0), 0),
      ironing_qty: logs.reduce((sum: number, l: any) => sum + (l.ironing_qty || 0), 0),
      final_qc_passed_qty: logs.reduce((sum: number, l: any) => sum + (l.final_qc_passed_qty || 0), 0),
      final_qc_defect_qty: logs.reduce((sum: number, l: any) => sum + (l.final_qc_defect_qty || 0), 0),
    }
  })

  // Tính tổng số đã đóng thùng theo PO để Cảnh báo Ratio
  const packedQtyByPO: Record<string, number> = {}
  cartons?.forEach(c => {
    const po = c.orders?.po_number || 'UNKNOWN'
    packedQtyByPO[po] = (packedQtyByPO[po] || 0) + c.quantity_per_carton
  })

  return { bundles, cartons: cartons || [], packedQtyByPO }
}

export async function createFinishingLog(formData: FormData) {
  const supabase = await createClient()
  // ... (Giữ nguyên logic hàm createFinishingLog cũ)
  const bundle_id = formData.get('bundle_id') as string
  const trimming_qty = parseInt(formData.get('trimming_qty') as string || '0', 10)
  const ironing_qty = parseInt(formData.get('ironing_qty') as string || '0', 10)
  const final_qc_passed_qty = parseInt(formData.get('final_qc_passed_qty') as string || '0', 10)
  const final_qc_defect_qty = parseInt(formData.get('final_qc_defect_qty') as string || '0', 10)
  const notes = formData.get('notes') as string

  if (!bundle_id) return { error: 'Vui lòng chọn Mã vạch Phối kiện!' }

  const { data: bundle } = await supabase.from('cut_bundles').select('id, cut_tickets(order_id)').eq('id', bundle_id).single()
  if (!bundle) return { error: 'Không tìm thấy Bundle!' }

  const { error } = await supabase.from('finishing_logs').insert([{
    bundle_id, order_id: (bundle.cut_tickets as any)?.order_id,
    trimming_qty, ironing_qty, final_qc_passed_qty, final_qc_defect_qty, notes
  }])

  if (error) return { error: `Lỗi: ${error.message}` }
  revalidatePath('/hoan-thanh')
  return { success: true }
}

export async function createCarton(formData: FormData) {
  const supabase = await createClient()
  const bundle_id = formData.get('bundle_id') as string
  const quantity_per_carton = parseInt(formData.get('quantity_per_carton') as string || '24', 10)
  
  if (!bundle_id) return { error: 'Vui lòng chọn Bundle cần đóng thùng!' }

  const { data: bundle } = await supabase.from('cut_bundles')
    .select('color_code, size_code, current_stage, cut_tickets(order_id, orders(po_number))').eq('id', bundle_id).single()

  if (bundle?.current_stage !== 'FINISHING') return { error: 'Bundle chưa qua Final QC!' }

  const order_id = (bundle.cut_tickets as any)?.order_id
  const po_number = (bundle.cut_tickets as any)?.orders?.po_number
  const carton_code = `CTN-${po_number}-${bundle.color_code}-${bundle.size_code}-${Math.floor(1000 + Math.random() * 9000)}`

  const { error } = await supabase.from('cartons').insert([{
    carton_code, order_id, bundle_id, color_code: bundle.color_code, size_code: bundle.size_code,
    quantity_per_carton, status: 'PACKED'
  }])

  if (error) return { error: `Lỗi đóng thùng: ${error.message}` }
  await supabase.from('cut_bundles').update({ current_stage: 'PACKED' }).eq('id', bundle_id)

  revalidatePath('/hoan-thanh')
  return { success: true }
}