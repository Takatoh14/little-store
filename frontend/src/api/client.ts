import axios from 'axios'
import { clearStoredAuth, getStoredToken } from './storage'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { Accept: 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ログイン/登録自体の401(認証失敗)はフォームのエラー表示に使うため
// ここでは強制ログアウトの対象から除外する
const AUTH_ENDPOINTS = ['/login', '/register']

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? ''
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path))

    if (error.response?.status === 401 && !isAuthEndpoint) {
      clearStoredAuth()
      window.location.assign('/login')
    }

    return Promise.reject(error)
  },
)

export default client
