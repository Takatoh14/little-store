import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractFieldErrors, extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import { useAuth } from '../../hooks/useAuth'
import styles from './RegisterPage.module.scss'

function validate(name: string, email: string, password: string, passwordConfirmation: string) {
  const errors: Record<string, string> = {}
  if (!name.trim()) errors.name = '氏名を入力してください'
  else if (name.length > 50) errors.name = '50文字以内で入力してください'

  if (!email.trim()) errors.email = 'メールアドレスを入力してください'

  if (!password) errors.password = 'パスワードを入力してください'
  else if (password.length < 8) errors.password = 'パスワードは8文字以上で入力してください'

  if (password !== passwordConfirmation) errors.password_confirmation = '確認用パスワードと一致しません'

  return errors
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const clientErrors = validate(name, email, password, passwordConfirmation)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)
    try {
      await register(name, email, password, passwordConfirmation)
      navigate('/')
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

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>会員登録</h1>

      {banner && <p className={styles.banner}>{banner}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="name">お名前</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="email">メールアドレス</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">パスワード</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="password_confirmation">パスワード（確認）</label>
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
          登録する
        </Button>
      </form>
    </section>
  )
}
