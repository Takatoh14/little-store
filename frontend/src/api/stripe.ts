import { loadStripe } from '@stripe/stripe-js'

// モジュールレベルで1度だけ生成する(コンポーネントの再レンダー毎に作り直さない)
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY)
