import client from './client'
import type { DashboardSummary } from '../types/dashboard'

// GET /admin/dashboard は response()->json([...]) のためflat
export async function getDashboard(): Promise<DashboardSummary> {
  const res = await client.get<DashboardSummary>('/admin/dashboard')
  return res.data
}
