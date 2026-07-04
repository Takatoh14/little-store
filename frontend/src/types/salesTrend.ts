export type SalesTrendGranularity = 'hour' | 'week' | 'month' | 'year'

export interface SalesTrendSeries {
  name: string
  totals: number[]
}

export interface SalesTrend {
  granularity: SalesTrendGranularity
  periods: string[]
  series: SalesTrendSeries[]
}
