import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => <img {...props} />,
}))

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...props}>{children as React.ReactNode}</div>
    ),
  },
}))

vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({
    courses: [{ id: "1", name: "Test Course" }],
    isLoading: false,
    createCourse: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-documents", () => ({
  useDocuments: () => ({
    documents: [
      {
        id: "doc-1",
        name: "Test Document",
        type: "pdf",
        status: "ready",
        updatedAt: new Date().toISOString(),
        session_id: "sess-1",
      },
    ],
    isLoading: false,
    uploadDocument: vi.fn(),
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

describe("DashboardPage interactions", () => {
  it("quick action buttons have class containing 'active:scale' or 'transition'", async () => {
    const { default: DashboardPage } = await import(
      "../dashboard-page"
    )

    render(<DashboardPage />)

    const sessionsButton = screen.getByRole("button", { name: /sessions/i })
    const flashcardsButton = screen.getByRole("button", { name: /flashcards/i })
    const examsButton = screen.getByRole("button", { name: /exams/i })
    const aiTutorButton = screen.getByRole("button", { name: /ai tutor/i })

    const quickActionButtons = [
      sessionsButton,
      flashcardsButton,
      examsButton,
      aiTutorButton,
    ]

    for (const button of quickActionButtons) {
      const className = button.className
      const hasInteractionClass =
        className.includes("active:scale") || className.includes("transition")
      expect(hasInteractionClass).toBe(true)
    }
  })
})
