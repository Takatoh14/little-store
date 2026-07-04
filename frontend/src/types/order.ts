export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_image_url: string | null
  price: number
  quantity: number
}

export interface Order {
  id: number
  status: OrderStatus
  cancel_requested_at: string | null
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
