import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/dashboard'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { STATUS_LABELS } from '../../constants/orderStatus'
import { useAsync } from '../../hooks/useAsync'
import styles from './AdminDashboardPage.module.scss'

function formatMonth(month: string): string {
  const [, monthPart] = month.split('-')
  return `${Number(monthPart)}月`
}

export function AdminDashboardPage() {
  const { data: dashboard, isLoading, error } = useAsync(() => getDashboard(), [])

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>ダッシュボード</h1>

      {isLoading && <LoadingMessage />}
      {error && <ErrorMessage text={error} />}

      {dashboard && (
        <>
          <div className={styles.tiles}>
            <div className={styles.tile}>
              <span className={styles.tileLabel}>今月の売上</span>
              <span className={styles.tileValue}>¥{dashboard.monthly_sales.toLocaleString('ja-JP')}</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.tileLabel}>今月の注文件数</span>
              <span className={styles.tileValue}>{dashboard.monthly_order_count}件</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.tileLabel}>会員数</span>
              <span className={styles.tileValue}>{dashboard.member_count}人</span>
            </div>
            <div className={styles.tile}>
              <span className={styles.tileLabel}>在庫切れ商品</span>
              <span className={styles.tileValue}>{dashboard.out_of_stock_count}点</span>
            </div>
          </div>

          <div className={styles.panels}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>売上推移（直近6か月）</h2>
              {dashboard.sales_trend.every((point) => point.total === 0) ? (
                <p className={styles.emptyText}>データがありません</p>
              ) : (
                <div className={styles.chart}>
                  {(() => {
                    const max = Math.max(...dashboard.sales_trend.map((point) => point.total), 1)
                    return dashboard.sales_trend.map((point) => (
                      <div key={point.month} className={styles.bar}>
                        <span className={styles.barValue}>¥{point.total.toLocaleString('ja-JP')}</span>
                        <div
                          className={styles.barFill}
                          style={{ height: `${Math.max((point.total / max) * 100, 2)}%` }}
                        />
                        <span className={styles.barLabel}>{formatMonth(point.month)}</span>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>カテゴリ別売上比率</h2>
              {dashboard.category_breakdown.length === 0 ? (
                <p className={styles.emptyText}>データがありません</p>
              ) : (
                <div className={styles.categoryList}>
                  {(() => {
                    const total = dashboard.category_breakdown.reduce((sum, c) => sum + c.total, 0)
                    return dashboard.category_breakdown.map((entry) => {
                      const ratio = total > 0 ? (entry.total / total) * 100 : 0
                      return (
                        <div key={entry.category_name} className={styles.categoryRow}>
                          <div className={styles.categoryHeader}>
                            <span>{entry.category_name}</span>
                            <span>{ratio.toFixed(1)}%</span>
                          </div>
                          <div className={styles.categoryBarTrack}>
                            <div className={styles.categoryBarFill} style={{ width: `${ratio}%` }} />
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>最近の注文</h2>
            {dashboard.recent_orders.length === 0 ? (
              <p className={styles.emptyText}>注文がありません</p>
            ) : (
              <div className={styles.orderList}>
                {dashboard.recent_orders.map((order) => (
                  <Link key={order.id} to={`/admin/orders/${order.id}`} className={styles.orderRow}>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderId}>
                        #{order.id}（{order.user?.name}）
                      </span>
                      <span className={styles.meta}>
                        {new Date(order.created_at).toLocaleDateString('ja-JP')}・{STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <span className={styles.price}>¥{order.total_price.toLocaleString('ja-JP')}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
