'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  FileText,
  Trash2,
  X,
  Upload,
  Loader2,
  BookOpen,
  Calendar,
} from 'lucide-react'
import { useSessions } from '@/hooks/use-sessions'
import { useDocuments } from '@/hooks/use-documents'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export default function SessionsPage() {
  const router = useRouter()
  const { sessions, isLoading, createSession, deleteSession } = useSessions()
  const { uploadDocument } = useDocuments()
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [creating, setCreating] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [search, setSearch] = useState('')
  const [sessionToDelete, setSessionToDelete] = useState<{
    id: string
    name: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      setUploadProgress('Creating study space...')
      const session = await createSession(newName.trim(), newDesc.trim() || undefined)

      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          setUploadProgress(`Uploading file ${i + 1}/${selectedFiles.length}...`)
          await uploadDocument(selectedFiles[i], { sessionId: session.id })
        }
      }

      setShowModal(false)
      setNewName('')
      setNewDesc('')
      setSelectedFiles([])
      setUploadProgress('')
      router.push(`/sessions/${session.id}`)
    } finally {
      setCreating(false)
      setUploadProgress('')
    }
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    )
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setSelectedFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                Study Spaces
              </h1>
              <Button
                onClick={() => setShowModal(true)}
                className="gap-2 rounded-xl bg-[#6C47FF] hover:bg-[#5a38e0] text-white"
              >
                <Plus className="h-4 w-4" />
                New Study Space
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
              <Input
                placeholder="Search study spaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border-stone-200 bg-white pl-11 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500"
                aria-label="Search study spaces"
              />
            </div>

            {/* Session Cards */}
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-5 w-48 animate-pulse rounded-md bg-stone-100 dark:bg-stone-800" />
                        <div className="h-4 w-32 animate-pulse rounded-md bg-stone-100 dark:bg-stone-800" />
                      </div>
                      <div className="h-6 w-16 animate-pulse rounded-md bg-stone-100 dark:bg-stone-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center dark:border-stone-700 dark:bg-stone-900">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800">
                  <BookOpen className="h-6 w-6 text-stone-400 dark:text-stone-500" />
                </div>
                <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {search ? 'No study spaces match your search' : 'No study spaces yet'}
                </p>
                <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">
                  {search
                    ? 'Try a different keyword'
                    : 'A study space groups your documents, flashcards, and quizzes for one topic.'}
                </p>
                {!search && (
                  <Button
                    onClick={() => setShowModal(true)}
                    className="mt-5 gap-2 rounded-xl bg-[#6C47FF] hover:bg-[#5a38e0] text-white"
                  >
                    <Plus className="h-4 w-4" />
                    New Study Space
                  </Button>
                )}
              </div>
            ) : (
              <motion.div
                className="space-y-3"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.04 } },
                }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="group cursor-pointer rounded-xl border border-stone-200 bg-white p-5 transition-all duration-150 hover:border-purple-200 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-purple-900"
                      onClick={() => router.push(`/sessions/${session.id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                            {session.name}
                          </p>
                          {session.description && (
                            <p className="mt-0.5 truncate text-xs text-stone-400 dark:text-stone-500">
                              {session.description}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <Badge
                              variant="secondary"
                              className="gap-1 rounded-md bg-stone-100 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                            >
                              <FileText className="h-3 w-3" />
                              {session.document_count ?? 0}{' '}
                              {(session.document_count ?? 0) === 1
                                ? 'document'
                                : 'documents'}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
                              <Calendar className="h-3 w-3" />
                              {formatRelativeDate(session.updated_at)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete study space ${session.name}`}
                          className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSessionToDelete({
                              id: session.id,
                              name: session.name,
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </AppLayout>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => !creating && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-stone-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Create new study space
                </h2>
                <button
                  onClick={() => !creating && setShowModal(false)}
                  className="text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    Study space name *
                  </label>
                  <Input
                    placeholder="e.g. Machine Learning Midterm"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1.5 rounded-xl dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                    autoFocus
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    Description
                  </label>
                  <Input
                    placeholder="Optional description"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="mt-1.5 rounded-xl dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                    disabled={creating}
                  />
                </div>

                {/* File Upload Zone */}
                <div>
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    Upload files (optional)
                  </label>
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !creating && fileInputRef.current?.click()}
                    className="mt-1.5 cursor-pointer rounded-xl border-2 border-dashed border-stone-300 p-8 text-center transition-colors duration-150 hover:border-[#6C47FF] hover:bg-purple-50/50 dark:border-stone-700 dark:hover:border-purple-700 dark:hover:bg-purple-950/20"
                  >
                    <Upload className="mx-auto mb-2 h-6 w-6 text-stone-400 dark:text-stone-500" />
                    <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      Drag & drop files or{' '}
                      <span className="text-[#6C47FF]">browse</span>
                    </p>
                    <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                      PDF files up to 50MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={creating}
                    />
                  </div>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="max-h-32 space-y-2 overflow-auto">
                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 dark:bg-stone-800"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 shrink-0 text-red-500" />
                          <span className="truncate text-sm text-stone-700 dark:text-stone-300">
                            {file.name}
                          </span>
                          <span className="shrink-0 text-xs text-stone-400">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                        {!creating && (
                          <button
                            onClick={() => removeFile(i)}
                            className="shrink-0 text-stone-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress */}
                {uploadProgress && (
                  <div className="flex items-center gap-2 text-sm text-[#6C47FF]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadProgress}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                    className="flex-1 rounded-xl bg-[#6C47FF] hover:bg-[#5a38e0] text-white"
                  >
                    {creating
                      ? 'Processing...'
                      : selectedFiles.length > 0
                        ? `Create & Upload (${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})`
                        : 'Create Study Space'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    disabled={creating}
                    className="rounded-xl dark:border-stone-700 dark:text-stone-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!sessionToDelete}
        onOpenChange={(open) => {
          if (!open) setSessionToDelete(null)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete study space</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-medium text-foreground">
                &quot;{sessionToDelete?.name}&quot;
              </span>
              ? All associated documents, quizzes, and flashcards will be
              permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (sessionToDelete) {
                  deleteSession(sessionToDelete.id)
                  setSessionToDelete(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  )
}
