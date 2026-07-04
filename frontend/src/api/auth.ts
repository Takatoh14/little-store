import client from './client'
import type { LoginResponse, User } from '../types/user'

// POST /register はトークンを返さない(flatなUserのみ)。ログインは別途必要
export async function registerUser(payload: {
  name: string
  email: string
  password: string
  password_confirmation: string
}): Promise<User> {
  const res = await client.post<User>('/register', payload)
  return res.data
}

export async function login(payload: { email: string; password: string }): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>('/login', payload)
  return res.data
}

export async function logout(): Promise<void> {
  await client.post('/logout')
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await client.get<User>('/user')
  return res.data
}

export async function updatePassword(payload: {
  current_password: string
  password: string
  password_confirmation: string
}): Promise<void> {
  await client.put('/password', payload)
}

export async function forgotPassword(payload: { email: string }): Promise<{ message: string }> {
  const res = await client.post<{ message: string }>('/forgot-password', payload)
  return res.data
}

export async function resetPassword(payload: {
  email: string
  token: string
  password: string
  password_confirmation: string
}): Promise<void> {
  await client.post('/reset-password', payload)
}
