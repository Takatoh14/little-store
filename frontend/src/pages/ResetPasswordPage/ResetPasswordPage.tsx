import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../api/auth'
import { extractFieldErrors, extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import styles from './ResetPasswordPage.module.scss'

function validate(password: string, passwordConfirmation: string) {
  const errors: Record<string, string> = {}
  if (!password) errors.password = '新しいパスワードを入力してください'
  else if (password.length < 8) errors.password = 'パスワードは8文字以上で入力してください'

  if (password !== passwordConfirmation) errors.password_confirmation = '確認用パスワードと一致しません'

  return errors
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const clientErrors = validate(password, passwordConfirmation)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)
    try {
      await resetPassword({ email, token, password, password_confirmation: passwordConfirmation })
      navigate('/login')
    } catch (err) {
      const serverErrors = extractFieldErrors(err)
      if (serverErrors) {
        setFieldErrors(serverErrors)
      } else {
        setBanner(extractMessage(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!email || !token) {
    return (
      <section className={styles.section}>
        <h1 className={styles.title}>パスワード再設定</h1>
        <p className={styles.banner}>無効なリンクです。もう一度パスワード再設定をお試しください。</p>
        <p className={styles.footerLink}>
          <Link to="/forgot-password">パスワードをお忘れの方はこちら</Link>
        </p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>パスワード再設定</h1>

      {banner && <p className={styles.banner}>{banner}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="password">新しいパスワード</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="password_confirmation">新しいパスワード（確認）</label>
          <input
            id="password_confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          {fieldErrors.password_confirmation && (
            <span className={styles.fieldError}>{fieldErrors.password_confirmation}</span>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          パスワードを再設定する
        </Button>
      </form>
    </section>
  )
}
