import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import { useAuth } from '../../hooks/useAuth'
import styles from './LoginPage.module.scss'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [banner, setBanner] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBanner(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo)
    } catch (err) {
      // 401「認証に失敗しました」は意図的にフィールド単位ではなく上部バナーで表示する
      setBanner(extractMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>ログイン</h1>

      {banner && <p className={styles.banner}>{banner}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="email">メールアドレス</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">パスワード</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          ログイン
        </Button>
      </form>

      <p className={styles.footerLink}>
        アカウントをお持ちでない方は<Link to="/register">会員登録</Link>
      </p>
    </section>
  )
}
