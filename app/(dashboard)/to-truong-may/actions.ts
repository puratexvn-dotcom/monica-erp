'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SewingLine {
  id: string
  line_code: string
  line_name: string
  target_pcs_per_hour: number
}

export interface HourlyLog {
  id: string
  line_name?: string
  po_number?: string
  style_code?: string
  log_date: string
  time_slot: string
  operator_count: number
  target_qty: number
  actual_qty: number
  rework_qty: number
  notes?: string
  created_at: string
}

export interface NeedleBreakLog {
  id: string
  line_name?: string
  operator_name: string
  machine_code: string
  needle_type: string
  reason: string
  fragments_found: boolean
  evidence_image_url: string
  created_at: string
}

/**
 * Lấy toàn bộ dữ liệu cần thiết cho Dashboard Tổ May
 */
export async function getSewingDashboardData() {
  const supabase = await createClient()

  // 1. Danh sách Chuyền may
  const { data: lines } = await supabase
    .from('sewing_lines')
    .select('id, line_code, line_name, target_pcs_per_hour')
    .eq('status', 'ACTIVE')
    .order('line_code', { ascending: true })

  // 2. Danh sách PO khả dụng
  const { data: orders } = await supabase
    .from('orders')
    .select('id, po_number, style_code')
    .order('created_at', { ascending: false })

  // 3. Nhật ký sản lượng hôm nay
  const { data: rawLogs } = await supabase
    .from('hourly_production_logs')
    .select(`
      *,
      sewing_lines ( line_name ),
      orders ( po_number, style_code )
    `)
    .order('created_at', { ascending: false })
    .limit(30)

  const hourlyLogs: HourlyLog[] = (rawLogs || []).map((item: any) => ({
    ...item,
    line_name: item.sewing_lines?.line_name || 'Chuyền N/A',
    po_number: item.orders?.po_number || 'N/A',
    style_code: item.orders?.style_code || 'N/A',
  }))

  // 4. Nhật ký gãy kim gần đây
  const { data: rawNeedleLogs } = await supabase
    .from('needle_break_logs')
    .select(`
      *,
      sewing_lines ( line_name )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  const needleLogs: NeedleBreakLog[] = (rawNeedleLogs || []).map((item: any) => ({
    ...item,
    line_name: item.sewing_lines?.line_name || 'Chuyền N/A',
  }))

  return {
    lines: lines || [],
    orders: orders || [],
    hourlyLogs,
    needleLogs,
  }
}

/**
 * Ghi nhận Báo cáo Sản lượng May theo Giờ
 */
export async function createHourlyProductionLog(formData: FormData) {
  const supabase = await createClient()

  const line_id = formData.get('line_id') as string
  const order_id = formData.get('order_id') as string
  const time_slot = formData.get('time_slot') as string
  const operator_count = parseInt(formData.get('operator_count') as string, 10)
  const target_qty = parseInt(formData.get('target_qty') as string, 10)
  const actual_qty = parseInt(formData.get('actual_qty') as string, 10)
  const rework_qty = parseInt(formData.get('rework_qty') as string || '0', 10)
  const notes = formData.get('notes') as string

  if (!line_id || !order_id || !time_slot || isNaN(target_qty) || isNaN(actual_qty)) {
    return { error: 'Vui lòng nhập đầy đủ thông tin báo cáo sản lượng!' }
  }

  const { error } = await supabase.from('hourly_production_logs').insert([
    {
      line_id,
      order_id,
      time_slot,
      operator_count,
      target_qty,
      actual_qty,
      rework_qty,
      notes,
    },
  ])

  if (error) {
    return { error: `Lỗi ghi nhận sản lượng: ${error.message}` }
  }

  revalidatePath('/to-truong-may')
  return { success: true }
}

/**
 * Báo cáo sự cố Gãy kim (Needle Safety Policy)
 */
export async function createNeedleBreakLog(formData: FormData) {
  const supabase = await createClient()

  const line_id = formData.get('line_id') as string
  const operator_name = formData.get('operator_name') as string
  const machine_code = formData.get('machine_code') as string
  const needle_type = formData.get('needle_type') as string
  const reason = formData.get('reason') as string
  const fragments_found = formData.get('fragments_found') === 'on'
  const evidence_image_url = formData.get('evidence_image_url') as string

  if (!line_id || !operator_name || !machine_code || !evidence_image_url) {
    return { error: 'Bắt buộc nhập tên công nhân, mã máy và đường dẫn ảnh bằng chứng dán mảnh kim!' }
  }

  if (!fragments_found) {
    return { error: 'CẢNH BÁO AN TOÀN: Không thể cấp kim mới nếu chưa tìm thấy đầy đủ các mảnh kim gãy!' }
  }

  const { error } = await supabase.from('needle_break_logs').insert([
    {
      line_id,
      operator_name,
      machine_code,
      needle_type,
      reason,
      fragments_found: true,
      evidence_image_url,
    },
  ])

  if (error) {
    return { error: `Lỗi ghi nhận báo cáo gãy kim: ${error.message}` }
  }

  revalidatePath('/to-truong-may')
  return { success: true }
}