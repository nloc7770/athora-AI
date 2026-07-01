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
  it("stat card containers have classes containing dark: variants", () => {
    const { container } = render(<DashboardPage />)

    // The stat cards are the grid items inside the stats row
    // They use rounded-xl border bg-white p-4 pattern
    const statCards = container.querySelectorAll(
      ".grid.grid-cols-2 > div"
    )

    // Should have 4 stat cards
    expect(statCards.length).toBe(4)

    // Each stat card should have at least one dark: class variant
    const hasDarkClasses = Array.from(statCards).some((card) => {
      const className = card.getAttribute("class") ?? ""
      return className.includes("dark:")
    })

    // NOTE: This test documents the current state — stat cards currently
    // lack dark: class variants. If this test fails (i.e., dark classes were
    // added), that means dark mode support was properly added.
    // For now, we verify the stat cards exist and flag the gap.
    expect(statCards.length).toBeGreaterThan(0)

    // Assert that dark mode classes ARE present on stat card containers
    // This will fail until dark mode is properly supported on these elements
    statCards.forEach((card) => {
      const className = card.getAttribute("class") ?? ""
      expect(
        className.includes("dark:"),
        `Stat card missing dark: class variant. Classes: "${className}"`
      ).toBe(true)
    })
  })

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
