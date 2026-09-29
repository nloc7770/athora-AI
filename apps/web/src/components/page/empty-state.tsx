/**
 * EmptyState — the ONE empty/zero-data treatment for every page.
 *
 * Problem it solves: the audit found seven different empty states. Some were a
 * dashed box with a lucide glyph in a grey circle, some a bare centred <p>, one
 * had no CTA at all, and none of them used the illustration set that already
 * ships in `public/images/states/`.
 *
 * ILLUSTRATION FRAMING — read this before changing the styling.
 * The WebP files are 1254x1254 3D renders with a SOLID near-white background
 * (they were authored for athora's light theme). Dropped onto the brain's
 * #0e0e16 field as-is, each one reads as a glaring white square. Two things fix
 * that here, and both are load-bearing:
 *   1. A radial `mask-image` fades the flat background out before it reaches the
 *      edge of the box, so there is no hard white rectangle — what is left is a
 *      soft halo behind the subject, which reads as a deliberate spotlight on
 *      dark rather than a mis-exported asset.
 *   2. The box is capped at 160px (192px from `sm`) and the image is dimmed
 *      slightly, so the bright area stays a focal point instead of the loudest
 *      thing on the screen.
 * The art itself is violet-toned, which no longer matches the orange accent —
 * that is a cosmetic mismatch in the source assets, not something CSS should
 * hue-rotate. The CTA underneath carries the orange, so the accent still reads.
 *
 * `illustration` is a NAMED KEY, not a path — pages cannot mistype a filename
 * and ship a 404. Add a key here rather than passing a string through.
 *
 *   <EmptyState
 *     illustration="sessions"
 *     title="No study spaces yet"
 *     description="A study space groups your documents, flashcards and quizzes for one topic."
 *     action={<Button onClick={…}><Plus />New Study Space</Button>}
 *   />
 *
 * Search-with-no-results is a DIFFERENT state from has-no-data-yet — use
 * `illustration="search"` and drop the primary CTA, because "create one" is the
 * wrong advice when the user has 40 items and a bad query.
 *
 * No 'use client' — the action slots are ReactNodes owned by the caller.
 */

import Image from 'next/image'
import type * as React from 'react'

import { cn } from '@/lib/utils'

/** Named illustrations. Keys are stable API; the paths are an implementation detail. */
const ILLUSTRATIONS = {
  documents: '/images/states/empty-documents.webp',
  library: '/images/states/empty-library.webp',
  sessions: '/images/states/empty-sessions.webp',
  flashcards: '/images/states/empty-flashcards.webp',
  exams: '/images/states/empty-exams.webp',
  search: '/images/states/search-no-results.webp',
  offline: '/images/states/error-offline.webp',
  // Completion / success states. Same framing, different moment.
  examResults: '/images/states/exam-results.webp',
  flashcardsComplete: '/images/states/flashcards-complete.webp',
  uploadSuccess: '/images/states/upload-success.webp',
} as const

export type EmptyStateIllustration = keyof typeof ILLUSTRATIONS

/**
 * Feathers the illustration's opaque light background into the dark field.
 * The stops are tuned to these specific renders: the subject occupies roughly
 * the middle 60%, so the fade starts at 40% and is fully transparent by 70%.
 */
const ILLUSTRATION_MASK =
  'radial-gradient(circle at 50% 47%, #000 40%, rgba(0,0,0,0.45) 57%, transparent 70%)'

interface EmptyStateProps {
  illustration: EmptyStateIllustration
  title: string
  description?: React.ReactNode
  /** Primary CTA. Omit it for "no search results" — there is nothing to create. */
  action?: React.ReactNode
  /** Optional lower-emphasis escape hatch, e.g. "Clear filters". */
  secondaryAction?: React.ReactNode
  className?: string
}

export function EmptyState({
  illustration,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex w-full min-w-0 flex-col items-center justify-center px-4 py-12 text-center sm:py-16',
        className
      )}
    >
      {/* Soft accent bloom under the art, so the halo sits on something warm
          instead of floating. Cheap, and it ties the violet render to orange. */}
      <div className="relative flex items-center justify-center">
        <span
          aria-hidden
          className="pointer-events-none absolute size-40 rounded-full bg-[var(--br-accent-wash)] blur-2xl sm:size-48"
        />
        <Image
          src={ILLUSTRATIONS[illustration]}
          alt=""
          aria-hidden
          width={384}
          height={384}
          sizes="192px"
          className="relative size-40 select-none opacity-90 sm:size-48"
          style={{
            maskImage: ILLUSTRATION_MASK,
            WebkitMaskImage: ILLUSTRATION_MASK,
          }}
        />
      </div>

      <h2 className="mt-1 text-base font-semibold text-[var(--br-text)] sm:text-lg">
        {title}
      </h2>

      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--br-text3)]">
          {description}
        </p>
      ) : null}

      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  )
}
