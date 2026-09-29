import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

/**
 * The dashboard page renders no data of its own any more — /dashboard is the
 * full-screen brain HUD. The loading guarantee these tests encode ("show a
 * loading affordance, never a misleading zero") now belongs to the HUD: while
 * the brain graph is in flight, the centre column shows a labelled, announced
 * loading state and the FILES / LEARNED / LEARNING strip is not rendered at all.
 *
 * BrainHero is deliberately NOT mocked here — its loading branch is the subject.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
}))

// Mutable so a test can flip the graph from in-flight to resolved.
const brainLoading = { data: null, isLoading: true, error: null, refresh: vi.fn() }

vi.mock("@/hooks/use-brain-graph", () => ({
  useBrainGraph: () => brainLoading,
}))

// jsdom implements no window.matchMedia, and this hook is not the subject.
vi.mock("@/hooks/use-reduced-motion", () => ({ useReducedMotion: () => false }))

vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({ courses: [], isLoading: true, createCourse: vi.fn() }),
}))

vi.mock("@/hooks/use-documents", () => ({
  useDocuments: () => ({ documents: [], isLoading: true, uploadDocument: vi.fn() }),
}))

vi.mock("@/hooks/use-sessions", () => ({
  useSessions: () => ({ sessions: [], isLoading: true, createSession: vi.fn() }),
}))

vi.mock("@/hooks/use-streak", () => ({
  useStreak: () => ({ streak: 0, recordStreak: vi.fn() }),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({
    user: { name: "Test User", email: "test@example.com" },
    isLoading: false,
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-notifications", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: true,
    markAllRead: vi.fn(),
    refresh: vi.fn(),
  }),
}))

import { BrainHud } from "@/components/brain/brain-hud"

describe("BrainHud loading states", () => {
  it("renders an animated loading indicator while loading", () => {
    const { container } = render(
      <BrainHud onUpload={vi.fn().mockResolvedValue(undefined)} />
    )

    const spinning = container.querySelectorAll(".animate-spin")
    expect(spinning.length).toBeGreaterThan(0)
  })

  it("does not show zero-valued brain stats while data is loading", () => {
    // While the graph is in flight the FILES / LEARNED / LEARNING strip is
    // withheld entirely: "FILES 0" is indistinguishable from a genuinely empty
    // account, so the strip waits for data. (A labelled readout like
    // "0 day streak" is a real value, not a placeholder.)
    brainLoading.isLoading = true
    const { unmount } = render(
      <BrainHud onUpload={vi.fn().mockResolvedValue(undefined)} />
    )

    expect(screen.queryByText("FILES")).toBeNull()
    expect(screen.queryByText("LEARNED")).toBeNull()
    expect(screen.queryByText("LEARNING")).toBeNull()
    unmount()

    // ...and comes back once the graph resolves, so the guard is a wait, not
    // a removal.
    brainLoading.isLoading = false
    render(<BrainHud onUpload={vi.fn().mockResolvedValue(undefined)} />)

    expect(screen.getByText("FILES")).toBeInTheDocument()
    expect(screen.getByText("LEARNED")).toBeInTheDocument()
    expect(screen.getByText("LEARNING")).toBeInTheDocument()

    brainLoading.isLoading = true
  })

  it("renders a loading container with role='status' for accessibility", () => {
    // Loading indicators have role="status" so screen readers announce the
    // loading state to assistive technology users.
    const { container } = render(
      <BrainHud onUpload={vi.fn().mockResolvedValue(undefined)} />
    )

    const statusElements = container.querySelectorAll('[role="status"]')
    expect(statusElements.length).toBeGreaterThan(0)
  })
})
