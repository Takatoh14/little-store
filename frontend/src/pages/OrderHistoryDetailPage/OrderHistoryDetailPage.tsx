import { Link, useParams } from 'react-router-dom'
import { getOrder } from '../../api/orders'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { STATUS_LABELS } from '../../constants/orderStatus'
import { useAsync } from '../../hooks/useAsync'
import styles from './OrderHistoryDetailPage.module.scss'

export function OrderHistoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    data: order,
    isLoading,
    error,
    errorStatus,
  } = useAsync(() => getOrder(Number(id)), [id])

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
