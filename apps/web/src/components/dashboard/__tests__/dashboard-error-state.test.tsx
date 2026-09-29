import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * The document rows moved into the brain HUD's VAULT column when /dashboard
 * became full-screen — see dashboard-accessibility.test.tsx for the same
 * repointing. Keyboard activation is what these guard: a row that cannot be
 * reached or opened without a mouse makes the vault unusable on a keyboard.
 */

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
}))

vi.mock("@/hooks/use-courses", () => ({
  useCourses: () => ({
    courses: [{ id: "c1", name: "Course 1" }],
    isLoading: false,
    createCourse: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-sessions", () => ({
  useSessions: () => ({ sessions: [], isLoading: false, createSession: vi.fn() }),
}))

vi.mock("@/hooks/use-streak", () => ({
  useStreak: () => ({ streak: 0, recordStreak: vi.fn() }),
}))

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: () => ({ user: { name: "Test User", email: "test@example.com" }, logout: vi.fn() }),
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

import { BrainHud } from "@/components/brain/brain-hud"

function renderHud() {
  render(<BrainHud onUpload={vi.fn().mockResolvedValue(undefined)} />)
}

describe("BrainHud vault document rows accessibility", () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it("document rows are buttons and take keyboard focus", () => {
    renderHud()

    const rows = screen.getAllByRole("button", { name: /Biology Notes|Chemistry Lab/i })
    expect(rows.length).toBe(2)

    for (const row of rows) {
      expect(row.tagName).toBe("BUTTON")
      row.focus()
      expect(row).toHaveFocus()
    }
  })

  it("picks the document on Enter key press", async () => {
    const user = userEvent.setup()
    renderHud()

    const row = screen.getByRole("button", { name: /Biology Notes/ })
    row.focus()
    await user.keyboard("{Enter}")

    // The vault row's job is to pick the document as tutor context, not to
    // navigate. Picking opens the ask column so the choice is visible. The
    // document then appears twice (its vault row + a selected chip), so find
    // the row by its pressed state rather than by name.
    expect(screen.getAllByRole("button", { name: /Biology Notes/ }).some((b) => b.getAttribute("aria-pressed") === "true")).toBe(true)
    expect(screen.getByText(/1 DOCUMENT SELECTED/i)).toBeInTheDocument()
  })

  it("picks the document on Space key press", async () => {
    const user = userEvent.setup()
    renderHud()

    const row = screen.getByRole("button", { name: /Chemistry Lab/ })
    row.focus()
    await user.keyboard(" ")

    expect(screen.getAllByRole("button", { name: /Chemistry Lab/ }).some((b) => b.getAttribute("aria-pressed") === "true")).toBe(true)
    expect(screen.getByText(/1 DOCUMENT SELECTED/i)).toBeInTheDocument()
  })

  it("has focus-visible ring classes", () => {
    renderHud()

    const row = screen.getByRole("button", { name: /Biology Notes/ })
    expect(row.className).toContain("focus-visible:ring-2")
    expect(row.className).toContain("focus-visible:outline-none")
    // Ring colour tracks the brand token; it has moved before, so assert a
    // ring colour exists rather than pinning one palette name.
    expect(row.className).toMatch(/focus-visible:ring-(?!2\b)[^\s]+/)
  })
})
