'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import {
  Search,
  Upload,
  ArrowUpDown,
  CheckSquare,
  Square,
  Trash2,
  FolderInput,
  FolderOpen,
  FileText,
} from 'lucide-react'

import { useDocuments } from '@/hooks/use-documents'
import { useCourses } from '@/hooks/use-courses'
import { useToastStore } from '@/stores/toast-store'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { DocumentItem, UploadingFile, FilterType, SortOption } from './library/types'
import {
  filterOptions,
  sortOptions,
  getSavedFavorites,
  saveFavorites,
  getSavedSort,
  sortDocuments,
  getCourseName,
  getCourseColor,
  SORT_STORAGE_KEY,
} from './library/utils'
import { DocumentCard, DocumentListItem } from './library/document-card'
import {
  UploadProgress,
  UploadBatchProgress,
  UploadError,
  DragOverlay,
  DeleteDialog,
  RenameDialog,
  MoveDialog,
} from './library/library-dialogs'

function SkeletonCard() {
  return (
    <Card className="flex flex-col gap-3 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
      <div className="h-9 w-9 animate-pulse rounded-lg bg-stone-100 dark:bg-stone-800" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
      <div className="mt-auto flex items-center justify-between pt-1">
        <div className="h-5 w-16 animate-pulse rounded-full bg-stone-100 dark:bg-stone-800" />
        <div className="h-3 w-12 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
      </div>
    </Card>
  )
}

export default function LibraryPage() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'name' | 'fulltext'>('name')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [sortOption, setSortOption] = useState<SortOption>(getSavedSort)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null)
  const [renameLoading, setRenameLoading] = useState(false)
  const [moveDoc, setMoveDoc] = useState<DocumentItem | null>(null)
  const [moveLoading, setMoveLoading] = useState(false)
  const [bulkMoveIds, setBulkMoveIds] = useState<Set<string>>(new Set())
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null)

  const [favorites, setFavorites] = useState<Set<string>>(getSavedFavorites)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const courseIdParam = courseFilter === 'all' ? undefined : courseFilter
  const typeParam = activeFilter === 'all' || activeFilter === 'favorites' ? undefined : activeFilter

  const {
    documents,
    isLoading: docsLoading,
    error: docsError,
    uploadDocument,
    deleteDocument,
    renameDocument,
    moveDocument,
  } = useDocuments({ courseId: courseIdParam, type: typeParam })

  const { courses, isLoading: coursesLoading } = useCourses()
  const addToast = useToastStore((s) => s.addToast)

  const filteredDocuments = useMemo(() => {
    let result = documents

    if (activeFilter === 'favorites') {
      result = result.filter((doc) => favorites.has(doc.id))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((doc) => {
        const courseName = getCourseName(doc.courseId, courses)
        return doc.name.toLowerCase().includes(query) || courseName.toLowerCase().includes(query)
      })
    }

    const sorted = sortDocuments(result, sortOption)

    if (activeFilter !== 'favorites' && favorites.size > 0) {
      const favDocs = sorted.filter((doc) => favorites.has(doc.id))
      const nonFavDocs = sorted.filter((doc) => !favorites.has(doc.id))
      return [...favDocs, ...nonFavDocs]
    }

    return sorted
  }, [documents, searchQuery, courses, sortOption, activeFilter, favorites])

  const handleSortChange = useCallback((value: SortOption) => {
    setSortOption(value)
    localStorage.setItem(SORT_STORAGE_KEY, value)
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveFavorites(next)
      return next
    })
  }, [])

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) setSelectedIds(new Set())
      return !prev
    })
  }, [])

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredDocuments.map((d) => d.id)))
    }
  }, [selectedIds.size, filteredDocuments])

  const handleBulkDelete = useCallback(async () => {
    const ids = [...selectedIds]
    for (const id of ids) {
      try { await deleteDocument(id) } catch { /* handled by hook */ }
    }
    setSelectedIds(new Set())
    setSelectMode(false)
    addToast(`${ids.length} document(s) deleted`, 'success')
  }, [selectedIds, deleteDocument, addToast])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape' && selectMode) {
        setSelectMode(false)
        setSelectedIds(new Set())
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectMode])

  const handleUploadClick = useCallback(() => { fileInputRef.current?.click() }, [])

  const uploadMultipleFiles = useCallback(async (files: File[]) => {
    const batch: UploadingFile[] = files.map((file) => ({ file, status: 'uploading' as const }))
    setUploadingFiles((prev) => [...prev, ...batch])

    for (const file of files) {
      try {
        const uploaded = await uploadDocument(file, { courseId: courseIdParam })
        setUploadingFiles((prev) => prev.map((uf) => uf.file === file ? { ...uf, status: 'done', documentId: uploaded.id } : uf))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setUploadingFiles((prev) => prev.map((uf) => uf.file === file ? { ...uf, status: 'error', error: message } : uf))
      }
    }
  }, [uploadDocument, courseIdParam])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadError(null)

    if (files.length === 1) {
      try {
        const uploaded = await uploadDocument(files[0], { courseId: courseIdParam })
        setUploadingDocId(uploaded.id)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
      }
    } else {
      await uploadMultipleFiles(Array.from(files))
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [uploadDocument, courseIdParam, uploadMultipleFiles])

  const handleRetryUpload = useCallback(async (uploadingFile: UploadingFile) => {
    setUploadingFiles((prev) => prev.map((uf) => uf.file === uploadingFile.file ? { ...uf, status: 'uploading', error: undefined } : uf))
    try {
      const uploaded = await uploadDocument(uploadingFile.file, { courseId: courseIdParam })
      setUploadingFiles((prev) => prev.map((uf) => uf.file === uploadingFile.file ? { ...uf, status: 'done', documentId: uploaded.id } : uf))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setUploadingFiles((prev) => prev.map((uf) => uf.file === uploadingFile.file ? { ...uf, status: 'error', error: message } : uf))
    }
  }, [uploadDocument, courseIdParam])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounterRef.current += 1
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current === 0) setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    if (files.length === 1) {
      try {
        const uploaded = await uploadDocument(files[0], { courseId: courseIdParam })
        setUploadingDocId(uploaded.id)
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed')
      }
    } else {
      await uploadMultipleFiles(files)
    }
  }, [uploadDocument, courseIdParam, uploadMultipleFiles])

  const handleOpen = useCallback((doc: DocumentItem) => {
    if (doc.session_id) router.push(`/sessions/${doc.session_id}`)
    else router.push(`/sessions?doc=${doc.id}`)
  }, [router])

  const handleQuickAction = useCallback((doc: DocumentItem, tab: string) => {
    if (doc.session_id) router.push(`/sessions/${doc.session_id}?tab=${tab}`)
    else router.push(`/sessions?doc=${doc.id}&tab=${tab}`)
  }, [router])

  const confirmDelete = useCallback(() => {
    if (documentToDelete) { deleteDocument(documentToDelete); setDocumentToDelete(null) }
  }, [documentToDelete, deleteDocument])

  const handleRenameSubmit = useCallback(async (name: string) => {
    if (!renameDoc) return
    setRenameLoading(true)
    try {
      await renameDocument(renameDoc.id, name)
      addToast('Document renamed', 'success')
      setRenameDoc(null)
    } catch { addToast('Failed to rename', 'error') }
    finally { setRenameLoading(false) }
  }, [renameDoc, renameDocument, addToast])

  const handleMoveSubmit = useCallback(async (courseId: string | null) => {
    const isBulk = bulkMoveIds.size > 0
    const ids = isBulk ? [...bulkMoveIds] : moveDoc ? [moveDoc.id] : []
    if (ids.length === 0) return
    setMoveLoading(true)
    try {
      for (const id of ids) {
        await moveDocument(id, courseId)
      }
      const courseName = courseId
        ? courses.find((c) => c.id === courseId)?.name ?? 'selected course'
        : 'Uncategorized'
      addToast(`Moved ${ids.length} document${ids.length > 1 ? 's' : ''} to ${courseName}`, 'success')
      setMoveDoc(null)
      setBulkMoveIds(new Set())
      if (isBulk) {
        setSelectedIds(new Set())
        setSelectMode(false)
      }
    } catch { addToast('Failed to move', 'error') }
    finally { setMoveLoading(false) }
  }, [moveDoc, bulkMoveIds, moveDocument, courses, addToast])

  const isLoading = docsLoading || coursesLoading

  return (
    <div
      className="relative flex h-full flex-col gap-5 px-6 py-6 dark:bg-stone-950"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <AnimatePresence>{isDragOver && <DragOverlay />}</AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.mp3,.wav,.mp4,.webm,.txt,.md"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          Library
        </h1>
        <Button className="gap-2 rounded-xl" onClick={handleUploadClick}>
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Search + Sort row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
            <Input
              ref={searchInputRef}
              placeholder={searchMode === 'name' ? 'Search documents...' : 'Search inside documents...'}
              className="pl-10 pr-14 rounded-xl border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 text-[11px] font-medium text-stone-500 dark:text-stone-400">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </div>
          <div className="flex items-center rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 p-0.5">
            <button
              onClick={() => setSearchMode('name')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150',
                searchMode === 'name'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              Name only
            </button>
            <button
              onClick={() => setSearchMode('fulltext')}
              className={cn(
                'relative rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150',
                searchMode === 'fulltext'
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              )}
            >
              Full text
              <span className="ml-1 inline-flex items-center rounded bg-purple-100 dark:bg-purple-900/40 px-1 py-px text-[10px] font-semibold text-purple-700 dark:text-purple-300">
                Pro
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2 rounded-xl')}>
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortOptions.find((o) => o.value === sortOption)?.label ?? 'Sort'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {sortOptions.map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={() => handleSortChange(opt.value)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2 rounded-xl')}>
              <FolderOpen className="h-3.5 w-3.5" />
              {courseFilter === 'all' ? 'All Courses' : courses.find((c) => c.id === courseFilter)?.code ?? 'Course'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCourseFilter('all')}>All Courses</DropdownMenuItem>
              {courses.map((course) => (
                <DropdownMenuItem key={course.id} onClick={() => setCourseFilter(course.id)}>
                  {course.code ? `${course.code} — ` : ''}{course.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={selectMode ? 'default' : 'outline'}
            size="sm"
            className="gap-2 rounded-xl"
            onClick={toggleSelectMode}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {selectMode ? 'Done' : 'Select'}
          </Button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value as FilterType)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150',
              activeFilter === opt.value
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Upload feedback */}
      <AnimatePresence>
        {uploadingDocId && <UploadProgress documentId={uploadingDocId} />}
        {uploadError && <UploadError message={uploadError} onDismiss={() => setUploadError(null)} />}
        {uploadingFiles.length > 0 && (
          <UploadBatchProgress
            files={uploadingFiles}
            onDismiss={() => setUploadingFiles([])}
            onRetry={handleRetryUpload}
          />
        )}
      </AnimatePresence>

      {/* Error state */}
      {docsError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{docsError}</p>
        </div>
      )}

      {/* Document grid */}
      <LayoutGroup>
        <div aria-busy={isLoading} className="flex-1">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="status"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                <span className="sr-only">Loading documents...</span>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </motion.div>
            ) : filteredDocuments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="rounded-full bg-stone-100 dark:bg-stone-800 p-6 mb-4">
                  <FileText className="h-10 w-10 text-stone-400 dark:text-stone-500" />
                </div>
                <p className="text-base font-medium text-stone-700 dark:text-stone-300 mb-1">
                  {searchQuery.trim() ? 'No results found' : 'Upload your first document'}
                </p>
                <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">
                  {searchQuery.trim()
                    ? 'Try a different search or filter'
                    : 'PDFs, audio, video, and notes are supported'}
                </p>
                {!searchQuery.trim() && (
                  <Button className="gap-2 rounded-xl" onClick={handleUploadClick}>
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Button>
                )}
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectMode && (
                  <div className="col-span-full flex items-center gap-2 pb-1">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                    >
                      {selectedIds.size === filteredDocuments.length
                        ? <CheckSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        : <Square className="h-4 w-4" />}
                      Select all ({filteredDocuments.length})
                    </button>
                  </div>
                )}
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    courseName={getCourseName(doc.courseId, courses)}
                    courseColor={getCourseColor(doc.courseId, courses)}
                    onDelete={setDocumentToDelete}
                    onOpen={handleOpen}
                    onRename={setRenameDoc}
                    onMove={setMoveDoc}
                    onQuickAction={handleQuickAction}
                    isFavorite={favorites.has(doc.id)}
                    onToggleFavorite={toggleFavorite}
                    selectMode={selectMode}
                    isSelected={selectedIds.has(doc.id)}
                    onToggleSelect={toggleSelected}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {/* Dialogs */}
      <DeleteDialog
        open={documentToDelete !== null}
        onOpenChange={(open) => { if (!open) setDocumentToDelete(null) }}
        onConfirm={confirmDelete}
      />
      <RenameDialog
        document={renameDoc}
        onClose={() => setRenameDoc(null)}
        onSubmit={handleRenameSubmit}
        loading={renameLoading}
      />
      <MoveDialog
        document={moveDoc}
        courses={courses}
        onClose={() => { setMoveDoc(null); setBulkMoveIds(new Set()) }}
        onSubmit={handleMoveSubmit}
        loading={moveLoading}
        bulkCount={bulkMoveIds.size > 1 ? bulkMoveIds.size : undefined}
      />

      {/* Bulk action toolbar */}
      <AnimatePresence>
        {selectMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-4 py-3 shadow-lg"
          >
            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              {selectedIds.size} selected
            </span>
            <div className="h-4 w-px bg-stone-200 dark:bg-stone-700" />
            <Button variant="destructive" size="sm" className="gap-1.5 rounded-lg" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg"
              onClick={() => {
                if (selectedIds.size === 1) {
                  const doc = documents.find((d) => selectedIds.has(d.id))
                  if (doc) setMoveDoc(doc)
                } else {
                  setBulkMoveIds(new Set(selectedIds))
                  const firstDoc = documents.find((d) => selectedIds.has(d.id))
                  if (firstDoc) setMoveDoc(firstDoc)
                }
              }}
            >
              <FolderInput className="h-3.5 w-3.5" />
              Move
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
