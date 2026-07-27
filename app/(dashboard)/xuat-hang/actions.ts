'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getLogisticsData() {
  const supabase = await createClient()

  // 1. Thùng đang ở xưởng (Chờ thủ kho quét mã nhập kho)
  const { data: pendingCartons } = await supabase.from('cartons').select('carton_code, orders(po_number)').eq('status', 'PACKED')
  
  // 2. Thùng đã vào Kho Thành Phẩm (Sẵn sàng xuất)
  const { data: fgCartons } = await supabase.from('cartons').select('id, carton_code, quantity_per_carton, orders(po_number)').eq('status', 'IN_FG_WAREHOUSE').order('created_at', { ascending: false })

  // 3. Danh sách Container
  const { data: shipments } = await supabase.from('shipments').select('*, orders(po_number)').order('created_at', { ascending: false })

  return { 
    pendingCount: pendingCartons?.length || 0,
    fgCartons: fgCartons || [], 
    shipments: shipments || [] 
  }
}

/** Thủ kho quét mã vạch thùng để nhận hàng từ Tổ Hoàn Thành vào Kho Thành Phẩm */
export async function scanInCartonToFG(formData: FormData) {
  const supabase = await createClient()
  const carton_code = formData.get('carton_code') as string

  if (!carton_code) return { error: 'Vui lòng quét Mã vạch thùng!' }

  const { data: carton } = await supabase.from('cartons').select('id, status').eq('carton_code', carton_code).single()
  
  if (!carton) return { error: 'Mã vạch thùng không tồn tại!' }
  if (carton.status !== 'PACKED') return { error: `Thùng này đang ở trạng thái: ${carton.status}` }

  const { error } = await supabase.from('cartons').update({ status: 'IN_FG_WAREHOUSE' }).eq('id', carton.id)
  
  if (error) return { error: error.message }
  revalidatePath('/xuat-hang')
  return { success: true }
}

export async function createShipment(formData: FormData) {
  const supabase = await createClient()
  const po_number = formData.get('po_number') as string
  const container_no = formData.get('container_no') as string
  const destination_port = formData.get('destination_port') as string

  const { data: order } = await supabase.from('orders').select('id').eq('po_number', po_number).single()
  if (!order) return { error: 'Không tìm thấy PO!' }

  const shipment_no = `EXP-${Date.now().toString().slice(-6)}`
  await supabase.from('shipments').insert([{ shipment_no, order_id: order.id, container_no, destination_port, status: 'DRAFT' }])
  
  revalidatePath('/xuat-hang')
  return { success: true }
}