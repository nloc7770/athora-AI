import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}))

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, ...rest } = props
    return <img {...rest} />
  },
}))

vi.mock("@/hooks/use-documents", () => ({
  useDocuments: () => ({
    documents: [
      {
        id: "doc-1",
        name: "Biology Chapter 5",
        type: "pdf",
        status: "ready",
        session_id: "session-1",
        updatedAt: new Date().toISOString(),
      },
    ],
    isLoading: false,
    uploadDocument: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({
    courses: [],
    isLoading: false,
    createCourse: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-sessions", () => ({
  useSessions: () => ({
    createSession: vi.fn(),
  }),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({
    user: { id: "1", name: "Alex" },
  }),
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      variants,
      initial,
      animate,
      ...props
    }: Record<string, unknown>) => <div {...props}>{children as React.ReactNode}</div>,
  },
}))

import DashboardPage from "../dashboard-page"

describe("DashboardPage accessibility", () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it("document rows have role='button' and tabIndex={0}", () => {
    render(<DashboardPage />)

    const docRow = screen.getByText("Biology Chapter 5").closest(
      '[role="button"]'
    )

    expect(docRow).toBeInTheDocument()
    expect(docRow).toHaveAttribute("tabindex", "0")
  })

  it("document rows have focus-visible class", () => {
    render(<DashboardPage />)

    const docRow = screen.getByText("Biology Chapter 5").closest(
      '[role="button"]'
    )

    expect(docRow).toBeInTheDocument()
    expect(docRow?.className).toMatch(/focus-visible/)
  })

  it("pressing Enter on a document row calls router.push", () => {
    render(<DashboardPage />)

    const docRow = screen.getByText("Biology Chapter 5").closest(
      '[role="button"]'
    )

    expect(docRow).toBeInTheDocument()

    fireEvent.keyDown(docRow!, { key: "Enter", code: "Enter" })

    expect(mockPush).toHaveBeenCalledWith("/sessions/session-1")
  })
})
