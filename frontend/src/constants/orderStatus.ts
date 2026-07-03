import type { OrderStatus } from '../types/order'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '未払い',
  paid: '支払い済み',
  shipped: '発送済み',
  completed: '完了',
}

export const STATUS_SEQUENCE: OrderStatus[] = ['pending', 'paid', 'shipped', 'completed']
