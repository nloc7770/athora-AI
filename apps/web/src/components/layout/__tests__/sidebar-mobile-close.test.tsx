import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '../sidebar'

const mockSetSidebarOpen = vi.fn()

vi.mock('@/stores/app-store', () => ({
  useAppStore: () => ({
    sidebarOpen: true,
    setSidebarOpen: mockSetSidebarOpen,
  }),
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: { email: 'test@example.com', name: 'Test User' },
    logout: vi.fn(),
  }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...props }: { children: React.ReactNode; href: string; onClick?: () => void; [key: string]: unknown }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}))

describe('Sidebar mobile close', () => {
  beforeEach(() => {
    mockSetSidebarOpen.mockClear()
  })

  it('calls setSidebarOpen(false) when a nav link is clicked', () => {
    render(<Sidebar />)

    const libraryLink = screen.getByRole('link', { name: /library/i })
    fireEvent.click(libraryLink)

    expect(mockSetSidebarOpen).toHaveBeenCalledWith(false)
  })
})
