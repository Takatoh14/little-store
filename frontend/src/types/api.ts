export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

export interface Paginated<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
}

// 非ページネートの一覧ラップ（例: GET /cart）
export interface WrappedList<T> {
  data: T[]
}

// errorsの値は必ずしも文字列配列とは限らない
// （OrderControllerの在庫不足エラーはerrors.product_idに数値IDの配列を入れる）
export interface ApiErrorBody {
  message: string
  errors?: Record<string, unknown[]>
}
