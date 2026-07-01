import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSendMessage = vi.fn()
const mockCreateSession = vi.fn()

const mockUseChatMessages = vi.fn()
const mockUseChatSessions = vi.fn()

vi.mock('@/hooks/use-chat', () => ({
  useChatSessions: (...args: any[]) => mockUseChatSessions(...args),
  useChatMessages: (...args: any[]) => mockUseChatMessages(...args),
}))

vi.mock('@/hooks/use-courses', () => ({
  useCourses: () => ({ courses: [] }),
}))

vi.mock('@/lib/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

import TutorPage from '../tutor-page'

const defaultChatMessages = {
  messages: [],
  isLoading: false,
  error: null,
  sendMessage: mockSendMessage,
  isStreaming: false,
}

const defaultChatSessions = {
  sessions: [],
  isLoading: false,
  error: null,
  createSession: mockCreateSession,
}

describe('TutorPage error banner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChatSessions.mockReturnValue(defaultChatSessions)
    mockUseChatMessages.mockReturnValue(defaultChatMessages)
  })

  it('does not render error banner when there is no error', () => {
    render(<TutorPage />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders error banner with error text when error is present', () => {
    mockUseChatMessages.mockReturnValue({
      ...defaultChatMessages,
      error: 'Failed to send message',
    })

    render(<TutorPage />)

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Failed to send message')
  })

  it('renders a Retry button inside the error banner', () => {
    mockUseChatMessages.mockReturnValue({
      ...defaultChatMessages,
      error: 'Network error',
    })

    render(<TutorPage />)

    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('error banner has red background styling', () => {
    mockUseChatMessages.mockReturnValue({
      ...defaultChatMessages,
      error: 'Something went wrong',
    })

    render(<TutorPage />)

    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('bg-red-50')
  })
})
