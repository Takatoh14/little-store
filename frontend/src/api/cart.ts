import client from './client'
import type { WrappedList } from '../types/api'
import type { CartItem } from '../types/cart'

// GET /cart は非ページネートだが{data:[...]}にラップされる
export async function getCart(): Promise<CartItem[]> {
  const res = await client.get<WrappedList<CartItem>>('/cart')
  return res.data.data
}

// POST /cart は response()->json(new CartItemResource(...)) のためflat
export async function addToCart(payload: { product_id: number; quantity: number }): Promise<CartItem> {
  const res = await client.post<CartItem>('/cart', payload)
  return res.data
}

export async function updateCartItem(id: number, payload: { quantity: number }): Promise<CartItem> {
  const res = await client.put<CartItem>(`/cart/${id}`, payload)
  return res.data
}

export async function removeCartItem(id: number): Promise<void> {
  await client.delete(`/cart/${id}`)
}
