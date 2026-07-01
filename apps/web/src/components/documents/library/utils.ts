import {
  FileText,
  Headphones,
  Video,
  FileEdit,
} from 'lucide-react'
import type { DocumentItem, DocumentType, DocumentStatus, SortOption, CourseItem } from './types'

export const SORT_STORAGE_KEY = 'library-sort'
export const FAVORITES_STORAGE_KEY = 'library-favorites'

export const typeIconMap: Record<DocumentType, typeof FileText> = {
  pdf: FileText,
  audio: Headphones,
  video: Video,
  note: FileEdit,
}

export const typeColorMap: Record<DocumentType, { icon: string; bg: string; darkBg: string }> = {
  pdf: { icon: 'text-blue-600', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-950/40' },
  audio: { icon: 'text-purple-600', bg: 'bg-purple-50', darkBg: 'dark:bg-purple-950/40' },
  video: { icon: 'text-red-600', bg: 'bg-red-50', darkBg: 'dark:bg-red-950/40' },
  note: { icon: 'text-emerald-600', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-950/40' },
}

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'largest', label: 'Size' },
]

export const filterOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
  { value: 'note', label: 'Notes' },
  { value: 'favorites', label: 'Favorites' },
]

export function getSavedFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (saved) return new Set(JSON.parse(saved) as string[])
  } catch {
    // ignore
  }
  return new Set()
}

export function saveFavorites(favorites: Set<string>): void {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...favorites]))
}

export function getSavedSort(): SortOption {
  if (typeof window === 'undefined') return 'newest'
  const saved = localStorage.getItem(SORT_STORAGE_KEY)
  if (saved && sortOptions.some((o) => o.value === saved)) return saved as SortOption
  return 'newest'
}

export function sortDocuments(docs: DocumentItem[], sort: SortOption): DocumentItem[] {
  const sorted = [...docs]
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    case 'largest':
      return sorted.sort((a, b) => (b.file_size ?? 0) - (a.file_size ?? 0))
    default:
      return sorted
  }
}

export function getCourseName(courseId: string | undefined, courses: CourseItem[]): string {
  if (!courseId) return 'Uncategorized'
  const course = courses.find((c) => c.id === courseId)
  return course?.name ?? 'Unknown Course'
}

export function getCourseColor(courseId: string | undefined, courses: CourseItem[]): string | undefined {
  if (!courseId) return undefined
  const course = courses.find((c) => c.id === courseId)
  return course?.color ?? undefined
}

export function formatFileDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
