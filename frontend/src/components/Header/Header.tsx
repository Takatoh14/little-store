import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import styles from './Header.module.scss'

export function Header() {
  const { user, logout } = useAuth()
  const { totalCount } = useCart()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  const handleLogout = async () => {
    await logout()
    closeMenu()
    navigate('/')
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} onClick={closeMenu}>
          Little Store
        </Link>

        <button
          type="button"
          className={styles.hamburger}
          aria-label="メニューを開閉する"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.navOpen : ''}`} onClick={closeMenu}>
          <Link to="/products">商品一覧</Link>
          <Link to={user?.role === 'admin' ? '/admin/contacts' : '/contact'}>お問い合わせ</Link>
          {user ? (
            <>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/dashboard">ダッシュボード</Link>
                  <Link to="/admin/products">商品管理</Link>
                  <Link to="/admin/orders">注文管理</Link>
                </>
              )}
              <Link to="/mypage">マイページ</Link>
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
