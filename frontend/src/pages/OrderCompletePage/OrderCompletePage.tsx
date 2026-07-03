import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getOrder } from '../../api/orders'
import { extractMessage, getStatus } from '../../api/errors'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import type { Order } from '../../types/order'
import styles from './OrderCompletePage.module.scss'

export function OrderCompletePage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const stateOrder = (location.state as { order?: Order } | null)?.order

  const [order, setOrder] = useState<Order | null>(stateOrder ?? null)
  const [isLoading, setIsLoading] = useState(!stateOrder)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | undefined>(undefined)

  useEffect(() => {
    // location.stateがある場合(決済直後の遷移)は再フェッチしない。
    // 直接アクセス/リロード時のみGET /api/orders/{id}にフォールバックする
    if (stateOrder) return

    // 標準的なdata-fetchingパターン(マウント時にロード状態をtrueにしてフェッチする)のため
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true)
    getOrder(Number(id))
      .then(setOrder)
      .catch((err) => {
        setError(extractMessage(err))
        setErrorStatus(getStatus(err))
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (isLoading) {
    return (
      <section className={styles.section}>
        <LoadingMessage />
      </section>
    )
  }

  if (error || !order) {
    return (
      <section className={styles.section}>
        <ErrorMessage text={errorStatus === 404 ? '注文が見つかりません' : error ?? '注文が見つかりません'} />
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <p className={styles.icon}>✓</p>
      <h1 className={styles.title}>ご注文ありがとうございました</h1>
      <p className={styles.lead}>注文番号: #{order.id}</p>

      <div className={styles.detail}>
        <div className={styles.detailRow}>
          <span>ステータス</span>
          <span>{order.status}</span>
        </div>
        <div className={styles.detailRow}>
          <span>配送先</span>
          <span>{order.shipping_address}</span>
        </div>
        <div className={styles.detailRow}>
          <span>電話番号</span>
          <span>{order.phone}</span>
        </div>
        <div className={styles.detailRow}>
          <span>合計金額</span>
          <span>¥{order.total_price.toLocaleString('ja-JP')}</span>
        </div>

        {order.items.length > 0 && (
          <>
            <p className={styles.itemsTitle}>注文内容</p>
            {order.items.map((item) => (
              <div key={item.id} className={styles.detailRow}>
                <span>{item.product_name} × {item.quantity}</span>
                <span>¥{(item.price * item.quantity).toLocaleString('ja-JP')}</span>
              </div>
            ))}
          </>
        )}
      </div>

      <Link to="/products">お買い物を続ける &gt;</Link>
    </section>
  )
}
