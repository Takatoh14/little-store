import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCategories } from '../../api/categories'
import { extractFieldErrors, extractMessage } from '../../api/errors'
import { createAdminProduct, getAdminProduct, updateAdminProduct } from '../../api/products'
import { Button } from '../../components/Button/Button'
import { useAsync } from '../../hooks/useAsync'
import type { Category } from '../../types/product'
import styles from './AdminProductFormPage.module.scss'

function validate(
  name: string,
  categoryId: string,
  price: string,
  stock: string,
  description: string,
  isEditMode: boolean,
  hasImage: boolean,
) {
  const errors: Record<string, string> = {}
  if (!name.trim()) errors.name = '商品名を入力してください'
  else if (name.length > 100) errors.name = '100文字以内で入力してください'

  if (!categoryId) errors.category_id = 'カテゴリを選択してください'

  if (price === '' || Number(price) < 0) errors.price = '価格は0以上の整数で入力してください'
  if (stock === '' || Number(stock) < 0) errors.stock = '在庫数は0以上の整数で入力してください'
  if (description.length > 1000) errors.description = '1000文字以内で入力してください'
  if (!isEditMode && !hasImage) errors.image = '画像を選択してください'

  return errors
}

export function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditMode = id !== undefined
  const navigate = useNavigate()

  const { data: categories } = useAsync(() => getCategories(), [])
  const { data: product } = useAsync(
    () => (isEditMode ? getAdminProduct(Number(id)) : Promise.resolve(null)),
    [id, isEditMode],
  )

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPublished, setIsPublished] = useState(true)

  useEffect(() => {
    if (!product) return
    // 編集時: 取得した商品データでフォームをプリフィルする
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(product.name)
    setCategoryId(String(product.category.id))
    setPrice(String(product.price))
    setStock(String(product.stock))
    setDescription(product.description ?? '')
    setPreviewUrl(product.image_url)
    setIsPublished(product.is_published)
  }, [product])

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageChange = (file: File | null) => {
    setImageFile(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : product?.image_url ?? null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const clientErrors = validate(name, categoryId, price, stock, description, isEditMode, imageFile !== null)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }
    setFieldErrors({})

    const formData = new FormData()
    formData.append('name', name)
    formData.append('category_id', categoryId)
    formData.append('price', price)
    formData.append('stock', stock)
    formData.append('description', description)
    formData.append('is_published', isPublished ? '1' : '0')
    if (imageFile) formData.append('image', imageFile)

    setIsSubmitting(true)
    try {
      if (isEditMode) {
        await updateAdminProduct(Number(id), formData)
      } else {
        await createAdminProduct(formData)
      }
      navigate('/admin/products')
    } catch (err) {
      const serverErrors = extractFieldErrors(err)
      if (serverErrors) setFieldErrors(serverErrors)
      else setBanner(extractMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>{isEditMode ? '商品編集' : '商品新規登録'}</h1>

      {banner && <p className={styles.banner}>{banner}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="name">商品名</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="category_id">カテゴリ</label>
          <select id="category_id" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">選択してください</option>
            {categories?.map((category: Category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {fieldErrors.category_id && <span className={styles.fieldError}>{fieldErrors.category_id}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="price">価格</label>
          <input id="price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
          {fieldErrors.price && <span className={styles.fieldError}>{fieldErrors.price}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="stock">在庫数</label>
          <input id="stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
          {fieldErrors.stock && <span className={styles.fieldError}>{fieldErrors.stock}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="description">商品説明</label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="image">商品画像</label>
          {previewUrl && <img src={previewUrl} alt="プレビュー" className={styles.preview} />}
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
          />
          {fieldErrors.image && <span className={styles.fieldError}>{fieldErrors.image}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            公開する
          </label>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isEditMode ? '更新する' : '登録する'}
        </Button>
      </form>
    </section>
  )
}
