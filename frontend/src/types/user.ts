export interface User {
  id: number
  name: string
  email: string
  role: 'customer' | 'admin'
}

export interface LoginResponse {
  token: string
  user: User
}
