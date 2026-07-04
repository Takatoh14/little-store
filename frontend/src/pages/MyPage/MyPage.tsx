import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteAccount } from '../../api/auth'
import { extractMessage } from '../../api/errors'
import { Button } from '../../components/Button/Button'
import { useAuth } from '../../hooks/useAuth'
import styles from './MyPage.module.scss'

export function MyPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [banner, setBanner] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!user) return null

  const handleDeleteAccount = async () => {
    if (!window.confirm('退会すると元に戻せません。本当に退会しますか？')) return

    setBanner(null)
    setIsDeleting(true)
    try {
      await deleteAccount()
      await logout()
      navigate('/')
    } catch (err) {
      setBanner(extractMessage(err))
      setIsDeleting(false)
    }
  }

  return (
    <section className={styles.section}>
      <h1 className={styles.title}>マイページ</h1>

      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>お名前</span>
          <span>{user.name}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>メールアドレス</span>
          <span>{user.email}</span>
        </div>
      </div>

      <Link to="/orders">注文履歴を見る &gt;</Link>
      <p className={styles.linkRow}>
        <Link to="/mypage/password">パスワードを変更する &gt;</Link>
      </p>

      {user.role !== 'admin' && (
        <div className={styles.dangerZone}>
          <h2 className={styles.subtitle}>退会</h2>
          {banner && <p className={styles.banner}>{banner}</p>}
          <p className={styles.dangerText}>退会すると再度ログインできなくなります。この操作は元に戻せません。</p>
          <Button variant="danger" disabled={isDeleting} onClick={handleDeleteAccount}>
            退会する
          </Button>
        </div>
      )}
    </section>
  )
}
