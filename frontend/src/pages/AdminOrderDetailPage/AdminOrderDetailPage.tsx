import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { extractMessage } from '../../api/errors'
import { approveCancelOrder, getAdminOrder, rejectCancelOrder, updateAdminOrderStatus } from '../../api/orders'
import { Button } from '../../components/Button/Button'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { STATUS_LABELS, STATUS_SEQUENCE } from '../../constants/orderStatus'
import { useAsync } from '../../hooks/useAsync'
import type { Order } from '../../types/order'
import styles from './AdminOrderDetailPage.module.scss'

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    data: fetchedOrder,
    isLoading,
    error,
    errorStatus,
  } = useAsync(() => getAdminOrder(Number(id)), [id])

  const [order, setOrder] = useState<Order | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [isAdvancing, setIsAdvancing] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fetchedOrder) setOrder(fetchedOrder)
  }, [fetchedOrder])

  const handleAdvance = async (nextStatus: Order['status']) => {
    if (!order) return
    setBanner(null)
    setIsAdvancing(true)
    try {
      const updated = await updateAdminOrderStatus(order.id, nextStatus)
      setOrder(updated)
    } catch (err) {
      setBanner(extractMessage(err))
    } finally {
      setIsAdvancing(false)
    }
  }

  const handleApproveCancel = async () => {
    if (!order) return
    setBanner(null)
    setIsAdvancing(true)
    try {
      setOrder(await approveCancelOrder(order.id))
    } catch (err) {
      setBanner(extractMessage(err))
    } finally {
      setIsAdvancing(false)
    }
  }

  const handleRejectCancel = async () => {
    if (!order) return
    setBanner(null)
    setIsAdvancing(true)
    try {
      setOrder(await rejectCancelOrder(order.id))
    } catch (err) {
      setBanner(extractMessage(err))
    } finally {
      setIsAdvancing(false)
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

  // completed/cancelledは終端ステータスのため次のステータスを持たない
  // (indexOfが-1を返すcancelledをガードしないとSTATUS_SEQUENCE[0]='pending'が
  //  誤って「次のステータス」として算出されてしまう)
  const nextStatus =
    order.status === 'completed' || order.status === 'cancelled'
      ? undefined
      : STATUS_SEQUENCE[STATUS_SEQUENCE.indexOf(order.status) + 1]

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>注文詳細 #{order.id}</h1>

      {banner && <p className={styles.banner}>{banner}</p>}

      {order.cancel_requested_at ? (
        <div className={styles.cancelActions}>
          <p className={styles.cancelRequestedBadge}>キャンセル申請中です</p>
          <Button disabled={isAdvancing} onClick={handleApproveCancel}>
            キャンセルを承認する
          </Button>
          <Button variant="secondary" disabled={isAdvancing} onClick={handleRejectCancel}>
            キャンセルを却下する
          </Button>
        </div>
      ) : nextStatus ? (
        <Button className={styles.advanceButton} disabled={isAdvancing} onClick={() => handleAdvance(nextStatus)}>
          {STATUS_LABELS[nextStatus]}にする
        </Button>
      ) : (
        <span className={styles.completedBadge}>{STATUS_LABELS[order.status]}</span>
      )}

      <div className={styles.detail}>
        <div className={styles.detailRow}>
          <span>注文者</span>
          <span>
            {order.user?.name} / {order.user?.email}
          </span>
        </div>
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

      <Link to="/admin/orders" className={styles.backLink}>
        &lt; 注文管理に戻る
      </Link>
    </section>
  )
}
