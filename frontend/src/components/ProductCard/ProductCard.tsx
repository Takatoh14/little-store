import { Link } from 'react-router-dom'
import type { Product } from '../../types/product'
import styles from './ProductCard.module.scss'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/products/${product.id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className={styles.image} />
        ) : (
          <span className={styles.imagePlaceholder}>No Image</span>
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.category}>{product.category.name}</p>
        <p className={styles.name}>{product.name}</p>
        <p className={styles.price}>¥{product.price.toLocaleString('ja-JP')}</p>
        {product.stock === 0 && <span className={styles.outOfStock}>在庫切れ</span>}
      </div>
    </Link>
  )
}
