/**
 * PageHeader — the ONE H1 treatment for every authenticated page.
 *
 * Problem it solves: the audit found seven different H1s. /sessions used
 * `text-2xl font-semibold text-stone-900`, others used `text-3xl font-bold`,
 * `text-xl`, a bare `<h2>`, and two pages had no heading element at all — so
 * the page had no accessible name and screen-reader heading navigation broke.
 *
 * One heading, one size ramp, one colour, one optional subtitle, one count
 * readout, one icon tile, one right-aligned actions row.
 *
 * Every page must render exactly one PageHeader, and it must be the first child
 * of PageContainer so the vertical rhythm is right.
 *
 *   <PageHeader
 *     title="Study Spaces"
 *     subtitle="Group documents, flashcards and quizzes for one topic."
 *     count={`${sessions.length} spaces`}
 *     icon={<BookOpen />}
 *     actions={<Button onClick={…}><Plus />New Study Space</Button>}
 *   />
 *
 * No 'use client' — the actions slot is a ReactNode, so whatever interactivity
 * it holds is the caller's client component, not this one.
 */

import type * as React from 'react'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  /** Renders as the page's single <h1>. Plain text — no markup. */
  title: string
  /** One supporting line under the title. Keep it to a sentence. */
  subtitle?: React.ReactNode
  /**
   * Optional readout pill beside the title. Pass the WHOLE phrase, including
   * the noun — `"12 documents"`, not `12` — because only the page knows
   * whether its unit is documents, cards or attempts, and the pluralisation.
   */
  count?: string | number
  /**
   * Optional leading glyph, e.g. `<BookOpen />` from lucide-react. Sized and
   * coloured by the tile, so pass the bare element without classes.
   */
  icon?: React.ReactNode
  /**
   * Right-aligned buttons. Primary first. Wraps under the title on narrow
   * screens instead of squeezing it.
   */
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  count,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        // flex-wrap is what lets the actions drop to their own line at 375px
        // rather than crushing the title to two characters per line.
        //
        // sm:flex-nowrap is the desktop half of that bargain. Wrapping stayed
        // enabled at every width, so a long title or a third action could still
        // push the buttons onto a second row on a 1350px viewport — measured on
        // /tutor, where the actions row came back 1086px wide at y=147 while the
        // title sat at y=88. Below sm the wrap is wanted; at sm and up the row
        // has the space, so the actions belong beside the title.
        //
        // items-start (not items-center) keeps the buttons level with the H1
        // itself rather than with the centre of title+subtitle — a two-line
        // subtitle would otherwise drag them halfway down the block.
        'flex w-full min-w-0 flex-wrap sm:flex-nowrap items-start justify-between gap-x-4 gap-y-3',
        className
      )}
    >
      {/* basis-full is load-bearing. With `flex-1 min-w-0` alone, flexbox
          prefers shrinking this block below its min-content width over wrapping
          the shrink-0 actions — at 375px the title collapsed to one word per
          line behind the buttons. Taking the whole first row below `sm` forces
          the actions onto their own line instead. */}
      <div className="flex min-w-0 basis-full items-start gap-3 sm:flex-1 sm:basis-0">
        {icon ? (
          <span
            aria-hidden
            className={cn(
              'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
              'border border-[var(--br-accent-line)] bg-[var(--br-accent-wash)] text-primary',
              "[&_svg]:size-[18px] [&_svg]:shrink-0"
            )}
          >
            {icon}
          </span>
        ) : null}

        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="min-w-0 text-xl font-semibold tracking-tight text-[var(--br-text)] sm:text-2xl">
              {title}
            </h1>
            {count !== undefined && count !== null && count !== '' ? (
              <span className="shrink-0 rounded-full border border-[var(--br-border)] bg-[var(--br-bg2)] px-2 py-0.5 text-[11px] font-medium text-[var(--br-text3)] tabular-nums">
                {count}
              </span>
            ) : null}
          </div>

          {subtitle ? (
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-[var(--br-text3)]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
