import client from './client'
import type { PaymentSuccess } from '../types/payment'

// 成功時は{status,order_id}(200)、拒否時は{message,decline_code}(402)のためエラーはcatch側でハンドリングする
export async function createPayment(payload: {
  order_id: number
  payment_method_id: string
}): Promise<PaymentSuccess> {
  const res = await client.post<PaymentSuccess>('/payments', payload)
  return res.data
}
