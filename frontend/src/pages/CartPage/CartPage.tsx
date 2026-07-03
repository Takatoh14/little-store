import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import { QuantityInput } from '../../components/QuantityInput/QuantityInput'
import { EmptyMessage, ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { useCart } from '../../hooks/useCart'
import styles from './CartPage.module.scss'

export function CartPage() {
  const { items, isLoading, error, totalPrice, updateItem, removeItem } = useCart()
  const navigate = useNavigate()
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({})

  const handleQuantityChange = async (cartItemId: number, quantity: number) => {
    setItemErrors((prev) => ({ ...prev, [cartItemId]: '' }))
    try {
      await updateItem(cartItemId, quantity)
    } catch (err) {
      setItemErrors((prev) => ({ ...prev, [cartItemId]: extractMessage(err) }))
    }
  }

  const handleRemove = async (cartItemId: number) => {
    if (!window.confirm('カートから削除しますか？')) return
    await removeItem(cartItemId)
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>カート</h1>

      {isLoading && <LoadingMessage />}
      {error && <ErrorMessage text={error} />}

      {!isLoading && items.length === 0 && (
        <>
          <EmptyMessage text="カートは空です" />
          <p style={{ textAlign: 'center' }}>
            <Link to="/products">商品を見る &gt;</Link>
          </p>
        </>
      )}

      {items.length > 0 && (
        <>
          <div className={styles.list}>
            {items.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <p className={styles.itemName}>{item.product.name}</p>
                  <p className={styles.itemPrice}>¥{item.product.price.toLocaleString('ja-JP')}</p>
                  {itemErrors[item.id] && <p className={styles.itemError}>{itemErrors[item.id]}</p>}
                </div>
                <QuantityInput value={item.quantity} onChange={(q) => handleQuantityChange(item.id, q)} />
                <p className={styles.itemSubtotal}>
                  ¥{(item.product.price * item.quantity).toLocaleString('ja-JP')}
                </p>
                <button type="button" className={styles.removeButton} onClick={() => handleRemove(item.id)}>
                  削除
                </button>
              </div>
            ))}
          </div>

          <div className={styles.summary}>
            <span className={styles.totalLabel}>合計</span>
            <span className={styles.totalPrice}>¥{totalPrice.toLocaleString('ja-JP')}</span>
          </div>

          <Button className={styles.checkoutButton} onClick={() => navigate('/checkout')}>
            レジに進む
          </Button>
        </>
      )}
    </section>
  )
}
