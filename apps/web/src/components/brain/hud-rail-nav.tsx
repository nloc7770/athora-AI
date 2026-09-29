'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  BookOpen,
  Library,
  Brain,
  Sparkles,
  MessagesSquare,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

/**
 * The navigation rail. Veronica's rail is icon-only because veronica is a
 * single-screen HUD — you land on the brain and stay there. Athora is a
 * multi-page study app: students move between library, flashcards, exams and
 * the tutor constantly, and the icon-only rail made them hover every icon to
 * find out what it was (and on touch, where there is no hover, gave them
 * nothing at all). So labels are shown by default here.
 *
 * Collapsing is still available — the brain graph wants the width — and the
 * choice persists. Geometry lives in brain-theme.css (.br-rail*).
 */
const ICO = { size: 20, strokeWidth: 1.9, 'aria-hidden': true } as const

/**
 * The brand mark, at lucide-icon size. logo.png is a 128x128 opaque tile (it
 * carries its own violet background), so it needs its own rounding — there is
 * no alpha channel to give it a shape.
 */
const LOGO_ICO = (
  <img
    src="/images/logo.png"
    alt=""
    width={20}
    height={20}
    aria-hidden
    className="size-5 rounded-[6px]"
  />
)

const COLLAPSE_KEY = 'athora:hud:rail-collapsed'

interface RailEntry {
  key: string
  label: string
  href: string
  icon: React.ReactNode
}

const GROUPS: { title: string; items: RailEntry[] }[] = [
  {
    title: 'Brain',
    items: [
      { key: 'brain', label: 'Brain', href: '/dashboard', icon: LOGO_ICO },
      { key: 'tutor', label: 'AI Tutor', href: '/tutor', icon: <MessagesSquare {...ICO} /> },
    ],
  },
  {
    title: 'Study',
    items: [
      { key: 'sessions', label: 'Study Spaces', href: '/sessions', icon: <BookOpen {...ICO} /> },
      { key: 'library', label: 'Library', href: '/library', icon: <Library {...ICO} /> },
      { key: 'flashcards', label: 'Flashcards', href: '/flashcards', icon: <Brain {...ICO} /> },
      { key: 'exam', label: 'Exam Mode', href: '/exam', icon: <Sparkles {...ICO} /> },
    ],
  },
  {
    title: 'More',
    items: [
      { key: 'analytics', label: 'Analytics', href: '/analytics', icon: <BarChart3 {...ICO} /> },
      { key: 'settings', label: 'Settings', href: '/settings', icon: <Settings {...ICO} /> },
    ],
  },
]

export function HudRailNav() {
  const router = useRouter()
  const pathname = usePathname()

  // Read the stored preference after mount: reading localStorage during render
  // would make the server and client markup disagree.
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  const isActive = (href: string) => pathname === href || Boolean(pathname?.startsWith(`${href}/`))

  return (
    <nav
      className={`br-rail${collapsed ? ' is-collapsed' : ''}`}
      aria-label="Brain navigation"
    >
      <div className="br-rail-head">
        <span className="br-rail-brand" aria-hidden>
          <img src="/images/logo.png" alt="" width={38} height={38} />
        </span>
        <span className="br-rail-wordmark">ATHORA</span>
      </div>

      <div className="br-rail-nav">
        {GROUPS.map((g) => (
          <div className="br-rail-stack" key={g.title}>
            <span className="br-rail-group" aria-hidden>
              {g.title}
            </span>
            {g.items.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => router.push(it.href)}
                aria-label={it.label}
                aria-current={isActive(it.href) ? 'page' : undefined}
                className={`br-rail-link${isActive(it.href) ? ' is-active' : ''}`}
              >
                <span className="br-rail-ico">{it.icon}</span>
                <span className="br-rail-label">{it.label}</span>
                {/* Only used while collapsed — CSS hides it otherwise. */}
                <span role="tooltip" className="br-rail-tip">
                  {it.label}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={toggle}
        className="br-rail-collapse"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
      >
        {collapsed ? <PanelLeftOpen {...ICO} /> : <PanelLeftClose {...ICO} />}
        <span className="br-rail-label">Collapse</span>
      </button>
    </nav>
  )
}
