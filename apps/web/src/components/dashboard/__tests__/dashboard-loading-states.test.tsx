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
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}))

vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({
    courses: [],
    isLoading: true,
    createCourse: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-documents", () => ({
  useDocuments: () => ({
    documents: [],
    isLoading: true,
    uploadDocument: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-sessions", () => ({
  useSessions: () => ({
    sessions: [],
    isLoading: true,
    createSession: vi.fn(),
  }),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({
    user: { name: "Test User", email: "test@example.com" },
    isLoading: false,
    isAuthenticated: true,
  }),
}))

import DashboardPage from "../dashboard-page"

describe("DashboardPage loading states", () => {
  it("renders skeleton elements with animate-pulse class while loading", () => {
    const { container } = render(<DashboardPage />)

    const pulsingElements = container.querySelectorAll(".animate-pulse")
    expect(pulsingElements.length).toBeGreaterThan(0)
  })

  it("does not show stat value '0' while data is loading", () => {
    // When hooks report isLoading: true, the dashboard should not render
    // raw "0" stat values — it should show skeletons instead of misleading data
    render(<DashboardPage />)

    const statElements = screen.queryAllByText("0")
    expect(statElements).toHaveLength(0)
  })

  it("renders skeleton containers with role='status' for accessibility", () => {
    // Skeleton loading indicators should have role="status" so screen readers
    // announce the loading state to assistive technology users
    const { container } = render(<DashboardPage />)

    const statusElements = container.querySelectorAll('[role="status"]')
    expect(statusElements.length).toBeGreaterThan(0)
  })
})
