'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Loader2,
  AlertCircle,
  RotateCcw,
  FolderOpen,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DocumentItem, UploadingFile, CourseItem } from './types'
import { useDocumentStatus } from '@/hooks/use-documents'

/* Upload progress tracker for single documents */
export function UploadProgress({ documentId }: { documentId: string | null }) {
  const { status, progress, isReady } = useDocumentStatus(documentId)

  if (!documentId || isReady) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            {status === 'processing' ? 'Processing document...' : 'Uploading...'}
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
      </div>
    </motion.div>
  )
}

/* Multi-file upload batch progress */
export function UploadBatchProgress({
  files,
  onDismiss,
  onRetry,
}: {
  files: UploadingFile[]
  onDismiss: () => void
  onRetry: (uf: UploadingFile) => void
}) {
  if (files.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
          Uploading {files.filter((f) => f.status === 'done').length}/{files.length}
        </p>
        {files.every((f) => f.status !== 'uploading') && (
          <button
            onClick={onDismiss}
            className="text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
      {files.map((uf, idx) => (
        <div key={idx} className="flex items-center gap-2 py-0.5 text-sm">
          {uf.status === 'uploading' && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />}
          {uf.status === 'done' && <span className="h-3.5 w-3.5 text-center text-emerald-500">&#10003;</span>}
          {uf.status === 'error' && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
          <span className="flex-1 truncate text-stone-700 dark:text-stone-300">{uf.file.name}</span>
          {uf.status === 'error' && (
            <button
              onClick={() => onRetry(uf)}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      ))}
    </motion.div>
  )
}

/* Upload error banner */
export function UploadError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3"
    >
      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <p className="flex-1 text-sm text-red-700 dark:text-red-300">{message}</p>
      <button
        onClick={onDismiss}
        className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
      >
        Dismiss
      </button>
    </motion.div>
  )
}

/* Drag and drop overlay */
export function DragOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-purple-400 dark:border-purple-500 bg-purple-50/80 dark:bg-purple-950/50 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-purple-100 dark:bg-purple-900/50 p-4">
          <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Drop files to upload</p>
      </div>
    </motion.div>
  )
}

/* Delete confirmation dialog */
export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete document?</DialogTitle>
          <DialogDescription>
            This document will be permanently deleted. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* Rename dialog */
export function RenameDialog({
  document,
  onClose,
  onSubmit,
  loading,
}: {
  document: DocumentItem | null
  onClose: () => void
  onSubmit: (name: string) => void
  loading: boolean
}) {
  const [name, setName] = useState(document?.name ?? '')

  // Reset name when document changes
  if (document && name === '' && document.name !== '') {
    setName(document.name)
  }

  return (
    <Dialog open={document !== null} onOpenChange={(open) => { if (!open) { onClose(); setName('') } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename document</DialogTitle>
          <DialogDescription>Enter a new name for this document.</DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSubmit(name.trim()) }}
          placeholder="Document name"
          disabled={loading}
          autoFocus
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={() => onSubmit(name.trim())} disabled={loading || !name.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* Move dialog */
export function MoveDialog({
  document,
  courses,
  onClose,
  onSubmit,
  loading,
  bulkCount,
}: {
  document: DocumentItem | null
  courses: CourseItem[]
  onClose: () => void
  onSubmit: (courseId: string | null) => void
  loading: boolean
  bulkCount?: number
}) {
  const title = bulkCount ? `Move ${bulkCount} documents` : 'Move document'
  const description = bulkCount
    ? `Select a course to move ${bulkCount} documents to.`
    : `Select a course to move “${document?.name}” to.`

  return (
    <Dialog open={document !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1 max-h-60 overflow-auto">
          <button
            onClick={() => onSubmit(null)}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            <FolderOpen className="h-4 w-4 text-stone-400" />
            Uncategorized
          </button>
          {courses.map((course) => (
            <button
              key={course.id}
              onClick={() => onSubmit(course.id)}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              <FolderOpen className="h-4 w-4 text-stone-400" />
              {course.code ? `${course.code} — ` : ''}{course.name}
            </button>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
