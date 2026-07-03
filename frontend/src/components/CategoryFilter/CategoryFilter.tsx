import type { Category } from '../../types/product'
import styles from './CategoryFilter.module.scss'

interface CategoryFilterProps {
  categories: Category[]
  selectedCategoryId: number | null
  onSelect: (categoryId: number | null) => void
}

export function CategoryFilter({ categories, selectedCategoryId, onSelect }: CategoryFilterProps) {
  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.chip} ${selectedCategoryId === null ? styles.chipActive : ''}`}
        onClick={() => onSelect(null)}
      >
        すべて
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`${styles.chip} ${selectedCategoryId === category.id ? styles.chipActive : ''}`}
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}
