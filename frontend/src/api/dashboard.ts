import client from './client'
import type { DashboardSummary } from '../types/dashboard'
import type { SalesTrend, SalesTrendGranularity } from '../types/salesTrend'

// GET /admin/dashboard は response()->json([...]) のためflat
export async function getDashboard(): Promise<DashboardSummary> {
  const res = await client.get<DashboardSummary>('/admin/dashboard')
  return res.data
}

// GET /admin/dashboard/sales-trend は response()->json([...]) のためflat
export async function getSalesTrend(granularity: SalesTrendGranularity): Promise<SalesTrend> {
  const res = await client.get<SalesTrend>('/admin/dashboard/sales-trend', { params: { granularity } })
  return res.data
}
