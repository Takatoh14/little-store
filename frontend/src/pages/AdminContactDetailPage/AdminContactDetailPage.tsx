import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAdminContact, replyToContact } from '../../api/contact'
import { extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage/StatusMessage'
import { CONTACT_STATUS_LABELS } from '../../constants/contactStatus'
import { useAsync } from '../../hooks/useAsync'
import styles from './AdminContactDetailPage.module.scss'

export function AdminContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const {
    data: contact,
    isLoading,
    error,
    errorStatus,
    refetch,
  } = useAsync(() => getAdminContact(Number(id)), [id])

  const [replyMessage, setReplyMessage] = useState('')
  const [banner, setBanner] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!contact) return
    setBanner(null)
    setIsSubmitting(true)
    try {
      await replyToContact(contact.id, replyMessage)
      refetch()
    } catch (err) {
      setBanner(extractMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section className={styles.section}>
        <LoadingMessage />
      </section>
    )
  }

  if (error || !contact) {
    return (
      <section className={styles.section}>
        <ErrorMessage text={errorStatus === 404 ? '問い合わせが見つかりません' : error ?? '問い合わせが見つかりません'} />
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>問い合わせ詳細 #{contact.id}</h1>

      <div className={styles.detail}>
        <div className={styles.detailRow}>
          <span>お名前</span>
          <span>{contact.name}</span>
        </div>
        <div className={styles.detailRow}>
          <span>メールアドレス</span>
          <span>{contact.email}</span>
        </div>
        <div className={styles.detailRow}>
          <span>受信日時</span>
          <span>{new Date(contact.created_at).toLocaleString('ja-JP')}</span>
        </div>
        <div className={styles.detailRow}>
          <span>ステータス</span>
          <span>{CONTACT_STATUS_LABELS[contact.status]}</span>
        </div>

        <p className={styles.messageTitle}>お問い合わせ内容</p>
        <p className={styles.message}>{contact.message}</p>
      </div>

      {contact.status === 'answered' ? (
        <div className={styles.detail}>
          <p className={styles.messageTitle}>回答内容</p>
          <p className={styles.message}>{contact.reply_message}</p>
          {contact.replied_at && (
            <p className={styles.repliedAt}>回答日時: {new Date(contact.replied_at).toLocaleString('ja-JP')}</p>
          )}
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>回答する</h2>

          {banner && <p className={styles.banner}>{banner}</p>}

          <div className={styles.field}>
            <label htmlFor="reply_message">回答内容</label>
            <textarea
              id="reply_message"
              rows={6}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            回答を送信する
          </Button>
        </form>
      )}

      <Link to="/admin/contacts" className={styles.backLink}>
        &lt; 問い合わせ管理に戻る
      </Link>
    </section>
  )
}
