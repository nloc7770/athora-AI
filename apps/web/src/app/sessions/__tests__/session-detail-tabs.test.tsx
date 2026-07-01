import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'session-1' }),
  useRouter: () => ({ push: vi.fn() }),
}))

// Mock hooks
vi.mock('@/hooks/use-sessions', () => ({
  useSession: () => ({
    session: { id: 'session-1', name: 'Test Session', description: '' },
    documents: [{ id: 'doc-1', name: 'test.pdf', status: 'ready', type: 'pdf' }],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}))

vi.mock('@/hooks/use-documents', () => ({
  useDocuments: () => ({ uploadDocument: vi.fn() }),
  useDocumentStatus: () => ({ status: 'ready', progress: 100 }),
}))

vi.mock('@/hooks/use-chat', () => ({
  useChatSessions: () => ({ sessions: [], createSession: vi.fn() }),
  useChatMessages: () => ({ messages: [], sendMessage: vi.fn(), isLoading: false }),
}))

vi.mock('@/hooks/use-ai-generation', () => ({
  useSessionGeneration: () => ({
    generations: [],
    generate: vi.fn(),
    isLoading: false,
  }),
}))

vi.mock('@/stores/toast-store', () => ({
  useToastStore: { getState: () => ({ addToast: vi.fn() }) },
}))

vi.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}))

vi.mock('@/components/ui/markdown', () => ({
  Markdown: ({ content }: any) => <div>{content}</div>,
}))

vi.mock('../[id]/_components', () => ({
  SummaryTab: () => <div data-testid="summary-tab-content" />,
  FlashcardsTab: () => <div data-testid="flashcards-tab-content" />,
  ExamTab: () => <div data-testid="exam-tab-content" />,
  MindMapTab: () => <div data-testid="mindmap-tab-content" />,
}))

vi.mock('../[id]/_components/document-insight', () => ({
  DocumentInsight: () => <div data-testid="document-insight" />,
}))

import SessionWorkspace from '../[id]/page'

describe('SessionWorkspace tab accessibility', () => {
  beforeEach(() => {
    render(<SessionWorkspace />)
  })

  it('tab container has role="tablist"', () => {
    const tablist = screen.getByRole('tablist')
    expect(tablist).toBeInTheDocument()
  })

  it('each tab button has role="tab" and aria-selected', () => {
    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBe(6)

    for (const tab of tabs) {
      expect(tab).toHaveAttribute('aria-selected')
    }
  })

  it('active tab has aria-selected="true"', () => {
    const tabs = screen.getAllByRole('tab')
    const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')
    expect(activeTab).toBeDefined()
    expect(activeTab).toHaveTextContent('Documents')

    const inactiveTabs = tabs.filter((tab) => tab.getAttribute('aria-selected') === 'false')
    expect(inactiveTabs.length).toBe(5)
  })
})
