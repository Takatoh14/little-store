import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { updatePassword } from '../../api/auth'
import { extractFieldErrors, extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import styles from './PasswordChangePage.module.scss'

function validate(currentPassword: string, password: string, passwordConfirmation: string) {
  const errors: Record<string, string> = {}
  if (!currentPassword) errors.current_password = '現在のパスワードを入力してください'

  if (!password) errors.password = '新しいパスワードを入力してください'
  else if (password.length < 8) errors.password = 'パスワードは8文字以上で入力してください'

  if (password !== passwordConfirmation) errors.password_confirmation = '確認用パスワードと一致しません'

  return errors
}

export function PasswordChangePage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBanner(null)
    setSuccessMessage(null)

    const clientErrors = validate(currentPassword, password, passwordConfirmation)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)
    try {
      await updatePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      })
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setSuccessMessage('パスワードを変更しました')
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
      <h1 className={styles.title}>パスワード変更</h1>

      {banner && <p className={styles.banner}>{banner}</p>}
      {successMessage && <p className={styles.success}>{successMessage}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="current_password">現在のパスワード</label>
          <input
            id="current_password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          {fieldErrors.current_password && <span className={styles.fieldError}>{fieldErrors.current_password}</span>}
        </div>

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
          パスワードを変更する
        </Button>
      </form>

      <p className={styles.footerLink}>
        <Link to="/mypage">マイページに戻る</Link>
      </p>
    </section>
  )
}
