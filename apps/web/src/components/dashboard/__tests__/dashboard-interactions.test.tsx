import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

/**
 * The page's Quick Actions row is gone: /dashboard is the full-screen brain
 * HUD, and its rail carries the same destinations (Sessions, Flashcards,
 * Exams, AI Tutor) permanently instead of behind a row that scrolled away.
 *
 * The row's old assertion was "these buttons carry an interaction class".
 * The rail's transitions live in brain-theme.css, not in utility classes, so
 * the equivalent guarantee is asserted behaviourally: each destination is a
 * real labelled button on the rail, and each one navigates to its route.
 */

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
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
  useSessions: () => ({ sessions: [], isLoading: false, createSession: vi.fn() }),
}))

vi.mock("@/hooks/use-streak", () => ({
  useStreak: () => ({ streak: 0, recordStreak: vi.fn() }),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({
    user: { name: "Test User", email: "test@example.com" },
    logout: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAllRead: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock("@/components/brain/brain-hero", () => ({
  BrainHero: () => <div data-testid="brain-hero-mock" />,
}))

import { BrainHud } from "@/components/brain/brain-hud"

const DESTINATIONS: Array<[string, string]> = [
  ["Study Spaces", "/sessions"],
  ["Flashcards", "/flashcards"],
  ["Exam Mode", "/exam"],
  ["AI Tutor", "/tutor"],
]

describe("BrainHud interactions", () => {
  it("rail destinations are buttons that navigate to their route", async () => {
    const user = userEvent.setup()
    mockPush.mockClear()

    render(<BrainHud onUpload={vi.fn().mockResolvedValue(undefined)} />)

    for (const [label, href] of DESTINATIONS) {
      const button = screen.getByRole("button", { name: label })
      // Rail rows are `.br-rail-link` (icon + label); `.br-rail-item` is the
      // square icon-only button the top bar uses for the bell and toggles.
      expect(button).toHaveClass("br-rail-link")

      await user.click(button)
      expect(mockPush).toHaveBeenCalledWith(href)
    }
  })
})
