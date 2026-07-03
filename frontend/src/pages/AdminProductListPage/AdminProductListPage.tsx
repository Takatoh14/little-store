import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCategories } from '../../api/categories'
import { extractMessage } from '../../api/errors'
import { deleteAdminProduct, getAdminProducts } from '../../api/products'
import { Button } from '../../components/Button/Button'
import { CategoryFilter } from '../../components/CategoryFilter/CategoryFilter'
import { Pagination } from '../../components/Pagination/Pagination'
import { EmptyMessage, ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { useAsync } from '../../hooks/useAsync'
import styles from './AdminProductListPage.module.scss'

export function AdminProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryIdParam = searchParams.get('category_id')
  const categoryId = categoryIdParam ? Number(categoryIdParam) : null
  const page = Number(searchParams.get('page') ?? '1')

  const { data: categories } = useAsync(() => getCategories(), [])
  const {
    data: products,
    isLoading,
    error,
    refetch,
  } = useAsync(() => getAdminProducts({ category_id: categoryId ?? undefined, page }), [categoryId, page])

  const [banner, setBanner] = useState<string | null>(null)

  const handleSelectCategory = (id: number | null) => {
    const next = new URLSearchParams(searchParams)
    if (id === null) next.delete('category_id')
    else next.set('category_id', String(id))
    next.delete('page')
    setSearchParams(next)
  }

  const handlePageChange = (nextPage: number) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('この商品を削除しますか？')) return
    setBanner(null)
    try {
      await deleteAdminProduct(id)
      refetch()
    } catch (err) {
      setBanner(extractMessage(err))
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h1 className={styles.title}>商品管理</h1>
        <Link to="/admin/products/new">
          <Button type="button" className={styles.newButton}>
            新規登録
          </Button>
        </Link>
      </div>

      {banner && <p className={styles.banner}>{banner}</p>}

      {categories && (
        <CategoryFilter categories={categories} selectedCategoryId={categoryId} onSelect={handleSelectCategory} />
      )}

      {isLoading && <LoadingMessage />}
      {error && <ErrorMessage text={error} />}
      {products && products.data.length === 0 && <EmptyMessage text="商品がありません" />}

      {products && products.data.length > 0 && (
        <>
          <div className={styles.list}>
            {products.data.map((product) => (
              <div key={product.id} className={styles.row}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className={styles.thumb} />
                ) : (
                  <div className={styles.thumbPlaceholder}>No Image</div>
                )}
                <div className={styles.info}>
                  <p className={styles.name}>{product.name}</p>
                  <p className={styles.meta}>
                    {product.category.name}・¥{product.price.toLocaleString('ja-JP')}・在庫{product.stock}
                  </p>
                </div>
                <div className={styles.actions}>
                  <Link to={`/admin/products/${product.id}/edit`}>編集</Link>
                  <button type="button" className={styles.deleteButton} onClick={() => handleDelete(product.id)}>
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination meta={products.meta} onChange={handlePageChange} />
        </>
      )}
    </section>
  )
}
