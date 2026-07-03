export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  stock: number
  image_url: string | null
  category: Category
}
