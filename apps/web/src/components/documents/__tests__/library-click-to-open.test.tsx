import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-documents', () => ({
  useDocuments: () => ({
    documents: [
      {
        id: 'doc-1',
        name: 'Lecture Notes Chapter 1',
        type: 'pdf',
        courseId: 'course-1',
        session_id: 'session-abc',
        status: 'ready',
        file_size: 1024,
        pageCount: 10,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      },
      {
        id: 'doc-2',
        name: 'Audio Recording',
        type: 'audio',
        courseId: 'course-1',
        session_id: undefined,
        status: 'ready',
        file_size: 2048,
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
    uploadDocument: vi.fn(),
    deleteDocument: vi.fn(),
    renameDocument: vi.fn(),
    moveDocument: vi.fn(),
  }),
  useDocumentStatus: () => ({
    status: 'ready',
    progress: 100,
    isReady: true,
  }),
}))

vi.mock('@/hooks/use-courses', () => ({
  useCourses: () => ({
    courses: [
      { id: 'course-1', name: 'Computer Science 101', code: 'CS101', color: '#4f46e5' },
    ],
    isLoading: false,
  }),
}))

vi.mock('@/stores/toast-store', () => ({
  useToastStore: () => vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
      onClick,
      role,
      ...rest
    }: React.PropsWithChildren<Record<string, unknown>>) => {
      const safeProps: Record<string, unknown> = {}
      if (className) safeProps.className = className
      if (style) safeProps.style = style
      if (onClick) safeProps.onClick = onClick
      if (role) safeProps.role = role
      for (const [key, value] of Object.entries(rest)) {
        if (key.startsWith('aria-') || key.startsWith('data-')) {
          safeProps[key] = value
        }
      }
      return <div {...safeProps}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  LayoutGroup: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

import LibraryPage from '../library-page'

describe('LibraryPage - click to open document', () => {
  beforeEach(() => {
    mockPush.mockClear()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  it('calls router.push when clicking a document card in normal mode', async () => {
    const user = userEvent.setup()
    render(<LibraryPage />)

    // Find the card container by the document name text
    const docNameEl = screen.getByText('Lecture Notes Chapter 1')
    // The clickable card is the closest ancestor with role="button"
    const card = docNameEl.closest('[role="button"]')
    expect(card).not.toBeNull()

    await user.click(card!)

    // doc-1 has session_id so should navigate to /sessions/session-abc
    expect(mockPush).toHaveBeenCalledWith('/sessions/session-abc')
  })

  it('document card has cursor-pointer class', () => {
    render(<LibraryPage />)

    const docNameEl = screen.getByText('Lecture Notes Chapter 1')
    const card = docNameEl.closest('[role="button"]')
    expect(card).not.toBeNull()
    expect(card).toHaveClass('cursor-pointer')
  })

  it('document card has role="button"', () => {
    render(<LibraryPage />)

    const docNameEl = screen.getByText('Lecture Notes Chapter 1')
    const card = docNameEl.closest('[role="button"]')
    expect(card).toBeInTheDocument()
  })
})
