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
    }: {
      children?: React.ReactNode
      [key: string]: unknown
    }) => <div {...props}>{children}</div>,
  },
}))


vi.mock("@/components/brain/brain-hud", () => ({
  BrainHud: () => <div data-testid="brain-hud-mock" />,
}))
vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({
    courses: [
      {
        id: "course-1",
        name: "Computer Science 101",
        code: "CS101",
        color: "#6366f1",
        description: "Intro to CS",
        createdAt: "2026-06-01T10:00:00Z",
        updatedAt: "2026-06-28T10:00:00Z",
      },
    ],
    isLoading: false,
    createCourse: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-documents", () => ({
  useDocuments: () => ({
    documents: [
      {
        id: "doc-1",
        name: "Algorithms Chapter 1",
        type: "pdf",
        status: "ready",
        session_id: "session-1",
        createdAt: "2026-06-20T10:00:00Z",
        updatedAt: "2026-06-28T14:00:00Z",
      },
      {
        id: "doc-2",
        name: "Lecture Recording",
        type: "audio",
        status: "processing",
        session_id: "session-2",
        createdAt: "2026-06-25T08:00:00Z",
        updatedAt: "2026-06-28T12:00:00Z",
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
    user: {
      id: "user-1",
      name: "Test Student",
      email: "student@example.com",
    },
  }),
}))

import DashboardPage from "../dashboard-page"

describe("DashboardPage dark mode support", () => {
  // The "stat card containers have dark: variants" test that used to live here
  // asserted on `.grid.grid-cols-2 > div` — the five-card stat grid. That grid
  // was removed (the brain's own FILES/LEARNED/LEARNING strip covers the same
  // numbers), so the test had no subject left. The guarantee it encoded is
  // still enforced, more broadly, by the bg-white/dark:bg- test below.

  it("no raw bg-white without accompanying dark:bg- class", () => {
    const { container } = render(<DashboardPage />)

    // Find all elements with bg-white class
    const allElements = container.querySelectorAll("*")
    const violations: string[] = []

    allElements.forEach((el) => {
      const className = el.getAttribute("class") ?? ""
      if (!className.includes("bg-white")) return

      // Check if it also has a dark:bg- class
      const hasDarkBg = /dark:bg-/.test(className)
      if (!hasDarkBg) {
        const tag = el.tagName.toLowerCase()
        const truncatedClass =
          className.length > 80 ? `${className.slice(0, 80)}...` : className
        violations.push(`<${tag} class="${truncatedClass}">`)
      }
    })

    expect(
      violations,
      `Found ${violations.length} element(s) with "bg-white" but no "dark:bg-" counterpart:\n${violations.join("\n")}`
    ).toHaveLength(0)
  })
})
