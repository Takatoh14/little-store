import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '../api/storage'
import type { User } from '../types/user'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>
  logout: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // 遅延初期化でlocalStorageから同期的に復元する(初回レンダーから使えるため
  // 「未ログイン状態のちらつき」も「effect内での直接setState」も発生しない)
  const [user, setUser] = useState<User | null>(() => getStoredAuth()?.user ?? null)
  const [token, setToken] = useState<string | null>(() => getStoredAuth()?.token ?? null)

  useEffect(() => {
    // トークンが失効していないかバックグラウンドで確認する
    // (失効していればclient.tsの401インターセプターがログイン画面へ誘導する。
    //  ここではsetStateしない=結果を直接状態に反映しない)
    if (getStoredAuth()) {
      authApi.fetchCurrentUser().catch(() => {})
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    setStoredAuth({ token: res.token, user: res.user })
    setUser(res.user)
    setToken(res.token)
  }, [])

  // /register はトークンを返さないため、登録直後にloginを内部的に呼んでサインイン状態にする
  const register = useCallback(
    async (name: string, email: string, password: string, passwordConfirmation: string) => {
      await authApi.registerUser({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      await login(email, password)
    },
    [login],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ベストエフォート。失敗してもローカルの状態はクリアする
    }
    clearStoredAuth()
    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>{children}</AuthContext.Provider>
  )
}
