import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Clicking a node in the brain graph must be answered WHERE THE USER IS
 * LOOKING. A student who clicks the "Tort Law" node wants that session's
 * documents unfolded beside the graph — not to be thrown onto another page and
 * to lose the brain they were just reading.
 *
 * BrainHero owns the canvas, so it is stubbed down to two buttons that call
 * `onNodeSelect` with exactly the node shape the real graph emits. Everything
 * under test — which column opens, which row unfolds, what gets picked — is
 * BrainHud's.
 */

const mockPost = vi.fn().mockResolvedValue({ id: "chat-new" })
const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
}))

vi.mock("@/lib/api", () => ({
  apiClient: { get: vi.fn(), post: (...args: unknown[]) => mockPost(...args), delete: vi.fn() },
}))

vi.mock("@/components/brain/brain-hero", () => ({
  BrainHero: ({ onNodeSelect }: { onNodeSelect?: (n: unknown) => boolean }) => (
    <div>
      <button onClick={() => onNodeSelect?.({ id: "sess-1", kind: "session", label: "Biology" })}>
        node:session
      </button>
      <button
        onClick={() =>
          onNodeSelect?.({ id: "doc-1", kind: "document", label: "Biology Notes", sessionId: "sess-1" })
        }
      >
        node:document
      </button>
      <button onClick={() => onNodeSelect?.({ id: "c-1", kind: "concept", label: "Mitosis" })}>
        node:concept
      </button>
    </div>
  ),
}))

vi.mock("@/hooks/use-sessions", () => ({
  useSessions: () => ({
    sessions: [{ id: "sess-1", name: "Biology", status: "active" }],
    isLoading: false,
    createSession: vi.fn(),
  }),
}))

const DOC = {
  id: "doc-1",
  name: "Biology Notes",
  type: "pdf",
  session_id: "sess-1",
  status: "ready",
  createdAt: "2026-06-28T10:00:00Z",
  updatedAt: "2026-06-29T10:00:00Z",
}

vi.mock("@/hooks/use-documents", () => ({
  useDocuments: () => ({ documents: [DOC], isLoading: false, uploadDocument: vi.fn() }),
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

import { BrainHud } from "@/components/brain/brain-hud"

function renderHud() {
  render(<BrainHud onUpload={vi.fn().mockResolvedValue(undefined)} />)
}

/**
 * The vault's session rows are `aria-expanded` buttons, but they are not the
 * only ones — the top bar's User menu carries the attribute too (its avatar
 * reads "A" for the mocked user). So match on the label as well; the document
 * row is excluded by the attribute.
 */
function sessionRow(): HTMLElement {
  const row = screen
    .getAllByRole("button")
    .find((b) => b.hasAttribute("aria-expanded") && /Biology/.test(b.textContent ?? ""))
  if (!row) throw new Error("no session row in the vault")
  return row
}

describe("brain node clicks act in place", () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockPost.mockClear()
  })

  it("never navigates away from the brain", async () => {
    const user = userEvent.setup()
    renderHud()

    await user.click(screen.getByText("node:session"))
    await user.click(screen.getByText("node:document"))

    expect(mockPush).not.toHaveBeenCalled()
  })

  it("unfolds the clicked session in the vault", async () => {
    const user = userEvent.setup()
    renderHud()

    // Collapsed to begin with — the session's documents are not on screen.
    expect(sessionRow()).toHaveAttribute("aria-expanded", "false")
    const docRowsBefore = screen.queryAllByText(/Biology Notes/).length

    await user.click(screen.getByText("node:session"))

    expect(sessionRow()).toHaveAttribute("aria-expanded", "true")
    // ...and the session's own documents come with it. The RECENT block also
    // lists the newest document, so the count is what moves, not the presence.
    expect(screen.queryAllByText(/Biology Notes/).length).toBeGreaterThan(docRowsBefore)
  })

  it("picks the clicked document into the ask column", async () => {
    const user = userEvent.setup()
    renderHud()

    expect(screen.queryByText(/DOCUMENT SELECTED/i)).not.toBeInTheDocument()

    await user.click(screen.getByText("node:document"))

    expect(screen.getByText(/1 DOCUMENT SELECTED/i)).toBeInTheDocument()
    expect(
      screen
        .getAllByRole("button", { name: /Biology Notes/ })
        .some((b) => b.getAttribute("aria-pressed") === "true"),
    ).toBe(true)
  })

  it("creates the tutor session against the picked document, then opens it", async () => {
    const user = userEvent.setup()
    renderHud()

    await user.click(screen.getByText("node:document"))
    await user.click(screen.getByRole("button", { name: /Open AI Tutor/i }))

    expect(mockPost).toHaveBeenCalledWith("/chat/sessions", {
      type: "document_chat",
      documentId: "doc-1",
    })
    const url = mockPush.mock.calls[0][0] as string
    expect(url.startsWith("/tutor?")).toBe(true)
    expect(url).toContain("session=chat-new")
    expect(url).toContain("docs=doc-1")
  })

})
