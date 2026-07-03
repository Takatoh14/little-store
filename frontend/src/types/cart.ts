// CartItemResourceは商品のname/priceのみを埋め込む（Productの全項目ではない）
export interface CartItem {
  id: number
  product_id: number
  quantity: number
  product: {
    name: string
    price: number
  }
}
