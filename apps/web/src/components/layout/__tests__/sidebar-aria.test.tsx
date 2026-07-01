import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Sidebar } from '../sidebar'
import { useAppStore } from '@/stores/app-store'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { email: 'test@example.com', name: 'Test User' },
    logout: vi.fn(),
  }),
}))

describe('Sidebar', () => {
  beforeEach(() => {
    useAppStore.setState({ sidebarOpen: true })
  })

  it('renders nav with aria-label "Main navigation"', () => {
    render(<Sidebar />)
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav).toBeInTheDocument()
  })

  it('renders mobile overlay with role="dialog" and aria-modal="true"', () => {
    render(<Sidebar />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('closes sidebar when Escape key is pressed on overlay', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const dialog = screen.getByRole('dialog')
    await user.type(dialog, '{Escape}')

    expect(useAppStore.getState().sidebarOpen).toBe(false)
  })

  it('closes sidebar when overlay is clicked', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const dialog = screen.getByRole('dialog')
    await user.click(dialog)

    expect(useAppStore.getState().sidebarOpen).toBe(false)
  })
})
