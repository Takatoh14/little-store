import type { User } from '../types/user'

const STORAGE_KEY = 'little_store_auth'

interface StoredAuth {
  token: string
  user: User
}

export function getStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as StoredAuth
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  return getStoredAuth()?.token ?? null
}

export function setStoredAuth(auth: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
}

export function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEY)
}
