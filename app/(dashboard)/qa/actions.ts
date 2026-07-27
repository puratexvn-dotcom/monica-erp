'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface QADefect {
  id: string
  defect_type: string
  quantity: number
  image_url?: string
}

export interface QAReport {
  id: string
  order_id: string
  po_number?: string
  style_code?: string
  line_name: string
  time_slot: string
  inspected_qty: number
  passed_qty: number
  defect_qty: number
  notes?: string
  created_at: string
  qa_defects?: QADefect[]
}

/**
 * Lấy danh sách báo cáo QA/QC kèm chi tiết lỗi và thông tin PO
 */
export async function getQAReports(): Promise<QAReport[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('qa_audit_reports')
    .select(`
      *,
      orders ( po_number, style_code ),
      qa_defects ( id, defect_type, quantity, image_url )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Lỗi lấy danh sách báo cáo QA:', error.message)
    return []
  }

  return data.map((item: any) => ({
    ...item,
    po_number: item.orders?.po_number || 'N/A',
    style_code: item.orders?.style_code || 'N/A',
  })) as QAReport[]
}

/**
 * Lấy danh sách PO khả dụng để hiển thị trên Dropdown
 */
export async function getOrdersForSelect() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('id, po_number, style_code')
    .order('created_at', { ascending: false })
  return data || []
}

/**
 * Tạo Báo cáo Kiểm hàng QA/QC mới
 */
export async function createQAReport(formData: FormData) {
  const supabase = await createClient()

  const order_id = formData.get('order_id') as string
  const line_name = formData.get('line_name') as string
  const time_slot = formData.get('time_slot') as string
  const inspected_qty = parseInt(formData.get('inspected_qty') as string, 10)
  const defect_qty = parseInt(formData.get('defect_qty') as string, 10)
  const defect_type = formData.get('defect_type') as string
  const image_url = formData.get('image_url') as string
  const notes = formData.get('notes') as string

  if (!order_id || !line_name || !time_slot || isNaN(inspected_qty)) {
    return { error: 'Vui lòng điền đầy đủ các thông tin bắt buộc!' }
  }

  const passed_qty = Math.max(0, inspected_qty - (isNaN(defect_qty) ? 0 : defect_qty))

  // 1. Tạo phiếu báo cáo tổng
  const { data: report, error: reportError } = await supabase
    .from('qa_audit_reports')
    .insert([
      {
        order_id,
        line_name,
        time_slot,
        inspected_qty,
        passed_qty,
        defect_qty: isNaN(defect_qty) ? 0 : defect_qty,
        notes,
      },
    ])
    .select()
    .single()

  if (reportError || !report) {
    return { error: `Không thể lưu báo cáo QA: ${reportError?.message}` }
  }

  // 2. Nếu có phát hiện lỗi, tạo bản ghi chi tiết lỗi
  if (defect_qty > 0 && defect_type) {
    const { error: defectError } = await supabase.from('qa_defects').insert([
      {
        audit_report_id: report.id,
        defect_type,
        quantity: defect_qty,
        image_url: image_url || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
      },
    ])

    if (defectError) {
      console.error('Lỗi ghi nhận chi tiết lỗi QA:', defectError.message)
    }
  }

  revalidatePath('/qa')
  return { success: true }
}