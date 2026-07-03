import client from './client'
import type { WrappedList } from '../types/api'
import type { Category } from '../types/product'

// GET /categories はCollection::collection()をそのまま返すため{data:[...]}にラップされる(非ページネート)
export async function getCategories(): Promise<Category[]> {
  const res = await client.get<WrappedList<Category>>('/categories')
  return res.data.data
}
