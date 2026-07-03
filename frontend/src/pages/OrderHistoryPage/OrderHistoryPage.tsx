import { Link, useSearchParams } from 'react-router-dom'
import { getOrders } from '../../api/orders'
import { Pagination } from '../../components/Pagination/Pagination'
import { EmptyMessage, ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { STATUS_LABELS } from '../../constants/orderStatus'
import { useAsync } from '../../hooks/useAsync'
import styles from './OrderHistoryPage.module.scss'

export function OrderHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')

  const { data: orders, isLoading, error } = useAsync(() => getOrders(page), [page])

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>注文履歴</h1>

      {isLoading && <LoadingMessage />}
      {error && <ErrorMessage text={error} />}

      {orders && orders.data.length === 0 && <EmptyMessage text="注文履歴がありません" />}

      {orders && orders.data.length > 0 && (
        <>
          <div className={styles.list}>
            {orders.data.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className={styles.row}>
                <div className={styles.rowInfo}>
                  <span className={styles.orderId}>注文番号 #{order.id}</span>
                  <span className={styles.meta}>
                    {new Date(order.created_at).toLocaleDateString('ja-JP')}・{STATUS_LABELS[order.status]}
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
