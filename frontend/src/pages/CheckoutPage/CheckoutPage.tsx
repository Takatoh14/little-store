import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../../api/orders'
import { extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import { useCart } from '../../hooks/useCart'
import styles from './CheckoutPage.module.scss'

function validate(postalCode: string, address: string, phone: string) {
  const errors: Record<string, string> = {}
  if (!/^[0-9]{7}$/.test(postalCode)) errors.postal_code = '郵便番号は7桁の数字で入力してください'
  if (!address.trim()) errors.address = '住所を入力してください'
  else if (address.length > 255) errors.address = '255文字以内で入力してください'
  if (!/^[0-9-]+$/.test(phone)) errors.phone = '電話番号は数字とハイフンのみで入力してください'
  return errors
}

export function CheckoutPage() {
  const { items, totalPrice, clear } = useCart()
  const navigate = useNavigate()

  const [postalCode, setPostalCode] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const clientErrors = validate(postalCode, address, phone)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)
    try {
      const order = await createOrder({ postal_code: postalCode, address, phone })
      clear() // 注文作成でバックエンド側もカートを空にするため、ローカルの表示もすぐ空にする
      navigate('/checkout/payment', { state: { order } })
    } catch (err) {
      setBanner(extractMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>注文手続き</h1>

      <div className={styles.summary}>
        {items.map((item) => (
          <div key={item.id} className={styles.summaryRow}>
            <span>
              {item.product.name} × {item.quantity}
            </span>
            <span>¥{(item.product.price * item.quantity).toLocaleString('ja-JP')}</span>
          </div>
        ))}
        <div className={styles.summaryTotal}>
          <span>合計</span>
          <span>¥{totalPrice.toLocaleString('ja-JP')}</span>
        </div>
      </div>

      {banner && <p className={styles.banner}>{banner}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="postal_code">郵便番号</label>
          <input
            id="postal_code"
            value={postalCode}
            placeholder="1234567"
            onChange={(e) => setPostalCode(e.target.value)}
          />
          {fieldErrors.postal_code && <span className={styles.fieldError}>{fieldErrors.postal_code}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="address">住所</label>
          <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
          {fieldErrors.address && <span className={styles.fieldError}>{fieldErrors.address}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="phone">電話番号</label>
          <input
            id="phone"
            value={phone}
            placeholder="090-1234-5678"
            onChange={(e) => setPhone(e.target.value)}
          />
          {fieldErrors.phone && <span className={styles.fieldError}>{fieldErrors.phone}</span>}
        </div>

        <Button type="submit" disabled={isSubmitting || items.length === 0}>
          決済に進む
        </Button>
      </form>
    </section>
  )
}
