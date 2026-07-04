import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getDashboard, getSalesTrend } from '../../api/dashboard'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { STATUS_LABELS } from '../../constants/orderStatus'
import { useAsync } from '../../hooks/useAsync'
import type { SalesTrendGranularity } from '../../types/salesTrend'
import styles from './AdminDashboardPage.module.scss'

const GRANULARITY_LABELS: Record<SalesTrendGranularity, string> = {
  hour: '時間帯',
  week: '週',
  month: '月',
  year: '年',
}

const GRANULARITIES: SalesTrendGranularity[] = ['hour', 'week', 'month', 'year']

// 「合計」を含め、系列ごとに固定の色を割り当てる（カテゴリ数が増えても循環させる）
const LINE_COLORS = ['#c0392b', '#2f221c', '#7a6f62', '#2e7d32', '#8e44ad', '#2980b9', '#d35400']

export function AdminDashboardPage() {
  const { data: dashboard, isLoading, error } = useAsync(() => getDashboard(), [])

  const [granularity, setGranularity] = useState<SalesTrendGranularity>('month')
  const { data: salesTrend, isLoading: isTrendLoading } = useAsync(() => getSalesTrend(granularity), [granularity])

  const chartData = salesTrend?.periods.map((period, index) => {
    const row: Record<string, string | number> = { period }
    for (const series of salesTrend.series) {
      row[series.name] = series.totals[index]
    }
    return row
  })

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

          <div className={styles.panel}>
            <div className={styles.trendHeader}>
              <h2 className={styles.panelTitle}>売上推移</h2>
              <div className={styles.granularityTabs}>
                {GRANULARITIES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`${styles.granularityTab} ${g === granularity ? styles.granularityTabActive : ''}`}
                    onClick={() => setGranularity(g)}
                  >
                    {GRANULARITY_LABELS[g]}
                  </button>
                ))}
              </div>
            </div>

            {isTrendLoading && <LoadingMessage />}

            {chartData && (
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(value: number) => `¥${value.toLocaleString('ja-JP')}`} />
                    <Tooltip formatter={(value) => `¥${Number(value).toLocaleString('ja-JP')}`} />
                    <Legend />
                    {salesTrend?.series.map((series, index) => (
                      <Line
                        key={series.name}
                        type="monotone"
                        dataKey={series.name}
                        stroke={LINE_COLORS[index % LINE_COLORS.length]}
                        strokeWidth={series.name === '合計' ? 3 : 1.5}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={styles.panels}>
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

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>問い合わせ状況</h2>
              <div className={styles.contactCounts}>
                <Link to="/admin/contacts?status=unread" className={styles.contactCountRow}>
                  <span>未読</span>
                  <span className={styles.contactCountValue}>{dashboard.contact_counts.unread}件</span>
                </Link>
                <Link to="/admin/contacts?status=read" className={styles.contactCountRow}>
                  <span>既読</span>
                  <span className={styles.contactCountValue}>{dashboard.contact_counts.read}件</span>
                </Link>
                <Link to="/admin/contacts?status=answered" className={styles.contactCountRow}>
                  <span>回答済み</span>
                  <span className={styles.contactCountValue}>{dashboard.contact_counts.answered}件</span>
                </Link>
              </div>
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
