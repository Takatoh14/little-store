import type { PaginationMeta } from '../../types/api'
import styles from './Pagination.module.scss'

interface PaginationProps {
  meta: PaginationMeta
  onChange: (page: number) => void
}

export function Pagination({ meta, onChange }: PaginationProps) {
  if (meta.last_page <= 1) return null

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(meta.current_page - 1)}
        disabled={meta.current_page <= 1}
      >
        前へ
      </button>
      <span className={styles.pageInfo}>
        {meta.current_page} / {meta.last_page}
      </span>
      <button
        type="button"
        className={styles.button}
        onClick={() => onChange(meta.current_page + 1)}
        disabled={meta.current_page >= meta.last_page}
      >
        次へ
      </button>
    </div>
  )
}
