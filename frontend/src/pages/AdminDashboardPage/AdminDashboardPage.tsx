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

type ChartMode = 'total' | 'category'

// 「合計」を除くカテゴリ系列ごとに固定の色を割り当てる（カテゴリ数が増えても循環させる）
const LINE_COLORS = ['#2f221c', '#7a6f62', '#2e7d32', '#8e44ad', '#2980b9', '#d35400']
const TOTAL_COLOR = '#c0392b'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const CURRENT_YEAR = new Date().getFullYear()

export function AdminDashboardPage() {
  const { data: dashboard, isLoading, error } = useAsync(() => getDashboard(), [])

  const [granularity, setGranularity] = useState<SalesTrendGranularity>('month')
  const [chartMode, setChartMode] = useState<ChartMode>('total')

  const [hourDate, setHourDate] = useState(today())
  const [weekDate, setWeekDate] = useState(today())
  const [monthYear, setMonthYear] = useState(CURRENT_YEAR)
  const [yearStart, setYearStart] = useState(CURRENT_YEAR - 4)
  const [yearEnd, setYearEnd] = useState(CURRENT_YEAR)

  const { data: salesTrend, isLoading: isTrendLoading } = useAsync(() => {
    switch (granularity) {
      case 'hour':
        return getSalesTrend({ granularity, date: hourDate })
      case 'week':
        return getSalesTrend({ granularity, date: weekDate })
      case 'month':
        return getSalesTrend({ granularity, year: monthYear })
      default:
        return getSalesTrend({ granularity, start_year: yearStart, end_year: yearEnd })
    }
  }, [granularity, hourDate, weekDate, monthYear, yearStart, yearEnd])

  const visibleSeries = salesTrend?.series.filter((series) =>
    chartMode === 'total' ? series.name === '合計' : series.name !== '合計',
  )

  const chartData = salesTrend?.periods.map((period, index) => {
    const row: Record<string, string | number> = { period }
    for (const series of visibleSeries ?? []) {
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

            <div className={styles.trendControls}>
              <div className={styles.chartModeTabs}>
                <button
                  type="button"
                  className={`${styles.chartModeTab} ${chartMode === 'total' ? styles.chartModeTabActive : ''}`}
                  onClick={() => setChartMode('total')}
                >
                  合計
                </button>
                <button
                  type="button"
                  className={`${styles.chartModeTab} ${chartMode === 'category' ? styles.chartModeTabActive : ''}`}
                  onClick={() => setChartMode('category')}
                >
                  カテゴリ別
                </button>
              </div>

              <div className={styles.periodInput}>
                {(granularity === 'hour' || granularity === 'week') && (
                  <input
                    type="date"
                    value={granularity === 'hour' ? hourDate : weekDate}
                    onChange={(e) =>
                      granularity === 'hour' ? setHourDate(e.target.value) : setWeekDate(e.target.value)
                    }
                  />
                )}
                {granularity === 'month' && (
                  <label>
                    年:{' '}
                    <input
                      type="number"
                      value={monthYear}
                      onChange={(e) => setMonthYear(Number(e.target.value))}
                    />
                  </label>
                )}
                {granularity === 'year' && (
                  <>
                    <label>
                      開始年:{' '}
                      <input type="number" value={yearStart} onChange={(e) => setYearStart(Number(e.target.value))} />
                    </label>
                    <label>
                      終了年:{' '}
                      <input type="number" value={yearEnd} onChange={(e) => setYearEnd(Number(e.target.value))} />
                    </label>
                  </>
                )}
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
                    {visibleSeries?.map((series, index) => (
                      <Line
                        key={series.name}
                        type="monotone"
                        dataKey={series.name}
                        stroke={series.name === '合計' ? TOTAL_COLOR : LINE_COLORS[index % LINE_COLORS.length]}
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
