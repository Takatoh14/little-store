import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../api/auth'
import { extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import styles from './ForgotPasswordPage.module.scss'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [banner, setBanner] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBanner(null)
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      const result = await forgotPassword({ email })
      setSuccessMessage(result.message)
    } catch (err) {
      setBanner(extractMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>パスワードをお忘れの方</h1>
      <p className={styles.lead}>登録済みのメールアドレスを入力してください。パスワード再設定用のリンクを送信します。</p>

      {banner && <p className={styles.banner}>{banner}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="email">メールアドレス</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          送信する
        </Button>
      </form>

      <p className={styles.footerLink}>
        <Link to="/login">ログイン画面に戻る</Link>
      </p>
    </section>
  )
}
