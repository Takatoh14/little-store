import client from './client'
import type { Paginated } from '../types/api'
import type { Order, OrderStatus } from '../types/order'

// GET /orders はCollectionをそのまま返すためLaravelが自動でページネートラップする
export async function getOrders(page?: number): Promise<Paginated<Order>> {
  const res = await client.get<Paginated<Order>>('/orders', { params: { page } })
  return res.data
}

// GET /orders/{id}, POST /orders は response()->json(new OrderResource(...)) のためflat
export async function getOrder(id: number): Promise<Order> {
  const res = await client.get<Order>(`/orders/${id}`)
  return res.data
}

export async function createOrder(payload: {
  postal_code: string
  address: string
  phone: string
}): Promise<Order> {
  const res = await client.post<Order>('/orders', payload)
  return res.data
}

// GET /admin/orders はCollectionをそのまま返すためページネートラップ
export async function getAdminOrders(page?: number): Promise<Paginated<Order>> {
  const res = await client.get<Paginated<Order>>('/admin/orders', { params: { page } })
  return res.data
}

// GET/PUT /admin/orders/{id} は response()->json(new OrderResource(...)) のためflat
export async function getAdminOrder(id: number): Promise<Order> {
  const res = await client.get<Order>(`/admin/orders/${id}`)
  return res.data
}

export async function updateAdminOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const res = await client.put<Order>(`/admin/orders/${id}`, { status })
  return res.data
}
