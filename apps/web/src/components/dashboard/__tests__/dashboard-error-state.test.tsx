import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children as React.ReactNode}</div>
    ),
  },
}))

vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({
    courses: [{ id: "c1", name: "Course 1" }],
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
    user: { name: "Test User", email: "test@example.com" },
  }),
}))

const mockDocuments = [
  {
    id: "doc-1",
    name: "Biology Notes",
    type: "pdf",
    session_id: "session-1",
    status: "ready",
    createdAt: "2026-06-28T10:00:00Z",
    updatedAt: "2026-06-29T10:00:00Z",
  },
  {
    id: "doc-2",
    name: "Chemistry Lab",
    type: "pdf",
    session_id: "session-2",
    status: "processing",
    createdAt: "2026-06-27T10:00:00Z",
    updatedAt: "2026-06-28T10:00:00Z",
  },
]

vi.mock("@/hooks/use-documents", () => ({
  useDocuments: () => ({
    documents: mockDocuments,
    isLoading: false,
    uploadDocument: vi.fn(),
  }),
}))

describe("DashboardPage document rows accessibility", () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it("document rows have role=button and tabIndex=0", async () => {
    const DashboardPage = (await import("../dashboard-page")).default
    render(<DashboardPage />)

    const rows = screen.getAllByRole("button", { name: /Biology Notes|Chemistry Lab/i })
    expect(rows.length).toBe(2)

    for (const row of rows) {
      expect(row).toHaveAttribute("tabindex", "0")
    }
  })

  it("navigates on Enter key press", async () => {
    const user = userEvent.setup()
    const DashboardPage = (await import("../dashboard-page")).default
    render(<DashboardPage />)

    const row = screen.getByText("Biology Notes").closest("[role='button']")!
    await user.tab()
    row.focus()
    await user.keyboard("{Enter}")

    expect(mockPush).toHaveBeenCalledWith("/sessions/session-1")
  })

  it("navigates on Space key press", async () => {
    const user = userEvent.setup()
    const DashboardPage = (await import("../dashboard-page")).default
    render(<DashboardPage />)

    const row = screen.getByText("Chemistry Lab").closest("[role='button']")!
    row.focus()
    await user.keyboard(" ")

    expect(mockPush).toHaveBeenCalledWith("/sessions/session-2")
  })

  it("has focus-visible ring classes", async () => {
    const DashboardPage = (await import("../dashboard-page")).default
    render(<DashboardPage />)

    const row = screen.getByText("Biology Notes").closest("[role='button']")!
    expect(row.className).toContain("focus-visible:ring-2")
    expect(row.className).toContain("focus-visible:ring-purple-500")
    expect(row.className).toContain("focus-visible:outline-none")
  })
})
