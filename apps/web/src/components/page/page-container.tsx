/**
 * PageContainer — the outer wrapper every authenticated page body uses.
 *
 * Problem it solves: the audit found five different max-widths and five
 * different padding scales across /sessions, /library, /flashcards, /exam,
 * /tutor, /analytics and /settings, each hand-rolled as
 * `mx-auto max-w-4xl px-4 py-8 sm:px-6`.
 *
 * Decision: athora's pages are FULL-BLEED. There is no max-width clamp — the
 * rail already reserves its own width, so the content owns whatever is left.
 * What the pages were really getting from `max-w-*` was "text does not touch
 * the edge", and generous responsive horizontal padding gives that without
 * stranding a 1400px monitor with a 896px column.
 *
 * It also owns the vertical rhythm: children are laid out in a flex column with
 * one gap, so a page never sets `mb-8` on its header and `mb-6` on its toolbar
 * again. Put PageHeader, PageToolbar and the content in order and the spacing
 * is correct.
 *
 *   <PageContainer>
 *     <PageHeader title="Study Spaces" … />
 *     <PageToolbar search={…} />
 *     <div className="space-y-2">…</div>
 *   </PageContainer>
 *
 * No 'use client' — it renders nothing interactive.
 */

import type * as React from 'react'

import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        // Full width, never clamped. min-w-0 so a long unbreakable child
        // (a filename, a code span) shrinks instead of widening the shell.
        'flex w-full min-w-0 flex-col',
        // One vertical rhythm for every direct child.
        'gap-5 sm:gap-6',
        // Generous responsive gutters in place of the old max-width clamp.
        'px-5 py-6 sm:px-6 sm:py-8 lg:px-8',
        // The shell's scroll body is `display:block`; a trailing pad keeps the
        // last row clear of the bottom dock at <lg, where the rail docks.
        'pb-10 sm:pb-12',
        className
      )}
    >
      {children}
    </div>
  )
}
