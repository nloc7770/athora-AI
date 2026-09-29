import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The recent-document rows MOVED: /dashboard is the full-screen brain HUD now,
 * so the dashboard page renders no document list of its own. These assertions
 * follow the rows into their new home — the HUD's VAULT column (RECENT).
 * The HUD is rendered for real here; only its data hooks, its rail and the
 * three.js hero are stubbed.
 */

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/dashboard",
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

vi.mock("@/hooks/use-sessions", () => ({
  useSessions: () => ({ sessions: [], isLoading: false, createSession: vi.fn() }),
}))

vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({ courses: [], isLoading: false, createCourse: vi.fn() }),
}))

vi.mock("@/hooks/use-streak", () => ({
  useStreak: () => ({ streak: 0, recordStreak: vi.fn() }),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({ user: { id: "1", name: "Alex" }, logout: vi.fn() }),
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

// three.js/WebGL never load in jsdom.
vi.mock("@/components/brain/brain-hero", () => ({
  BrainHero: () => <div data-testid="brain-hero-mock" />,
}))

import { BrainHud } from "@/components/brain/brain-hud"

/** The VAULT column starts OPEN (it is the way into everything else), so the
    rows are already on screen — no toggle needed. */
function renderHud() {
  return render(<BrainHud onUpload={vi.fn().mockResolvedValue(undefined)} />)
}

describe("BrainHud vault document rows accessibility", () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it("document rows are native buttons and take keyboard focus", async () => {
    renderHud()

    const row = screen.getByRole("button", { name: /Biology Chapter 5/ })

    // A real <button>, so role, tab order and Enter/Space activation come from
    // the platform rather than from hand-rolled role/tabIndex attributes.
    expect(row.tagName).toBe("BUTTON")

    row.focus()
    expect(row).toHaveFocus()
  })

  it("document rows have focus-visible classes", () => {
    renderHud()

    const row = screen.getByRole("button", { name: /Biology Chapter 5/ })

    expect(row.className).toMatch(/focus-visible/)
    expect(row.className).toContain("focus-visible:ring-2")
    expect(row.className).toContain("focus-visible:outline-none")
    // Ring colour tracks the brand token; it has moved before, so assert a
    // ring colour exists rather than pinning one palette name.
    expect(row.className).toMatch(/focus-visible:ring-(?!2\b)[^\s]+/)
  })

  it("pressing Enter on a document row picks it as tutor context", async () => {
    const user = userEvent.setup()
    renderHud()

    const row = screen.getByRole("button", { name: /Biology Chapter 5/ })
    row.focus()
    await user.keyboard("{Enter}")

    // The row's job is to pick the document as tutor context, not to navigate.
    // Picking opens the ask column; the document then appears twice (its vault
    // row + a selected chip), so find the row by its pressed state.
    expect(screen.getAllByRole("button", { name: /Biology Chapter 5/ }).some((b) => b.getAttribute("aria-pressed") === "true")).toBe(true)
    expect(screen.getByText(/1 DOCUMENT SELECTED/i)).toBeInTheDocument()
  })
})
