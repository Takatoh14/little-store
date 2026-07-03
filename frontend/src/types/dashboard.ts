import type { Order } from './order'

export interface SalesTrendPoint {
  month: string
  total: number
}

export interface CategoryBreakdownEntry {
  category_name: string
  total: number
}

export interface DashboardSummary {
  monthly_sales: number
  monthly_order_count: number
  member_count: number
  out_of_stock_count: number
  sales_trend: SalesTrendPoint[]
  category_breakdown: CategoryBreakdownEntry[]
  recent_orders: Order[]
}
