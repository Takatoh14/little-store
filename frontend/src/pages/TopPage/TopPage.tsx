import { Link } from 'react-router-dom'
import { getProducts } from '../../api/products'
import { ProductCard } from '../../components/ProductCard/ProductCard'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { useAsync } from '../../hooks/useAsync'
import styles from './TopPage.module.scss'

export function TopPage() {
  const { data, isLoading, error } = useAsync(() => getProducts({ page: 1 }), [])

  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Little Store</h1>
        <p className={styles.heroLead}>暮らしを彩る、ちいさなお店</p>
        <Link to="/products">商品一覧を見る</Link>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>おすすめ商品</h2>
        {isLoading && <LoadingMessage />}
        {error && <ErrorMessage text={error} />}
        {data && (
          <>
            <div className={styles.grid}>
              {data.data.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <Link to="/products" className={styles.moreLink}>
              もっと見る &gt;
            </Link>
          </>
        )}
      </section>
    </>
  )
}
