'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, FileText, Clock, Trash2, X, Upload, Loader2 } from 'lucide-react'
import { useSessions } from '@/hooks/use-sessions'
import { useDocuments } from '@/hooks/use-documents'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredSessions = sessions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newName.trim() || selectedFiles.length === 0) return
    setCreating(true)
    try {
      setUploadProgress('Creating session...')
      const session = await createSession(newName.trim(), newDesc.trim() || undefined)

      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Uploading file ${i + 1}/${selectedFiles.length}...`)
        await uploadDocument(selectedFiles[i], { sessionId: session.id })
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
    const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf')
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
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                Total sessions ({filteredSessions.length})
              </p>
            </div>
            <Button onClick={() => setShowModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create new session
            </Button>
          </div>

          {/* Search bar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by session name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-sm font-medium text-gray-500">
                  <th className="px-4 py-3">Session name</th>
                  <th className="px-4 py-3">Files</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created at</th>
                  <th className="px-4 py-3">Last updated</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="h-5 w-full animate-pulse rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      {search ? 'No sessions match your search' : 'No sessions yet. Create one to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b cursor-pointer transition hover:bg-indigo-50/50"
                      onClick={() => router.push(`/sessions/${session.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{session.name}</p>
                          {session.description && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{session.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <FileText className="h-3 w-3" />
                          {session.document_count ?? 0} files
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={session.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                          {session.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(session.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(session.updated_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSession(session.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => !creating && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Create new session</h2>
                <button onClick={() => !creating && setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Session name *</label>
                  <Input
                    placeholder="e.g. Machine Learning Midterm"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1"
                    autoFocus
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Input
                    placeholder="Optional description"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="mt-1"
                    disabled={creating}
                  />
                </div>

                {/* File Upload Zone */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Upload files *</label>
                  <div
                    onDrop={handleFileDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => !creating && fileInputRef.current?.click()}
                    className="mt-1 cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50"
                  >
                    <Upload className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                    <p className="text-sm font-medium text-gray-600">Drag & drop files or Browse</p>
                    <p className="mt-1 text-xs text-gray-400">Supported: PDF (max 50MB)</p>
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
                  <div className="space-y-2 max-h-32 overflow-auto">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                          <span className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                        </div>
                        {!creating && (
                          <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress */}
                {uploadProgress && (
                  <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploadProgress}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !newName.trim() || selectedFiles.length === 0}
                    className="flex-1"
                  >
                    {creating ? 'Processing...' : `Create & Upload (${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})`}
                  </Button>
                  <Button variant="outline" onClick={() => setShowModal(false)} disabled={creating}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProtectedRoute>
  )
}
