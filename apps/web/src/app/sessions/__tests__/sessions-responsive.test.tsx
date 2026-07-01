import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-sessions', () => ({
  useSessions: () => ({
    sessions: [
      {
        id: 'session-1',
        name: 'Test Session',
        description: 'A test session',
        status: 'active',
        document_count: 3,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-16T14:00:00Z',
      },
    ],
    isLoading: false,
    createSession: vi.fn(),
    deleteSession: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-documents', () => ({
  useDocuments: () => ({
    uploadDocument: vi.fn(),
  }),
}))

vi.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...props}>{children as React.ReactNode}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import SessionsPage from '../page'

describe('SessionsPage responsive design', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('date columns (Created at, Last updated) should have responsive hiding classes', () => {
    render(<SessionsPage />)

    const rows = screen.getAllByRole('row')
    // First row is the header, second is the data row
    const dataRow = rows[1]
    const cells = dataRow.querySelectorAll('td')

    // cells[3] = Created at column, cells[4] = Last updated column
    const createdAtCell = cells[3]
    const updatedAtCell = cells[4]

    expect(createdAtCell).toBeDefined()
    expect(updatedAtCell).toBeDefined()

    // Verify date columns have responsive hiding classes (hidden on mobile, visible on md+)
    expect(createdAtCell.className).toMatch(/hidden\s+md:table-cell|md:table-cell.*hidden/)
    expect(updatedAtCell.className).toMatch(/hidden\s+md:table-cell|md:table-cell.*hidden/)
  })

  it('date column headers should also have responsive hiding classes', () => {
    render(<SessionsPage />)

    const headerRow = screen.getAllByRole('row')[0]
    const headers = headerRow.querySelectorAll('th')

    // headers[3] = "Created at", headers[4] = "Last updated"
    const createdAtHeader = headers[3]
    const updatedAtHeader = headers[4]

    expect(createdAtHeader).toHaveTextContent('Created at')
    expect(updatedAtHeader).toHaveTextContent('Last updated')

    expect(createdAtHeader.className).toMatch(/hidden\s+md:table-cell|md:table-cell.*hidden/)
    expect(updatedAtHeader.className).toMatch(/hidden\s+md:table-cell|md:table-cell.*hidden/)
  })
})
