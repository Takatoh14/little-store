import client from './client'
import type { Paginated } from '../types/api'
import type { Product } from '../types/product'

// GET /products はコントローラがCollectionをそのまま返すためLaravelが自動でページネートラップする
export async function getProducts(params: { category_id?: number; page?: number }): Promise<Paginated<Product>> {
  const res = await client.get<Paginated<Product>>('/products', { params })
  return res.data
}

// GET /products/{id} は response()->json(new ProductResource(...)) のためflat
export async function getProduct(id: number): Promise<Product> {
  const res = await client.get<Product>(`/products/${id}`)
  return res.data
}
