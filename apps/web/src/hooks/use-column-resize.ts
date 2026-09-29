'use client'

import { useCallback, useRef } from 'react'

/**
 * Resizable side columns for the brain HUD — ported from veronica's
 * use-column-resize.
 *
 * `.br-hud-body` is a CSS grid
 * `var(--br-vault-w) 6px minmax(0,1fr) 6px var(--br-right-w)`.
 * Width lives in a ref and is written straight to the element's CSS custom
 * properties while dragging (no setState — that would re-render the graph on
 * every pointermove), then persisted to localStorage on release. The centre
 * column is `minmax(0,1fr)` so it absorbs the change and the grid can never
 * overflow the viewport. Double-click a resizer to reset.
 */
const VAULT_MIN = 260
const VAULT_MAX = 560
const VAULT_DEFAULT = 320
const RIGHT_MIN = 280
const RIGHT_MAX = 620
const RIGHT_DEFAULT = 320
const KEY_VAULT = 'athora:hud:vault-w'
const KEY_RIGHT = 'athora:hud:right-w'

/**
 * The custom properties the grid actually reads.
 *
 * These MUST match brain-theme.css, which templates the body as
 * `var(--br-vault-w) 6px minmax(0,1fr) 6px var(--br-right-w)` (lines 88-94) and
 * defines the defaults at lines 36-37. This hook previously wrote `--vault-w` /
 * `--right-w` — names nothing in the stylesheet consumes — so every drag set a
 * property the grid ignored and the columns never actually moved.
 */
const VAR_VAULT = '--br-vault-w'
const VAR_RIGHT = '--br-right-w'

type Which = 'vault' | 'right'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function useColumnResize() {
  const elRef = useRef<HTMLDivElement | null>(null)
  const vaultW = useRef(VAULT_DEFAULT)
  const rightW = useRef(RIGHT_DEFAULT)
  const loaded = useRef(false)

  const apply = useCallback((node: HTMLDivElement) => {
    node.style.setProperty(VAR_VAULT, `${vaultW.current}px`)
    node.style.setProperty(VAR_RIGHT, `${rightW.current}px`)
  }, [])

  // Callback ref: the body can unmount/remount. Read localStorage once, then
  // re-apply the CSS vars every time a node attaches.
  const setBodyEl = useCallback(
    (node: HTMLDivElement | null) => {
      elRef.current = node
      if (!node) return
      if (!loaded.current) {
        loaded.current = true
        const sv = Number(localStorage.getItem(KEY_VAULT))
        const sr = Number(localStorage.getItem(KEY_RIGHT))
        if (sv) vaultW.current = clamp(sv, VAULT_MIN, VAULT_MAX)
        if (sr) rightW.current = clamp(sr, RIGHT_MIN, RIGHT_MAX)
      }
      apply(node)
    },
    [apply],
  )

  const startDrag = useCallback((which: Which, e: React.PointerEvent) => {
    e.preventDefault()
    const el = elRef.current
    if (!el) return
    const startX = e.clientX
    const startVault = vaultW.current
    const startRight = rightW.current
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      if (which === 'vault') {
        // Drag right → left column widens.
        vaultW.current = clamp(startVault + dx, VAULT_MIN, VAULT_MAX)
        el.style.setProperty(VAR_VAULT, `${vaultW.current}px`)
      } else {
        // Right handle: drag left (dx<0) → right column widens.
        rightW.current = clamp(startRight - dx, RIGHT_MIN, RIGHT_MAX)
        el.style.setProperty(VAR_RIGHT, `${rightW.current}px`)
      }
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      localStorage.setItem(KEY_VAULT, String(vaultW.current))
      localStorage.setItem(KEY_RIGHT, String(rightW.current))
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  const resetDrag = useCallback((which: Which) => {
    const el = elRef.current
    if (!el) return
    if (which === 'vault') {
      vaultW.current = VAULT_DEFAULT
      el.style.setProperty(VAR_VAULT, `${VAULT_DEFAULT}px`)
      localStorage.setItem(KEY_VAULT, String(VAULT_DEFAULT))
    } else {
      rightW.current = RIGHT_DEFAULT
      el.style.setProperty(VAR_RIGHT, `${RIGHT_DEFAULT}px`)
      localStorage.setItem(KEY_RIGHT, String(RIGHT_DEFAULT))
    }
  }, [])

  return { setBodyEl, startDrag, resetDrag }
}
