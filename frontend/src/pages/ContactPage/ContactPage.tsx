import { useState, type FormEvent } from 'react'
import { submitContact } from '../../api/contact'
import { extractFieldErrors, extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import styles from './ContactPage.module.scss'

function validate(name: string, email: string, message: string) {
  const errors: Record<string, string> = {}
  if (!name.trim()) errors.name = 'お名前を入力してください'
  else if (name.length > 50) errors.name = '50文字以内で入力してください'
  if (!email.trim()) errors.email = 'メールアドレスを入力してください'
  if (!message.trim()) errors.message = 'お問い合わせ内容を入力してください'
  else if (message.length > 1000) errors.message = '1000文字以内で入力してください'
  return errors
}

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBanner(null)

    const clientErrors = validate(name, email, message)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }
    setFieldErrors({})

    setIsSubmitting(true)
    try {
      await submitContact({ name, email, message })
      setIsSubmitted(true)
      setName('')
      setEmail('')
      setMessage('')
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
      <h1 className={styles.title}>お問い合わせ</h1>

      {isSubmitted && <p className={styles.successBanner}>お問い合わせを受け付けました</p>}
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
          <label htmlFor="message">お問い合わせ内容</label>
          <textarea
            id="message"
            rows={6}
            placeholder="1000文字以内で入力してください"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {fieldErrors.message && <span className={styles.fieldError}>{fieldErrors.message}</span>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          送信する
        </Button>
      </form>

      <p className={styles.note}>
        通常2〜3営業日以内に
        <br />
        ご返信いたします
      </p>
    </section>
  )
}
