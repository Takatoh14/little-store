import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories } from '../../api/categories'
import { getProducts } from '../../api/products'
import { CategoryFilter } from '../../components/CategoryFilter/CategoryFilter'
import { Pagination } from '../../components/Pagination/Pagination'
import { ProductCard } from '../../components/ProductCard/ProductCard'
import { EmptyMessage, ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { useAsync } from '../../hooks/useAsync'
import styles from './ProductListPage.module.scss'

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryIdParam = searchParams.get('category_id')
  const categoryId = categoryIdParam ? Number(categoryIdParam) : null
  const page = Number(searchParams.get('page') ?? '1')

  const { data: categories } = useAsync(() => getCategories(), [])
  const {
    data: products,
    isLoading,
    error,
  } = useAsync(
    () => getProducts({ category_id: categoryId ?? undefined, page }),
    [categoryId, page],
  )

  const handleSelectCategory = useCallback(
    (id: number | null) => {
      const next = new URLSearchParams(searchParams)
      if (id === null) {
        next.delete('category_id')
      } else {
        next.set('category_id', String(id))
      }
      next.delete('page')
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(searchParams)
      next.set('page', String(nextPage))
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>商品一覧</h1>

      {categories && (
        <CategoryFilter categories={categories} selectedCategoryId={categoryId} onSelect={handleSelectCategory} />
      )}

      {isLoading && <LoadingMessage />}
      {error && <ErrorMessage text={error} />}

      {products && products.data.length === 0 && <EmptyMessage text="該当する商品がありません" />}

      {products && products.data.length > 0 && (
        <>
          <div className={styles.grid}>
            {products.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination meta={products.meta} onChange={handlePageChange} />
        </>
      )}
    </section>
  )
}
