import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { extractMessage } from '../../api/errors'
import { getProduct } from '../../api/products'
import { Button } from '../../components/Button/Button'
import { QuantityInput } from '../../components/QuantityInput/QuantityInput'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { useAsync } from '../../hooks/useAsync'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import styles from './ProductDetailPage.module.scss'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const { user } = useAuth()
  const { addItem } = useCart()

  const {
    data: product,
    isLoading,
    error,
    errorStatus,
  } = useAsync(() => getProduct(productId), [productId])

  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddToCart = async () => {
    setFeedback(null)
    setIsSubmitting(true)
    try {
      await addItem(productId, quantity)
      setFeedback({ type: 'success', text: 'カートに追加しました' })
    } catch (err) {
      setFeedback({ type: 'error', text: extractMessage(err) })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section className={styles.section}>
        <LoadingMessage />
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.section}>
        <ErrorMessage text={errorStatus === 404 ? '商品が見つかりません' : error} />
      </section>
    )
  }

  if (!product) return null

  const maxQuantity = Math.min(99, product.stock)

  return (
    <section className={styles.section}>
      <div className={styles.layout}>
        <div className={styles.imageWrapper}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className={styles.image} />
          ) : (
            <span className={styles.imagePlaceholder}>画像なし</span>
          )}
        </div>

        <div className={styles.info}>
          <p className={styles.category}>{product.category.name}</p>
          <h1 className={styles.name}>{product.name}</h1>
          <p className={styles.price}>¥{product.price.toLocaleString('ja-JP')}</p>
          {product.description && <p className={styles.description}>{product.description}</p>}

          <p className={styles.stock}>
            {product.stock > 0 ? `在庫: ${product.stock}点` : <span className={styles.outOfStock}>在庫切れ</span>}
          </p>

          {product.stock > 0 &&
            (user ? (
              <>
                <div className={styles.addToCartRow}>
                  <QuantityInput value={quantity} max={maxQuantity} onChange={setQuantity} />
                  <Button type="button" onClick={handleAddToCart} disabled={isSubmitting}>
                    カートに追加
                  </Button>
                </div>
                {feedback && (
                  <p className={feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}>
                    {feedback.text}
                    {feedback.type === 'success' && (
                      <>
                        {' '}
                        <Link to="/cart">カートを見る &gt;</Link>
                      </>
                    )}
                  </p>
                )}
              </>
            ) : (
              <p className={styles.loginPrompt}>
                カートに入れるには<Link to={`/login?redirect=/products/${product.id}`}>ログイン</Link>が必要です
              </p>
            ))}
        </div>
      </div>
    </section>
  )
}
