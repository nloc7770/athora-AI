/**
 * Shared page-level primitives for athora's authenticated pages.
 *
 * Import from the barrel, not the individual files:
 *   import { PageContainer, PageHeader, EmptyState } from '@/components/page'
 *
 * See ./README.md for the props table and the before/after each primitive
 * replaces.
 */

export { PageContainer } from './page-container'
export { PageHeader } from './page-header'
export { EmptyState, type EmptyStateIllustration } from './empty-state'
export {
  PageToolbar,
  SearchField,
  FilterChip,
  SegmentedControl,
} from './page-toolbar'
export { ListItem, ListCard } from './list-item'
export { ListSkeleton } from './loading-state'
