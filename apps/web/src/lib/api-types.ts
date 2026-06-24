export interface ApiError {
  message: string
  statusCode: number
}

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

export interface Session {
  access_token: string
  refresh_token: string
  user: User
}

export interface AuthResponse {
  user: User
  session: Session
}
