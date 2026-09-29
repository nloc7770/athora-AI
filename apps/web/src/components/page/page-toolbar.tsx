'use client'

/**
 * PageToolbar + SearchField + FilterChip + SegmentedControl — the filter row.
 *
 * Problem it solves: every list page rebuilt the same row from scratch. The
 * audit found the search input with three different left-paddings (pl-9, pl-10,
 * pl-11) because each page eyeballed where its absolutely-positioned icon sat,
 * two different radii, and filter chips at THREE different sizes on three pages
 * (h-7 text-xs, h-8 text-sm, py-1.5 text-[13px]). The segmented "All / Recent"
 * control was hand-rolled twice with divs even though ui/tabs exists.
 *
 * So: one toolbar shell, one search field, one chip size, and a segmented
 * control that is a thin wrapper over ui/tabs rather than a fourth re-roll.
 *
 *   <PageToolbar
 *     search={<SearchField value={q} onValueChange={setQ} placeholder="Search…" hint />}
 *     filters={
 *       <>
 *         <FilterChip active={f === 'all'} onClick={() => setF('all')}>All</FilterChip>
 *         <FilterChip active={f === 'pdf'} onClick={() => setF('pdf')} count={12}>PDFs</FilterChip>
 *       </>
 *     }
 *   >
 *     <SegmentedControl value={view} onValueChange={setView} options={[…]} />
 *   </PageToolbar>
 *
 * 'use client' because SearchField and FilterChip take event handlers and
 * SegmentedControl wraps a stateful base-ui primitive.
 */

import type * as React from 'react'
import { Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

/* -------------------------------------------------------------------------- */
/* PageToolbar                                                                */
/* -------------------------------------------------------------------------- */

interface PageToolbarProps {
  /** A <SearchField />. Takes the full width on mobile, a fixed column from sm. */
  search?: React.ReactNode
  /** <FilterChip /> elements. Wrap them in a fragment; the toolbar spaces them. */
  filters?: React.ReactNode
  /** Trailing controls (segmented control, sort menu). Right-aligned from sm. */
  children?: React.ReactNode
  className?: string
}

export function PageToolbar({
  search,
  filters,
  children,
  className,
}: PageToolbarProps) {
  return (
    <div
      data-slot="page-toolbar"
      className={cn(
        'flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-2.5',
        className
      )}
    >
      {search ? (
        // Full-bleed pages have no max-width, but a search box stretched across
        // a 1600px monitor is a worse input than a 320px one. Capped here, not
        // on the page.
        <div className="w-full min-w-0 sm:w-64 md:w-72">{search}</div>
      ) : null}

      {filters ? (
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">{filters}</div>
      ) : null}

      {children ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:ml-auto">
          {children}
        </div>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* SearchField                                                               */
/* -------------------------------------------------------------------------- */

interface SearchFieldProps {
  value: string
  /** Receives the new string, not the event — pages never need e.target.value. */
  onValueChange: (value: string) => void
  placeholder?: string
  /**
   * Accessible name. There is no visible <label>, so this becomes aria-label.
   * Be specific: "Search study spaces", not "Search".
   */
  label?: string
  /** Show the ⌘K affordance on the right. Only pass it if the page binds ⌘K. */
  hint?: boolean
  className?: string
}

export function SearchField({
  value,
  onValueChange,
  placeholder = 'Search…',
  label = 'Search',
  hint = false,
  className,
}: SearchFieldProps) {
  return (
    <div className={cn('relative w-full min-w-0', className)}>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--br-text3)]"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cn(
          // ONE geometry: h-9, rounded-xl, pl-9. The icon above is positioned to
          // match, so no page needs to guess a padding again.
          'h-9 rounded-xl pl-9 text-sm',
          hint && 'pr-14',
          'border-[var(--br-border)] bg-[var(--br-field-bg)] text-[var(--br-text)]',
          'placeholder:text-[var(--br-text3)]',
          'dark:bg-[var(--br-field-bg)]',
          // Strip Safari/Chrome's own search affordances so the field matches.
          '[&::-webkit-search-cancel-button]:appearance-none'
        )}
      />
      {hint ? (
        <kbd
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-[var(--br-border)] bg-[var(--br-bg2)] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[var(--br-text3)]"
        >
          ⌘K
        </kbd>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* FilterChip                                                                */
/* -------------------------------------------------------------------------- */

interface FilterChipProps {
  /** Toggled state. Renders as aria-pressed so it is announced, not just tinted. */
  active?: boolean
  onClick?: () => void
  /** Optional trailing tally, e.g. how many items match this filter. */
  count?: number
  children: React.ReactNode
  className?: string
}

/**
 * ONE chip size. h-8 / px-3 / text-xs / rounded-full, active = accent wash.
 * Do not pass a size override — three sizes is the bug this replaced.
 */
export function FilterChip({
  active = false,
  onClick,
  count,
  children,
  className,
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium',
        'transition-colors outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/60',
        active
          ? 'border-[var(--br-accent-line)] bg-[var(--br-accent-wash)] text-[var(--br-accent-ink)]'
          : 'border-[var(--br-border)] bg-[var(--br-bg2)] text-[var(--br-text2)] hover:border-[var(--br-accent-line)] hover:text-[var(--br-text)]',
        "[&_svg]:size-3.5 [&_svg]:shrink-0",
        className
      )}
    >
      {children}
      {count !== undefined ? (
        <span className="tabular-nums opacity-60">{count}</span>
      ) : null}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* SegmentedControl                                                          */
/* -------------------------------------------------------------------------- */

interface SegmentedOption {
  value: string
  label: React.ReactNode
  /** Optional leading glyph, e.g. <List /> / <LayoutGrid /> for view switching. */
  icon?: React.ReactNode
}

interface SegmentedControlProps {
  value: string
  onValueChange: (value: string) => void
  options: SegmentedOption[]
  /** Accessible name for the group, e.g. "View mode". */
  label?: string
  className?: string
}

/**
 * A segmented control is ui/tabs with no panels — this wraps the primitive so
 * nobody hand-rolls a div-with-buttons version again.
 */
export function SegmentedControl({
  value,
  onValueChange,
  options,
  label,
  className,
}: SegmentedControlProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      className={cn('w-auto', className)}
    >
      <TabsList
        aria-label={label}
        className="h-9 border border-[var(--br-border)] bg-[var(--br-bg2)]"
      >
        {options.map((option) => (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className="gap-1.5 px-3 text-xs text-[var(--br-text2)] data-active:bg-[var(--br-accent-wash)] data-active:text-[var(--br-accent-ink)] dark:data-active:border-[var(--br-accent-line)] dark:data-active:bg-[var(--br-accent-wash)] dark:data-active:text-[var(--br-accent-ink)]"
          >
            {option.icon}
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
