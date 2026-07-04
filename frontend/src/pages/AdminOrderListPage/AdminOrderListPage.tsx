import { Link, useSearchParams } from 'react-router-dom'
import { getAdminOrders } from '../../api/orders'
import { Pagination } from '../../components/Pagination/Pagination'
import { EmptyMessage, ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { STATUS_LABELS, STATUS_SEQUENCE } from '../../constants/orderStatus'
import { useAsync } from '../../hooks/useAsync'
import type { OrderStatus } from '../../types/order'
import styles from './AdminOrderListPage.module.scss'

const ALL_STATUSES: OrderStatus[] = [...STATUS_SEQUENCE, 'cancelled']

export function AdminOrderListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const status = (searchParams.get('status') as OrderStatus | null) ?? undefined
  const hasCancelRequest = searchParams.get('has_cancel_request') === '1'

  const {
    data: orders,
    isLoading,
    error,
  } = useAsync(() => getAdminOrders({ page, status, has_cancel_request: hasCancelRequest }), [
    page,
    status,
    hasCancelRequest,
  ])

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const handleStatusChange = (nextStatus: string) => {
    const next = new URLSearchParams(searchParams)
    if (nextStatus === '') next.delete('status')
    else next.set('status', nextStatus)
    next.delete('page')
    setSearchParams(next)
  }

  const handleCancelRequestToggle = (checked: boolean) => {
    const next = new URLSearchParams(searchParams)
    if (checked) next.set('has_cancel_request', '1')
    else next.delete('has_cancel_request')
    next.delete('page')
    setSearchParams(next)
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>注文管理</h1>

      <div className={styles.filters}>
        <select value={status ?? ''} onChange={(e) => handleStatusChange(e.target.value)}>
          <option value="">すべてのステータス</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={hasCancelRequest}
            onChange={(e) => handleCancelRequestToggle(e.target.checked)}
          />
          キャンセル申請ありのみ
        </label>
      </div>

      {isLoading && <LoadingMessage />}
      {error && <ErrorMessage text={error} />}
      {orders && orders.data.length === 0 && <EmptyMessage text="注文がありません" />}

      {orders && orders.data.length > 0 && (
        <>
          <div className={styles.list}>
            {orders.data.map((order) => (
              <Link key={order.id} to={`/admin/orders/${order.id}`} className={styles.row}>
                <div className={styles.rowInfo}>
                  <span className={styles.orderId}>
                    注文番号 #{order.id}（{order.user?.name} / {order.user?.email}）
                  </span>
                  <span className={styles.meta}>
                    {new Date(order.created_at).toLocaleDateString('ja-JP')}・{STATUS_LABELS[order.status]}
                    {order.cancel_requested_at && '・キャンセル申請中'}
                  </span>
                </div>
                <span className={styles.price}>¥{order.total_price.toLocaleString('ja-JP')}</span>
              </Link>
            ))}
          </div>
          <Pagination meta={orders.meta} onChange={handlePageChange} />
        </>
      )}
    </section>
  )
}
