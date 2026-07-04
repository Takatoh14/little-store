import client from './client'
import type { DashboardSummary } from '../types/dashboard'
import type { SalesTrend, SalesTrendGranularity } from '../types/salesTrend'

// GET /admin/dashboard は response()->json([...]) のためflat
export async function getDashboard(): Promise<DashboardSummary> {
  const res = await client.get<DashboardSummary>('/admin/dashboard')
  return res.data
}

// GET /admin/dashboard/sales-trend は response()->json([...]) のためflat
export async function getSalesTrend(params: {
  granularity: SalesTrendGranularity
  date?: string
  year?: number
  start_year?: number
  end_year?: number
}): Promise<SalesTrend> {
  const res = await client.get<SalesTrend>('/admin/dashboard/sales-trend', { params })
  return res.data
}
