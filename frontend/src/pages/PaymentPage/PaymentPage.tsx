import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getStatus } from '../../api/errors'
import { createPayment } from '../../api/payments'
import { stripePromise } from '../../api/stripe'
import { Button } from '../../components/Button/Button'
import type { Order } from '../../types/order'
import type { PaymentDeclined } from '../../types/payment'
import styles from './PaymentPage.module.scss'

function PaymentForm({ order }: { order: Order }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  const [cardError, setCardError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBanner(null)
    setCardError(null)

    if (!stripe || !elements) return

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    setIsSubmitting(true)

    const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    })

    if (stripeError || !paymentMethod) {
      setCardError(stripeError?.message ?? 'カード情報の確認に失敗しました')
      setIsSubmitting(false)
      return
    }

    try {
      await createPayment({ order_id: order.id, payment_method_id: paymentMethod.id })
      navigate(`/orders/${order.id}/complete`, {
        state: { order: { ...order, status: 'paid' } },
      })
    } catch (err) {
      const status = getStatus(err)
      if (status === 402) {
        // カード拒否。注文はpendingのままなので別カードで再試行できる
        const body = (err as { response?: { data?: PaymentDeclined } })?.response?.data
        setBanner(body?.message ?? 'カード決済に失敗しました')
      } else {
        setBanner('決済処理でエラーが発生しました。時間をおいて再度お試しください。')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {banner && <p className={styles.banner}>{banner}</p>}

      <div className={styles.cardFieldWrapper}>
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      {cardError && <p className={styles.cardError}>{cardError}</p>}

      <Button type="submit" disabled={!stripe || isSubmitting}>
        {isSubmitting ? '決済処理中...' : '支払う'}
      </Button>
    </form>
  )
}

export function PaymentPage() {
  const location = useLocation()
  const order = (location.state as { order?: Order } | null)?.order

  // 注文作成には副作用(在庫減算・カートクリア)があるため暗黙に再実行しない。
  // 直接アクセスやリロードでstateが無い場合はカートに戻す
  if (!order) {
    return <Navigate to="/cart" replace />
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>お支払い</h1>

      <div className={styles.summary}>
        <span className={styles.totalLabel}>お支払い金額</span>
        <span className={styles.totalPrice}>¥{order.total_price.toLocaleString('ja-JP')}</span>
      </div>

      <Elements stripe={stripePromise}>
        <PaymentForm order={order} />
      </Elements>
    </section>
  )
}
