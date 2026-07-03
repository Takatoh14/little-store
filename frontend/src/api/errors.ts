import { AxiosError } from 'axios'
import type { ApiErrorBody } from '../types/api'

const DEFAULT_MESSAGE = '通信エラーが発生しました。しばらくしてから再度お試しください。'

export function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const body = err.response?.data as ApiErrorBody | undefined
    if (body?.message) return body.message
  }
  return DEFAULT_MESSAGE
}

// errors の各値を文字列に防御的に変換する
// (OrderControllerの在庫不足エラーはerrors.product_idに数値IDの配列を入れるため、
//  「常にstring[]」という前提を置かずString()で変換する)
export function extractFieldErrors(err: unknown): Record<string, string> | null {
  if (!(err instanceof AxiosError)) return null

  const body = err.response?.data as ApiErrorBody | undefined
  if (!body?.errors) return null

  const result: Record<string, string> = {}
  for (const [field, messages] of Object.entries(body.errors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      result[field] = String(messages[0])
    }
  }
  return result
}

export function getStatus(err: unknown): number | undefined {
  return err instanceof AxiosError ? err.response?.status : undefined
}
