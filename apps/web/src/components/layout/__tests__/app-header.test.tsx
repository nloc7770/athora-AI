import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AppHeader } from '../app-header'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { name: 'John Doe', email: 'john@example.com' },
    logout: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAllRead: vi.fn(),
  }),
  ActivityNotification: {},
}))

describe('AppHeader', () => {
  it('renders bell button with aria-label and correct size', () => {
    render(<AppHeader />)
    const bellButton = screen.getByRole('button', { name: 'Notifications' })
    expect(bellButton).toBeInTheDocument()
    expect(bellButton).toHaveClass('h-10', 'w-10')
  })

  it('renders user menu trigger with aria-label', () => {
    render(<AppHeader />)
    const userMenu = screen.getByLabelText('User menu')
    expect(userMenu).toBeInTheDocument()
  })
})
