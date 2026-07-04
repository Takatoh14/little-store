import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { extractMessage } from '../../api/errors'
import { completeOrder, getOrder, requestCancelOrder } from '../../api/orders'
import { Button } from '../../components/Button/Button'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { STATUS_LABELS } from '../../constants/orderStatus'
import { useAsync } from '../../hooks/useAsync'
import type { Order } from '../../types/order'
import styles from './OrderHistoryDetailPage.module.scss'

export function OrderHistoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    data: fetchedOrder,
    isLoading,
    error,
    errorStatus,
  } = useAsync(() => getOrder(Number(id)), [id])

  const [order, setOrder] = useState<Order | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fetchedOrder) setOrder(fetchedOrder)
  }, [fetchedOrder])

  const handleComplete = async () => {
    if (!order) return
    setBanner(null)
    setIsSubmitting(true)
    try {
      setOrder(await completeOrder(order.id))
    } catch (err) {
      setBanner(extractMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestCancel = async () => {
    if (!order) return
    if (!window.confirm('この注文のキャンセルを申請しますか？')) return
    setBanner(null)
    setIsSubmitting(true)
    try {
      setOrder(await requestCancelOrder(order.id))
    } catch (err) {
      setBanner(extractMessage(err))
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

  if (error || !order) {
    return (
      <section className={styles.section}>
        <ErrorMessage text={errorStatus === 404 ? '注文が見つかりません' : error ?? '注文が見つかりません'} />
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>注文詳細 #{order.id}</h1>

      {banner && <p className={styles.banner}>{banner}</p>}

      {order.status === 'shipped' && (
        <Button className={styles.actionButton} disabled={isSubmitting} onClick={handleComplete}>
          受け取り済にする
        </Button>
      )}

      {(order.status === 'pending' || order.status === 'paid') &&
        (order.cancel_requested_at ? (
          <p className={styles.cancelRequestedBadge}>キャンセル申請中です</p>
        ) : (
          <Button className={styles.actionButton} disabled={isSubmitting} onClick={handleRequestCancel}>
            キャンセルを申請する
          </Button>
        ))}

      <div className={styles.detail}>
        <div className={styles.detailRow}>
          <span>注文日時</span>
          <span>{new Date(order.created_at).toLocaleString('ja-JP')}</span>
        </div>
        <div className={styles.detailRow}>
          <span>ステータス</span>
          <span>{STATUS_LABELS[order.status]}</span>
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
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span>¥{(item.price * item.quantity).toLocaleString('ja-JP')}</span>
              </div>
            ))}
          </>
        )}
      </div>

      <Link to="/orders" className={styles.backLink}>
        &lt; 注文履歴に戻る
      </Link>
    </section>
  )
}
