/**
 * ListSkeleton — the ONE loading placeholder, shaped like ListItem / ListCard.
 *
 * Problem it solves: two things. The skeletons did not match the rows they
 * stood in for (/sessions rendered a `p-5` block where the real row is `py-3`,
 * so the list visibly jumped when data arrived), and — the real bug — only 2 of
 * the 7 pages announced loading at all. The other five swapped silently, so a
 * screen-reader user heard nothing between "empty" and "12 results".
 *
 * So this carries `role="status"` + `aria-busy` + one sr-only sentence, and its
 * geometry is copied from list-item.tsx. Change a padding there, change it here.
 *
 *   {isLoading ? <ListSkeleton count={4} /> : …}
 *   {isLoading ? <ListSkeleton count={6} variant="card" className="grid …" /> : …}
 *
 * No 'use client' — pure markup.
 */

import { cn } from '@/lib/utils'

/** One shimmer block. `animate-pulse` is Tailwind's; no new dependency. */
function Bar({ className }: { className?: string }) {
  return (
    <span
      className={cn('block animate-pulse rounded-md bg-white/[0.07]', className)}
      aria-hidden
    />
  )
}

interface ListSkeletonProps {
  /** How many placeholders. Match the typical page size, not the max. */
  count?: number
  /** `row` mirrors ListItem, `card` mirrors ListCard. */
  variant?: 'row' | 'card'
  /**
   * What is loading, for screen readers — "Loading study spaces". The sentence
   * is sr-only; sighted users get the shimmer.
   */
  label?: string
  /** Put the grid classes here for `variant="card"`. */
  className?: string
}

export function ListSkeleton({
  count = 4,
  variant = 'row',
  label = 'Loading',
  className,
}: ListSkeletonProps) {
  const isCard = variant === 'card'

  return (
    <div
      role="status"
      aria-busy="true"
      // aria-live is deliberately absent: role="status" already implies polite,
      // and the sr-only text is rendered once, not updated.
      data-slot="list-skeleton"
      className={cn(
        isCard
          ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
          : 'flex flex-col gap-2',
        className
      )}
    >
      <span className="sr-only">{label}…</span>

      {Array.from({ length: count }).map((_, i) =>
        isCard ? (
          // Mirrors ListCard: p-4, 40px leading tile, divider, meta strip.
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-[var(--br-border)] bg-[var(--br-bg2)] p-4"
          >
            <div className="flex items-start gap-3">
              <Bar className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Bar className="h-4 w-2/3" />
                <Bar className="h-3 w-full" />
              </div>
            </div>
            <div className="border-t border-[var(--br-border)] pt-3">
              <Bar className="h-3 w-1/3" />
            </div>
          </div>
        ) : (
          // Mirrors ListItem: px-3.5 py-3, 36px leading tile, title + meta.
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-[var(--br-border)] bg-[var(--br-bg2)] px-3.5 py-3"
          >
            <Bar className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Bar className="h-4 w-1/3" />
              <Bar className="h-3 w-1/2" />
            </div>
            <Bar className="h-5 w-14 shrink-0 rounded-full" />
          </div>
        )
      )}
    </div>
  )
}
