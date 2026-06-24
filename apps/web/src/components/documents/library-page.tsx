'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  FileText,
  Headphones,
  Video,
  FileEdit,
  Search,
  Grid,
  List,
  MoreVertical,
  Upload,
  FolderOpen,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import { useDocuments, useDocumentStatus } from '@/hooks/use-documents'
import { useCourses } from '@/hooks/use-courses'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ViewMode = 'grid' | 'list'
type DocumentType = 'pdf' | 'audio' | 'video' | 'note'
type FilterType = 'all' | DocumentType
type DocumentStatus = 'ready' | 'processing' | 'error'

interface DocumentItem {
  id: string
  name: string
  type: string
  courseId?: string
  status: string
  pageCount?: number
  createdAt: string
  updatedAt: string
}

const typeIconMap: Record<DocumentType, typeof FileText> = {
  pdf: FileText,
  audio: Headphones,
  video: Video,
  note: FileEdit,
}

const typeColorMap: Record<DocumentType, string> = {
  pdf: 'text-blue-500 bg-blue-50',
  audio: 'text-purple-500 bg-purple-50',
  video: 'text-red-500 bg-red-50',
  note: 'text-emerald-500 bg-emerald-50',
}

function getCourseName(
  courseId: string | undefined,
  courses: { id: string; name: string; code?: string }[]
): string {
  if (!courseId) return 'Uncategorized'
  const course = courses.find((c) => c.id === courseId)
  return course?.name ?? 'Unknown Course'
}

function getCourseBorderColor(courseName: string): string {
  const lower = courseName.toLowerCase()
  if (
    lower.includes('cs') ||
    lower.includes('computer') ||
    lower.includes('algorithm') ||
    lower.includes('software')
  ) {
    return 'border-l-indigo-400'
  }
  if (
    lower.includes('math') ||
    lower.includes('calculus') ||
    lower.includes('algebra') ||
    lower.includes('statistics')
  ) {
    return 'border-l-violet-400'
  }
  if (
    lower.includes('bio') ||
    lower.includes('chem') ||
    lower.includes('anatomy') ||
    lower.includes('ecology')
  ) {
    return 'border-l-cyan-400'
  }
  if (
    lower.includes('phil') ||
    lower.includes('ethics') ||
    lower.includes('logic') ||
    lower.includes('philosophy')
  ) {
    return 'border-l-amber-400'
  }
  return 'border-l-zinc-400'
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'audio', label: 'Audio' },
  { value: 'note', label: 'Notes' },
  { value: 'video', label: 'Video' },
]

function StatusDot({ status }: { status: DocumentStatus }) {
  if (status === 'ready') {
    return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
  }
  if (status === 'processing') {
    return (
      <span className="inline-block h-2 w-2 animate-spin rounded-full border border-amber-500 border-t-transparent" />
    )
  }
  return <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const variants: Record<DocumentStatus, string> = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  }

  const labels: Record<DocumentStatus, string> = {
    ready: 'Ready',
    processing: 'Processing',
    error: 'Error',
  }

  const safeStatus: DocumentStatus =
    status === 'ready' || status === 'processing' || status === 'error'
      ? status
      : 'processing'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${variants[safeStatus]}`}
    >
      <StatusDot status={safeStatus} />
      {labels[safeStatus]}
    </span>
  )
}

function SkeletonCard() {
  return (
    <Card className="flex flex-col gap-3 border-zinc-100 p-4">
      <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-100" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
        <div className="h-3 w-12 animate-pulse rounded bg-zinc-100" />
      </div>
    </Card>
  )
}

function SkeletonListItem() {
  return (
    <Card className="flex items-center gap-4 border-zinc-100 p-3">
      <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
    </Card>
  )
}

function UploadProgress({
  documentId,
}: {
  documentId: string | null
}) {
  const { status, progress, isReady } = useDocumentStatus(documentId)

  if (!documentId || isReady) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-lg border border-blue-200 bg-blue-50 p-3"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">
            {status === 'processing' ? 'Processing document...' : 'Uploading...'}
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-blue-600">{progress}%</span>
      </div>
    </motion.div>
  )
}

export default function LibraryPage() {
  const [view, setView] = useState<ViewMode>('grid')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const courseIdParam = courseFilter === 'all' ? undefined : courseFilter
  const typeParam = activeFilter === 'all' ? undefined : activeFilter

  const {
    documents,
    isLoading: docsLoading,
    error: docsError,
    uploadDocument,
    deleteDocument,
  } = useDocuments(courseIdParam, typeParam)

  const { courses, isLoading: coursesLoading } = useCourses()

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents

    const query = searchQuery.toLowerCase()
    return documents.filter((doc) => {
      const courseName = getCourseName(doc.courseId, courses)
      return (
        doc.name.toLowerCase().includes(query) ||
        courseName.toLowerCase().includes(query)
      )
    })
  }, [documents, searchQuery, courses])

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setUploadError(null)

      try {
        const uploaded = await uploadDocument({
          file,
          courseId: courseIdParam,
        })
        setUploadingDocId(uploaded.id)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Upload failed'
        setUploadError(message)
      }

      // Reset input so same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [uploadDocument, courseIdParam]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteDocument(id)
      } catch {
        // Error is handled by hook revert
      }
    },
    [deleteDocument]
  )

  const isLoading = docsLoading || coursesLoading

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.mp3,.wav,.mp4,.webm,.txt,.md"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Library
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isLoading
              ? 'Loading...'
              : `${documents.length} documents across ${courses.length} courses`}
          </p>
        </div>
        <Button className="gap-2" onClick={handleUploadClick}>
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Upload progress */}
      <AnimatePresence>
        {uploadingDocId && <UploadProgress documentId={uploadingDocId} />}
      </AnimatePresence>

      {/* Upload error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="flex-1 text-sm text-red-700">{uploadError}</p>
            <button
              onClick={() => setUploadError(null)}
              className="text-xs font-medium text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search documents, courses..."
          className="pl-10 border border-zinc-200 rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                activeFilter === option.value
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Course filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm" className="gap-2">
              <FolderOpen className="h-3.5 w-3.5" />
              {courseFilter === 'all'
                ? 'All Courses'
                : courses.find((c) => c.id === courseFilter)?.code ??
                  courses.find((c) => c.id === courseFilter)?.name ??
                  'Course'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setCourseFilter('all')}>
              All Courses
            </DropdownMenuItem>
            {courses.map((course) => (
              <DropdownMenuItem
                key={course.id}
                onClick={() => setCourseFilter(course.id)}
              >
                {course.code ? `${course.code} — ` : ''}
                {course.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-zinc-200 p-1">
          <button
            onClick={() => setView('grid')}
            className={`rounded-md p-1.5 transition-all ${
              view === 'grid'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`rounded-md p-1.5 transition-all ${
              view === 'list'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {docsError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{docsError}</p>
        </div>
      )}

      {/* Document grid/list */}
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                view === 'grid'
                  ? 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'
                  : 'flex flex-col gap-2'
              }
            >
              {Array.from({ length: 8 }).map((_, i) =>
                view === 'grid' ? (
                  <SkeletonCard key={i} />
                ) : (
                  <SkeletonListItem key={i} />
                )
              )}
            </motion.div>
          ) : filteredDocuments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full flex flex-col items-center justify-center py-16"
            >
              <FolderOpen className="h-16 w-16 text-zinc-200 mb-4" />
              <p className="text-sm text-zinc-500">
                {searchQuery.trim()
                  ? 'No documents match your search'
                  : 'No documents yet. Upload your first document to get started.'}
              </p>
              {!searchQuery.trim() && (
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={handleUploadClick}
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
              )}
            </motion.div>
          ) : view === 'grid' ? (
            <motion.div
              layout
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            >
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  courseName={getCourseName(doc.courseId, courses)}
                  onDelete={handleDelete}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div layout className="flex flex-col gap-2">
              {filteredDocuments.map((doc) => (
                <DocumentListItem
                  key={doc.id}
                  document={doc}
                  courseName={getCourseName(doc.courseId, courses)}
                  onDelete={handleDelete}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}

function DocumentCard({
  document,
  courseName,
  onDelete,
}: {
  document: DocumentItem
  courseName: string
  onDelete: (id: string) => void
}) {
  const docType = document.type as DocumentType
  const Icon = typeIconMap[docType] ?? FileText
  const colorClass = typeColorMap[docType] ?? 'text-zinc-500 bg-zinc-50'
  const status = document.status as DocumentStatus

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`group relative flex flex-col gap-3 border-zinc-100 border-l-2 ${getCourseBorderColor(courseName)} overflow-hidden p-0 transition-shadow hover:shadow-md`}
      >
        <div className="flex flex-col gap-3 p-4">
          {/* Top row: icon + menu */}
          <div className="flex items-start justify-between">
            <div className={`rounded-lg p-2 ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button
                  className="rounded-md p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100"
                  aria-label="Document options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Open</DropdownMenuItem>
                <DropdownMenuItem>Rename</DropdownMenuItem>
                <DropdownMenuItem>Move</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(document.id)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Document name */}
          <p className="line-clamp-2 text-sm font-medium text-zinc-800">
            {document.name}
          </p>

          {/* Course badge */}
          <Badge variant="secondary" className="w-fit text-xs">
            {courseName}
          </Badge>

          {/* Footer: status + date */}
          <div className="mt-auto flex items-center justify-between pt-1">
            <StatusBadge status={status} />
            <span className="text-xs text-zinc-400">
              {new Date(document.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

function DocumentListItem({
  document,
  courseName,
  onDelete,
}: {
  document: DocumentItem
  courseName: string
  onDelete: (id: string) => void
}) {
  const docType = document.type as DocumentType
  const Icon = typeIconMap[docType] ?? FileText
  const colorClass = typeColorMap[docType] ?? 'text-zinc-500 bg-zinc-50'
  const status = document.status as DocumentStatus

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={`group flex items-center gap-4 border-zinc-100 border-l-2 ${getCourseBorderColor(courseName)} p-3 transition-shadow hover:shadow-md`}
      >
        {/* Type icon */}
        <div className={`shrink-0 rounded-lg p-2 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Name + course */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-800">
            {document.name}
          </p>
          <p className="text-xs text-zinc-400">{courseName}</p>
        </div>

        {/* Status */}
        <StatusBadge status={status} />

        {/* Date */}
        <span className="hidden text-xs text-zinc-400 sm:block">
          {new Date(document.updatedAt).toLocaleDateString()}
        </span>

        {/* Page count */}
        {document.pageCount && (
          <span className="hidden text-xs text-zinc-400 md:block">
            {document.pageCount} pages
          </span>
        )}

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button
              className="shrink-0 rounded-md p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-600 group-hover:opacity-100"
              aria-label="Document options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Open</DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Move</DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(document.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    </motion.div>
  )
}
