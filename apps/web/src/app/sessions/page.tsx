'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Trash2, X, Upload, Loader2, BookOpen } from 'lucide-react'

import { useSessions } from '@/hooks/use-sessions'
import { useDocuments } from '@/hooks/use-documents'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { BrainShell } from '@/components/brain/brain-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PageContainer,
  PageHeader,
  PageToolbar,
  SearchField,
  ListItem,
  ListSkeleton,
  EmptyState,
} from '@/components/page'

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

  const debouncedSearch = useDebouncedValue(search)

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(debouncedSearch.toLowerCase())
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

  const newSpaceButton = (
    <Button onClick={() => setShowModal(true)}>
      <Plus />
      New Study Space
    </Button>
  )

  return (
    <ProtectedRoute>
      <BrainShell>
        <PageContainer>
          <PageHeader
            title="Study Spaces"
            subtitle="A study space groups your documents, flashcards and quizzes for one topic."
            count={`${sessions.length} ${sessions.length === 1 ? 'space' : 'spaces'}`}
            icon={<BookOpen />}
            actions={newSpaceButton}
          />

          <PageToolbar
            search={
              <SearchField
                value={search}
                onValueChange={setSearch}
                placeholder="Search study spaces…"
                label="Search study spaces"
              />
            }
          />

          {isLoading ? (
            <ListSkeleton count={4} label="Loading study spaces" />
          ) : filteredSessions.length === 0 ? (
            debouncedSearch ? (
              <EmptyState
                illustration="search"
                title="No study spaces match your search"
                description="Try a different keyword."
                secondaryAction={
                  <Button size="lg" variant="outline" onClick={() => setSearch('')}>
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState
                illustration="sessions"
                title="No study spaces yet"
                description="A study space groups your documents, flashcards, and quizzes for one topic."
                action={newSpaceButton}
              />
            )
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSessions.map((session) => (
                <ListItem
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  icon={<BookOpen />}
                  title={session.name}
                  meta={
                    <>
                      {session.description ? (
                        <>
                          <span className="truncate">{session.description}</span>
                          <span aria-hidden>·</span>
                        </>
                      ) : null}
                      <span>
                        {session.document_count ?? 0}{' '}
                        {(session.document_count ?? 0) === 1 ? 'document' : 'documents'}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{formatRelativeDate(session.updated_at)}</span>
                    </>
                  }
                  action={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete study space ${session.name}`}
                      onClick={() =>
                        setSessionToDelete({ id: session.id, name: session.name })
                      }
                    >
                      <Trash2 />
                    </Button>
                  }
                />
              ))}
            </div>
          )}
        </PageContainer>
      </BrainShell>

      {/* Create study space — same Dialog primitive as the delete confirm, so this
          file has ONE modal strategy instead of a hand-rolled framer-motion one. */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open && !creating) setShowModal(false)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create new study space</DialogTitle>
            <DialogDescription>
              Name it after the topic or exam you are revising for.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="new-space-name"
                className="text-sm font-medium text-[var(--br-text2)]"
              >
                Study space name *
              </label>
              <Input
                id="new-space-name"
                placeholder="e.g. Machine Learning Midterm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1.5 rounded-xl"
                autoFocus
                disabled={creating}
              />
            </div>

            <div>
              <label
                htmlFor="new-space-description"
                className="text-sm font-medium text-[var(--br-text2)]"
              >
                Description
              </label>
              <Input
                id="new-space-description"
                placeholder="Optional description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="mt-1.5 rounded-xl"
                disabled={creating}
              />
            </div>

            <div>
              <span className="text-sm font-medium text-[var(--br-text2)]">
                Upload files (optional)
              </span>
              <div
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !creating && fileInputRef.current?.click()}
                className="mt-1.5 cursor-pointer rounded-xl border-2 border-dashed border-[var(--br-border)] p-8 text-center transition-colors hover:border-[var(--br-accent-line)] hover:bg-[var(--br-accent-wash)]"
              >
                <Upload className="mx-auto mb-2 h-6 w-6 text-[var(--br-text3)]" />
                <p className="text-sm font-medium text-[var(--br-text2)]">
                  Drag &amp; drop files or <span className="text-primary">browse</span>
                </p>
                <p className="mt-1 text-xs text-[var(--br-text3)]">PDF files up to 50MB</p>
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

            {selectedFiles.length > 0 && (
              <div className="max-h-32 space-y-2 overflow-auto">
                {selectedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-[var(--br-bg2)] px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate text-sm text-[var(--br-text2)]">
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--br-text3)]">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>
                    {!creating && (
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        aria-label={`Remove ${file.name}`}
                        className="shrink-0 text-[var(--br-text3)] hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {uploadProgress && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploadProgress}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button size="lg" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating
                ? 'Processing...'
                : selectedFiles.length > 0
                  ? `Create & Upload (${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})`
                  : 'Create Study Space'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
