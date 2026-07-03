import { useCallback, useEffect, useState } from 'react'
import { getStatus } from '../api/errors'

interface UseAsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  errorStatus: number | undefined
  refetch: () => void
}

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[],
  errorMessage = 'データの取得に失敗しました',
): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | undefined>(undefined)
  const [reloadCount, setReloadCount] = useState(0)

  // depsは呼び出し元ごとに要素数が異なる動的な配列のため、useCallbackの依存配列に
  // そのままスプレッドできない(ESLintがリテラル配列を要求する)。JSON化して単一のキーにする
  const depsKey = JSON.stringify(deps)

  const load = useCallback(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setErrorStatus(undefined)

    fn()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(errorMessage)
          setErrorStatus(getStatus(err))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey, reloadCount])

  // depsKey/reloadCountが変わるたびに読み込み直す標準的なdata-fetchingパターン
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => load(), [load])

  const refetch = useCallback(() => setReloadCount((c) => c + 1), [])

  return { data, isLoading, error, errorStatus, refetch }
}
