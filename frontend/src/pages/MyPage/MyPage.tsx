import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import styles from './MyPage.module.scss'

export function MyPage() {
  const { user } = useAuth()

  if (!user) return null

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
    </section>
  )
}
