'use client'

/**
 * ListItem (a row) and ListCard (a grid tile) — the ONE clickable surface.
 *
 * Problem it solves: the audit found five different list shapes. /sessions used
 * `rounded-xl border-stone-200 bg-white p-5 hover:border-purple-200`, /library
 * a `rounded-2xl` card with `p-4` and a shadow hover, /flashcards a `rounded-lg`
 * `p-3` row with no hover at all, and two of the five were plain `<div onClick>`
 * — not focusable, not keyboard-operable, invisible to a screen reader.
 *
 * So: one radius (rounded-xl), one padding scale, one hover (accent-tinted
 * border + a 4% white lift), one focus-visible ring, and a real <a>/<button>
 * so Tab and Enter work.
 *
 * WHY THE STRETCHED LINK. Rows need a hover-revealed action (delete, menu), and
 * a <button> inside an <a> is invalid HTML — the nested control is unreachable
 * by keyboard and browsers re-parent it. Instead the title renders the real
 * <a>/<button> and an `::after` pseudo-element stretches it over the whole row,
 * so the entire row is the click target with ONE focusable element. The action
 * slot sits above it on `z-10`, so its own click does not trigger the row. That
 * also means the focus ring is drawn on the pseudo-element — it outlines the
 * full row, not just the title text.
 *
 *   <ListItem
 *     href={`/sessions/${s.id}`}
 *     icon={<FileText />}
 *     title={s.name}
 *     meta={<>{s.document_count} documents · {relative(s.updated_at)}</>}
 *     badge={<Badge>Ready</Badge>}
 *     action={<Button variant="ghost" size="icon-sm" aria-label={`Delete ${s.name}`}><Trash2 /></Button>}
 *   />
 *
 * 'use client' because both take onClick handlers.
 */

import Image from 'next/image'
import Link from 'next/link'
import type * as React from 'react'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

/** Shared surface recipe. Changing a token here changes every page at once. */
const SURFACE = [
  'group/item relative min-w-0 rounded-xl border transition-colors',
  'border-[var(--br-border)] bg-[var(--br-bg2)]',
  // ONE hover. No shadow-jump, no border colour roulette.
  'hover:border-[var(--br-accent-line)] hover:bg-white/[0.04]',
] as const

/** Focus ring, drawn on the stretched ::after so it outlines the whole surface. */
const STRETCH_LINK = [
  'min-w-0 outline-none',
  'after:absolute after:inset-0 after:rounded-xl after:content-[""]',
  'focus-visible:after:ring-2 focus-visible:after:ring-ring/70',
] as const

interface ClickTarget {
  /** Internal route. Renders an <a>; takes precedence over onClick. */
  href?: string
  /** Renders a <button> when there is no href. */
  onClick?: () => void
  /**
   * Accessible name for the row's control when `title` is not plain text.
   * Skip it when title is a string — the string is already the name.
   */
  label?: string
}

/** Renders the row's single focusable control, stretched over the surface. */
function StretchedTarget({
  href,
  onClick,
  label,
  children,
  className,
}: ClickTarget & { children: React.ReactNode; className?: string }) {
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cn(STRETCH_LINK, className)}>
        {children}
      </Link>
    )
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(STRETCH_LINK, 'text-left', className)}
      >
        {children}
      </button>
    )
  }
  return <span className={cn('min-w-0', className)}>{children}</span>
}

/** Leading icon tile or square thumbnail. One size, one radius. */
function Leading({
  icon,
  thumbnail,
  thumbnailAlt,
  size,
}: {
  icon?: React.ReactNode
  thumbnail?: string
  thumbnailAlt?: string
  size: number
}) {
  if (thumbnail) {
    return (
      <Image
        src={thumbnail}
        alt={thumbnailAlt ?? ''}
        width={size * 2}
        height={size * 2}
        className="shrink-0 rounded-lg border border-[var(--br-border)] object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  if (icon) {
    return (
      <span
        aria-hidden
        className="flex shrink-0 items-center justify-center rounded-lg border border-[var(--br-accent-line)] bg-[var(--br-accent-wash)] text-primary [&_svg]:size-[18px] [&_svg]:shrink-0"
        style={{ width: size, height: size }}
      >
        {icon}
      </span>
    )
  }
  return null
}

/* -------------------------------------------------------------------------- */
/* ListItem — the row                                                        */
/* -------------------------------------------------------------------------- */

interface ListItemProps extends ClickTarget {
  title: React.ReactNode
  /** One line under the title: counts, dates, status. Keep it to one line. */
  meta?: React.ReactNode
  icon?: React.ReactNode
  /** Square image src. Wins over `icon` if both are given. */
  thumbnail?: string
  thumbnailAlt?: string
  /** Trailing status pill — pass a <Badge />. */
  badge?: React.ReactNode
  /**
   * Trailing chevron. Defaults to true when the row navigates (href), false
   * for an onClick row, where the affordance is usually the action itself.
   */
  chevron?: boolean
  /**
   * Hover-revealed trailing control (delete, overflow menu). Always visible on
   * touch and whenever it has focus, so it is never keyboard-unreachable.
   */
  action?: React.ReactNode
  /** Persistent selected state, e.g. the row whose detail pane is open. */
  selected?: boolean
  className?: string
}

export function ListItem({
  title,
  meta,
  icon,
  thumbnail,
  thumbnailAlt,
  badge,
  chevron,
  action,
  selected = false,
  href,
  onClick,
  label,
  className,
}: ListItemProps) {
  const showChevron = chevron ?? Boolean(href)

  return (
    <div
      data-slot="list-item"
      data-selected={selected || undefined}
      className={cn(
        SURFACE,
        'flex items-center gap-3 px-3.5 py-3',
        selected && 'border-[var(--br-accent-line)] bg-[var(--br-accent-wash)]',
        className
      )}
    >
      <Leading icon={icon} thumbnail={thumbnail} thumbnailAlt={thumbnailAlt} size={36} />

      <div className="min-w-0 flex-1">
        <StretchedTarget href={href} onClick={onClick} label={label} className="block">
          <span className="block truncate text-sm font-medium text-[var(--br-text)]">
            {title}
          </span>
        </StretchedTarget>
        {meta ? (
          <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--br-text3)]">
            {meta}
          </span>
        ) : null}
      </div>

      {badge ? <div className="relative z-10 shrink-0">{badge}</div> : null}

      {action ? (
        // z-10 lifts it above the stretched ::after so its own click lands here.
        // `opacity-100` under hover/focus-within AND on touch (no-hover media),
        // because a hover-only control does not exist on a phone.
        <div className="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100 max-[1023px]:opacity-100">
          {action}
        </div>
      ) : null}

      {showChevron ? (
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 text-[var(--br-text3)] transition-colors group-hover/item:text-primary"
        />
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* ListCard — the grid tile                                                  */
/* -------------------------------------------------------------------------- */

interface ListCardProps extends ClickTarget {
  title: React.ReactNode
  /** Two-line-clamped body copy. Optional. */
  description?: React.ReactNode
  /** Bottom strip: counts, dates, progress. */
  meta?: React.ReactNode
  icon?: React.ReactNode
  thumbnail?: string
  thumbnailAlt?: string
  badge?: React.ReactNode
  action?: React.ReactNode
  selected?: boolean
  className?: string
}

/**
 * Same tokens as ListItem, laid out vertically for `grid grid-cols-1
 * sm:grid-cols-2 lg:grid-cols-3` pages (/library, /flashcards). Use ListItem
 * unless the content genuinely needs a thumbnail or a description block — a
 * row list scans faster.
 */
export function ListCard({
  title,
  description,
  meta,
  icon,
  thumbnail,
  thumbnailAlt,
  badge,
  action,
  selected = false,
  href,
  onClick,
  label,
  className,
}: ListCardProps) {
  return (
    <div
      data-slot="list-card"
      data-selected={selected || undefined}
      className={cn(
        SURFACE,
        'flex flex-col gap-3 p-4',
        selected && 'border-[var(--br-accent-line)] bg-[var(--br-accent-wash)]',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Leading icon={icon} thumbnail={thumbnail} thumbnailAlt={thumbnailAlt} size={40} />

        <div className="min-w-0 flex-1">
          <StretchedTarget href={href} onClick={onClick} label={label} className="block">
            <span className="block truncate text-sm font-medium text-[var(--br-text)]">
              {title}
            </span>
          </StretchedTarget>
          {description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--br-text3)]">
              {description}
            </p>
          ) : null}
        </div>

        {action ? (
          <div className="relative z-10 shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100 max-[1023px]:opacity-100">
            {action}
          </div>
        ) : null}
      </div>

      {meta || badge ? (
        // mt-auto pins the meta strip to the bottom, so every card in a grid row
        // has its divider on the same line even when descriptions differ in
        // length (grid items stretch to the row height regardless).
        <div className="mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--br-border)] pt-3 text-xs text-[var(--br-text3)]">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">{meta}</span>
          {badge ? <span className="relative z-10 shrink-0">{badge}</span> : null}
        </div>
      ) : null}
    </div>
  )
}
