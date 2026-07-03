import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as cartApi from '../api/cart'
import { useAuth } from '../hooks/useAuth'
import type { CartItem } from '../types/cart'

interface CartContextValue {
  items: CartItem[]
  isLoading: boolean
  error: string | null
  totalCount: number
  totalPrice: number
  refetch: () => Promise<void>
  addItem: (productId: number, quantity: number) => Promise<void>
  updateItem: (cartItemId: number, quantity: number) => Promise<void>
  removeItem: (cartItemId: number) => Promise<void>
  clear: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await cartApi.getCart()
      setItems(data)
    } catch {
      setError('カート情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    setItems([])
  }, [])

  // ログイン状態になったらカートを取得し、ログアウトしたら空にする。
  useEffect(() => {
    if (user) {
      // refetch内の最初のsetIsLoading(true)がeffect本体から直接呼ばれる形になるが、
      // 「依存値が変わったら再フェッチする」という標準的なdata-fetchingパターンであり意図的なもの
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refetch()
    } else {
      clear()
    }
  }, [user, refetch, clear])

  const addItem = useCallback(
    async (productId: number, quantity: number) => {
      await cartApi.addToCart({ product_id: productId, quantity })
      await refetch()
    },
    [refetch],
  )

  const updateItem = useCallback(
    async (cartItemId: number, quantity: number) => {
      await cartApi.updateCartItem(cartItemId, { quantity })
      await refetch()
    },
    [refetch],
  )

  const removeItem = useCallback(
    async (cartItemId: number) => {
      await cartApi.removeCartItem(cartItemId)
      await refetch()
    },
    [refetch],
  )

  const totalCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    [items],
  )

  return (
    <CartContext.Provider
      value={{ items, isLoading, error, totalCount, totalPrice, refetch, addItem, updateItem, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  )
}
