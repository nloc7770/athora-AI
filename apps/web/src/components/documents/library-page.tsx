'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  FileText,
  Headphones,
  Video,
  FileEdit,
  Search,
  Filter,
  Grid,
  List,
  MoreVertical,
  Upload,
  FolderOpen,
} from 'lucide-react'

import { documents, courses } from '@/data/mock'
import type { Document } from '@/data/mock'
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
type FilterType = 'all' | 'pdf' | 'audio' | 'note' | 'video'

const typeIconMap: Record<Document['type'], typeof FileText> = {
  pdf: FileText,
  audio: Headphones,
  video: Video,
  note: FileEdit,
}

const typeColorMap: Record<Document['type'], string> = {
  pdf: 'text-blue-500 bg-blue-50',
  audio: 'text-purple-500 bg-purple-50',
  video: 'text-red-500 bg-red-50',
  note: 'text-emerald-500 bg-emerald-50',
}

function getCourseBorderColor(courseName: string): string {
  const lower = courseName.toLowerCase()
  if (lower.includes('cs') || lower.includes('computer') || lower.includes('algorithm') || lower.includes('software')) {
    return 'border-l-indigo-400'
  }
  if (lower.includes('math') || lower.includes('calculus') || lower.includes('algebra') || lower.includes('statistics')) {
    return 'border-l-violet-400'
  }
  if (lower.includes('bio') || lower.includes('chem') || lower.includes('anatomy') || lower.includes('ecology')) {
    return 'border-l-cyan-400'
  }
  if (lower.includes('phil') || lower.includes('ethics') || lower.includes('logic') || lower.includes('philosophy')) {
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

function StatusDot({ status }: { status: Document['status'] }) {
  if (status === 'ready') {
    return <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
  }
  if (status === 'processing') {
    return <span className="inline-block h-2 w-2 animate-spin rounded-full border border-amber-500 border-t-transparent" />
  }
  return <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
}

function StatusBadge({ status }: { status: Document['status'] }) {
  const variants: Record<Document['status'], string> = {
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    processing: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  }

  const labels: Record<Document['status'], string> = {
    ready: 'Ready',
    processing: 'Processing',
    error: 'Error',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${variants[status]}`}>
      <StatusDot status={status} />
      {labels[status]}
    </span>
  )
}

export default function LibraryPage() {
  const [view, setView] = useState<ViewMode>('grid')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')

  const filteredDocuments = useMemo(() => {
    let filtered = [...documents]

    if (activeFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.type === activeFilter)
    }

    if (courseFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.courseId === courseFilter)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.courseName.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [activeFilter, courseFilter, searchQuery])

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Library
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {documents.length} documents across {courses.length} courses
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

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
                : courses.find((c) => c.id === courseFilter)?.code}
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
                {course.code} — {course.name}
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

      {/* Document grid/list */}
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {filteredDocuments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full flex flex-col items-center justify-center py-16"
            >
              <img src="/images/empty-state.png" alt="No documents found" className="h-32 w-32 opacity-60 mb-4" />
              <p className="text-sm text-zinc-500">No documents match your search</p>
            </motion.div>
          ) : view === 'grid' ? (
            <motion.div
              layout
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            >
              {filteredDocuments.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </motion.div>
          ) : (
            <motion.div layout className="flex flex-col gap-2">
              {filteredDocuments.map((doc) => (
                <DocumentListItem key={doc.id} document={doc} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}

function DocumentCard({ document }: { document: Document }) {
  const Icon = typeIconMap[document.type]
  const colorClass = typeColorMap[document.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`group relative flex flex-col gap-3 border-zinc-100 border-l-2 ${getCourseBorderColor(document.courseName)} overflow-hidden p-0 transition-shadow hover:shadow-md`}>
        {/* Card content */}
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
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Document name */}
        <p className="line-clamp-2 text-sm font-medium text-zinc-800">
          {document.name}
        </p>

        {/* Course badge */}
        <Badge variant="secondary" className="w-fit text-xs">
          {document.courseName}
        </Badge>

        {/* Footer: status + last studied */}
        <div className="mt-auto flex items-center justify-between pt-1">
          <StatusBadge status={document.status} />
          <span className="text-xs text-zinc-400">
            {document.lastStudied ?? 'Not studied'}
          </span>
        </div>
        </div>
      </Card>
    </motion.div>
  )
}

function DocumentListItem({ document }: { document: Document }) {
  const Icon = typeIconMap[document.type]
  const colorClass = typeColorMap[document.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
    >
      <Card className={`group flex items-center gap-4 border-zinc-100 border-l-2 ${getCourseBorderColor(document.courseName)} p-3 transition-shadow hover:shadow-md`}>
        {/* Type icon */}
        <div className={`shrink-0 rounded-lg p-2 ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Name + course */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-800">
            {document.name}
          </p>
          <p className="text-xs text-zinc-400">{document.courseName}</p>
        </div>

        {/* Status */}
        <StatusBadge status={document.status} />

        {/* Last studied */}
        <span className="hidden text-xs text-zinc-400 sm:block">
          {document.lastStudied ?? 'Not studied'}
        </span>

        {/* Size */}
        <span className="hidden text-xs text-zinc-400 md:block">
          {document.size}
        </span>

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
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    </motion.div>
  )
}
