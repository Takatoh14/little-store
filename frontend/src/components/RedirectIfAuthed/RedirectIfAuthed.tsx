import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function RedirectIfAuthed() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const redirectParam = searchParams.get('redirect')

  // ログイン/登録ページ自体が遷移先を決めてnavigate()すると、このガードの
  // 再レンダリングと競合し「/」への強制遷移が勝ってしまう(admin以外の宛先が無視される)。
  // 遷移先の決定はこのガード側に一本化する。
  if (user) {
    return <Navigate to={redirectParam ?? (user.role === 'admin' ? '/admin/dashboard' : '/products')} replace />
  }

  return <Outlet />
}
