import { api } from './api'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('token', token)
  api.setToken(token)
}

export function clearToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  api.clearToken()
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export async function logout(): Promise<void> {
  clearToken()
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}
