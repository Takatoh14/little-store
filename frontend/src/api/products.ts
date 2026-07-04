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

// GET /admin/products は公開の一覧と同じ形(Collectionをそのまま返す)のためページネートラップ
export async function getAdminProducts(params: { category_id?: number; page?: number }): Promise<Paginated<Product>> {
  const res = await client.get<Paginated<Product>>('/admin/products', { params })
  return res.data
}

// GET /admin/products/{id} は response()->json(new ProductResource(...)) のためflat
// (公開側のgetProductは非公開商品で404になるため、管理画面の編集フォームはこちらを使う)
export async function getAdminProduct(id: number): Promise<Product> {
  const res = await client.get<Product>(`/admin/products/${id}`)
  return res.data
}

// POST /admin/products は response()->json(new ProductResource(...), 201) のためflat
export async function createAdminProduct(formData: FormData): Promise<Product> {
  const res = await client.post<Product>('/admin/products', formData)
  return res.data
}

// PHPは真のPUTリクエストでは$_FILES/multipartを解析しないため、
// POST + _methodフィールドによるメソッドスプーフィングで送信する
export async function updateAdminProduct(id: number, formData: FormData): Promise<Product> {
  formData.append('_method', 'PUT')
  const res = await client.post<Product>(`/admin/products/${id}`, formData)
  return res.data
}

export async function deleteAdminProduct(id: number): Promise<void> {
  await client.delete(`/admin/products/${id}`)
}
