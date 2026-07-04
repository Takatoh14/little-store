import type { Order } from './order'

export interface CategoryBreakdownEntry {
  category_name: string
  total: number
}

export interface ContactCounts {
  unread: number
  read: number
  answered: number
}

export interface DashboardSummary {
  monthly_sales: number
  monthly_order_count: number
  member_count: number
  out_of_stock_count: number
  contact_counts: ContactCounts
  category_breakdown: CategoryBreakdownEntry[]
  recent_orders: Order[]
}
