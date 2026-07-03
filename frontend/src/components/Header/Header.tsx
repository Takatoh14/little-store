import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import styles from './Header.module.scss'

export function Header() {
  const { user, logout } = useAuth()
  const { totalCount } = useCart()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          Little Store
        </Link>
        <nav className={styles.nav}>
          <Link to="/products">商品一覧</Link>
          {user ? (
            <>
              <Link to="/cart" className={styles.cartLink}>
                カート
                {totalCount > 0 && <span className={styles.badge}>{totalCount}</span>}
              </Link>
              <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link to="/login">ログイン</Link>
              <Link to="/register">会員登録</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
