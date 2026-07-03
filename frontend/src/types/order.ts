export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed'

export interface OrderItem {
  id: number
  product_id: number
  price: number
  quantity: number
}

export interface Order {
  id: number
  status: OrderStatus
  total_price: number
  shipping_address: string
  phone: string
  created_at: string
  items: OrderItem[]
  // orders.show/storeではuserがeager-loadされないためキー自体が存在しない
  user?: {
    id: number
    name: string
    email: string
  }
}
