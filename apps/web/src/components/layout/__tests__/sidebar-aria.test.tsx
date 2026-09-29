import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MobileHeader } from '../sidebar'
import { useAppStore } from '@/stores/app-store'

// The default must be closed. Opening on desktop covers the whole viewport with
// the sheet backdrop, which eats every click, and the mobile header that owns
// the close button is `lg:hidden` — so there is nothing on screen to close it.
it('defaults sidebarOpen to false', () => {
  expect(useAppStore.getInitialState().sidebarOpen).toBe(false)
})

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

// The mobile overlay lives in MobileHeader; the exported `Sidebar` is the
// desktop aside and has no sheet.
describe('MobileHeader', () => {
  beforeEach(() => {
    useAppStore.setState({ sidebarOpen: true })
  })

  it('renders nav with aria-label "Main navigation"', () => {
    render(<MobileHeader />)
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(nav).toBeInTheDocument()
  })

  it('renders mobile overlay with role="dialog" and aria-modal="true"', async () => {
    render(<MobileHeader />)
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('closes sidebar when Escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<MobileHeader />)

    await screen.findByRole('dialog')
    await user.keyboard('{Escape}')

    expect(useAppStore.getState().sidebarOpen).toBe(false)
  })

  it('closes sidebar when the backdrop is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileHeader />)

    await screen.findByRole('dialog')
    await user.click(document.querySelector('[data-slot="sheet-overlay"]')!)

    expect(useAppStore.getState().sidebarOpen).toBe(false)
  })
})
