'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Upload,
  FileText,
  MessageSquare,
  Brain,
  ClipboardList,
  BookOpen,
  Loader2,
  ArrowLeft,
  Send,
  Sparkles,
  Headphones,
  Network,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import { useToastStore } from '@/stores/toast-store'
import { useSession } from '@/hooks/use-sessions'
import { useDocuments, useDocumentStatus } from '@/hooks/use-documents'
import { useChatSessions, useChatMessages } from '@/hooks/use-chat'
import { useSessionGeneration } from '@/hooks/use-ai-generation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { markFirstStudyDone } from '@/hooks/use-first-study'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Markdown } from '@/components/ui/markdown'
import { SummaryTab, FlashcardsTab, ExamTab, MindMapTab } from './_components'
import { DocumentInsight } from './_components/document-insight'

type TabValue = 'documents' | 'chat' | 'flashcards' | 'exam' | 'summary' | 'mindmap'

interface FileUploadStatus {
  fileName: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

function DocumentStatusBadge({ docId }: { docId: string }) {
  const { status, progress } = useDocumentStatus(docId)
  if (status === 'ready') return <Badge className="bg-green-100 text-green-700">Ready</Badge>
  if (status === 'failed') return <Badge className="bg-red-100 text-red-700">Failed</Badge>
  return (
    <Badge className="bg-yellow-100 text-yellow-700 gap-1">
      <Loader2 className="h-3 w-3 animate-spin" />
      {progress}%
    </Badge>
  )
}



function getUploadErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    if (msg.includes('too large') || msg.includes('size')) return 'File too large (max 50MB)'
    if (msg.includes('network') || msg.includes('fetch')) return 'Network error — check your connection'
    if (msg.includes('401') || msg.includes('auth') || msg.includes('unauthorized') || msg.includes('expired'))
      return 'Authentication expired — please sign in again'
    return err.message
  }
  return 'Upload failed'
}

export default function SessionWorkspace() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const { session, documents, isLoading, error, refresh } = useSession(sessionId)
  const { uploadDocument } = useDocuments({ sessionId })
  const [activeTab, setActiveTab] = useState<TabValue>('documents')

  // Refresh session data when switching tabs
  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab)
    refresh()
  }
  const [uploading, setUploading] = useState(false)
  const [uploadStatuses, setUploadStatuses] = useState<FileUploadStatus[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chat state
  const { sessions: chatSessions, createSession: createChatSession } = useChatSessions({ sessionId })
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const { messages, sendMessage, isLoading: chatLoading } = useChatMessages(chatSessionId)
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Session-level AI generation
  const {
    generations: sessionGenerations,
    generate: generateSession,
    isLoading: sessionGenLoading,
  } = useSessionGeneration(sessionId)

  useEffect(() => {
    if (chatSessions.length > 0 && !chatSessionId) {
      setChatSessionId(chatSessions[0].id)
    }
  }, [chatSessions, chatSessionId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleUpload = async (files: FileList | null) => {
    if (!files) return
    const fileArray = Array.from(files)
    const statuses: FileUploadStatus[] = fileArray.map((file) => ({
      fileName: file.name,
      file,
      status: 'pending' as const,
    }))
    setUploadStatuses(statuses)
    setUploading(true)

    let hasError = false
    for (let i = 0; i < fileArray.length; i++) {
      setUploadStatuses((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'uploading' } : s))
      )
      try {
        await uploadDocument(fileArray[i], { sessionId })
        setUploadStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'success' } : s))
        )
      } catch (err: unknown) {
        hasError = true
        const message = getUploadErrorMessage(err)
        setUploadStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'error', error: message } : s))
        )
      }
    }

    setUploading(false)
    if (!hasError) {
      refresh()
      setUploadStatuses([])
    } else {
      useToastStore.getState().addToast('Some files failed to upload', 'error')
    }
  }

  const handleRetryFailed = async () => {
    const failedStatuses = uploadStatuses.filter((s) => s.status === 'error')
    if (failedStatuses.length === 0) return

    setUploading(true)
    setUploadStatuses((prev) =>
      prev.map((s) => (s.status === 'error' ? { ...s, status: 'pending', error: undefined } : s))
    )

    let hasError = false
    for (const failed of failedStatuses) {
      const idx = uploadStatuses.findIndex((s) => s.fileName === failed.fileName && s.status === 'error')
      setUploadStatuses((prev) =>
        prev.map((s) =>
          s.fileName === failed.fileName && (s.status === 'pending' || s.status === 'error')
            ? { ...s, status: 'uploading' }
            : s
        )
      )
      try {
        await uploadDocument(failed.file, { sessionId })
        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.fileName === failed.fileName && s.status === 'uploading'
              ? { ...s, status: 'success' }
              : s
          )
        )
      } catch (err: unknown) {
        hasError = true
        const message = getUploadErrorMessage(err)
        setUploadStatuses((prev) =>
          prev.map((s) =>
            s.fileName === failed.fileName && s.status === 'uploading'
              ? { ...s, status: 'error', error: message }
              : s
          )
        )
      }
    }

    setUploading(false)
    const remaining = uploadStatuses.filter((s) => s.status === 'error')
    if (!hasError) {
      refresh()
      setUploadStatuses([])
    } else {
      useToastStore.getState().addToast('Some files still failed to upload', 'error')
    }
  }

  const handleUploadRef = useRef(handleUpload)
  handleUploadRef.current = handleUpload

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleUploadRef.current(e.dataTransfer.files)
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    const msg = chatInput
    setChatInput('')

    let activeSessionId = chatSessionId
    if (!activeSessionId) {
      try {
        const newSession = await createChatSession({ sessionId, type: 'document_chat' })
        setChatSessionId(newSession.id)
        activeSessionId = newSession.id
      } catch {
        setChatInput(msg)
        useToastStore.getState().addToast('Failed to create chat session.', 'error')
        return
      }
    }

    try {
      await sendMessage(msg, undefined, activeSessionId)
    } catch {
      setChatInput(msg)
      useToastStore.getState().addToast('Message failed to send. Please try again.', 'error')
    }
  }

  const handleSessionGenerate = async (type: 'summary' | 'flashcards' | 'exam' | 'mindmap') => {
    try {
      await generateSession(type)
      markFirstStudyDone()
      useToastStore.getState().addToast(`Generating ${type}...`, 'info')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      useToastStore.getState().addToast(message, 'error')
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <p className="text-lg font-medium text-gray-900">
              {error || 'Failed to load study space'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => refresh()}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/sessions')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to study spaces
              </button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  const readyDocs = documents.filter((d) => d.status === 'ready')
  const hasReadyDocs = readyDocs.length > 0
  const hasAnyDocs = documents.length > 0
  const hasProcessingDocs = hasAnyDocs && !hasReadyDocs

  const tabs = [
    { key: 'documents' as const, icon: FileText, label: 'Documents' },
    { key: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { key: 'flashcards' as const, icon: Brain, label: 'Flashcards' },
    { key: 'exam' as const, icon: ClipboardList, label: 'Exam' },
    { key: 'summary' as const, icon: BookOpen, label: 'Summary' },
    { key: 'mindmap' as const, icon: Network, label: 'Mind Map' },
  ]

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="flex h-full flex-col">
          {/* Header */}
          <header className="border-b bg-white px-6 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/sessions')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{session?.name}</h1>
                {session?.description && <p className="text-sm text-gray-500">{session.description}</p>}
              </div>
              <Badge variant="secondary" className="ml-auto">{documents.length} documents</Badge>
            </div>
          </header>

          {/* Tabs */}
          <div className="border-b bg-white px-6 overflow-x-auto">
            <div className="flex gap-1" role="tablist">
              {tabs.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={activeTab === key}
                  onClick={() => handleTabChange(key)}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition ${
                    activeTab === key
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'documents' && (
              <DocumentsTab
                documents={documents}
                selectedDocId={selectedDocId}
                setSelectedDocId={setSelectedDocId}
                uploading={uploading}
                uploadStatuses={uploadStatuses}
                onRetryFailed={handleRetryFailed}
                fileInputRef={fileInputRef}
                handleDrop={handleDrop}
                handleUpload={handleUpload}
              />
            )}

            {activeTab === 'chat' && (
              <ChatTab
                hasReadyDocs={hasReadyDocs}
                messages={messages}
                chatLoading={chatLoading}
                chatInput={chatInput}
                setChatInput={setChatInput}
                handleSendMessage={handleSendMessage}
                chatEndRef={chatEndRef}
              />
            )}

            {activeTab === 'flashcards' && (
              <FlashcardsTab
                hasReadyDocs={hasReadyDocs}
                hasProcessingDocs={hasProcessingDocs}
                generations={sessionGenerations}
                isLoading={sessionGenLoading}
                onGenerate={() => handleSessionGenerate('flashcards')}
              />
            )}

            {activeTab === 'exam' && (
              <ExamTab
                hasReadyDocs={hasReadyDocs}
                hasProcessingDocs={hasProcessingDocs}
                generations={sessionGenerations}
                isLoading={sessionGenLoading}
                onGenerate={() => handleSessionGenerate('exam')}
              />
            )}

            {activeTab === 'summary' && (
              <SummaryTab
                hasReadyDocs={hasReadyDocs}
                hasProcessingDocs={hasProcessingDocs}
                generations={sessionGenerations}
                isLoading={sessionGenLoading}
                onGenerate={() => handleSessionGenerate('summary')}
              />
            )}

            {activeTab === 'mindmap' && (
              <MindMapTab
                hasReadyDocs={hasReadyDocs}
                hasProcessingDocs={hasProcessingDocs}
                generations={sessionGenerations}
                isLoading={sessionGenLoading}
                onGenerate={() => handleSessionGenerate('mindmap')}
              />
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

/* ─── Documents Tab ─── */

interface DocumentsTabProps {
  documents: any[]
  selectedDocId: string | null
  setSelectedDocId: (id: string | null) => void
  uploading: boolean
  uploadStatuses: FileUploadStatus[]
  onRetryFailed: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleDrop: (e: React.DragEvent) => void
  handleUpload: (files: FileList | null) => void
}

function DocumentsTab({
  documents,
  selectedDocId,
  setSelectedDocId,
  uploading,
  uploadStatuses,
  onRetryFailed,
  fileInputRef,
  handleDrop,
  handleUpload,
}: DocumentsTabProps) {
  const hasFailedUploads = uploadStatuses.some((s) => s.status === 'error')

  return (
    <div className="flex h-full gap-4">
      {/* Left: Upload + File List */}
      <div className={`space-y-4 overflow-auto ${selectedDocId ? 'w-80 shrink-0' : 'mx-auto max-w-3xl w-full'}`}>
        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition hover:border-purple-400 hover:bg-purple-50/50"
        >
          <Upload className="mx-auto mb-2 h-6 w-6 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            {uploading ? 'Uploading...' : 'Drop files or click to upload'}
          </p>
          <p className="mt-1 text-xs text-gray-400">PDF up to 50MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        {/* Upload status list */}
        {uploadStatuses.length > 0 && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-600">Upload Progress</p>
              {hasFailedUploads && !uploading && (
                <Button size="sm" variant="outline" onClick={onRetryFailed} className="gap-1 h-7 text-xs">
                  <RotateCcw className="h-3 w-3" />
                  Retry failed
                </Button>
              )}
            </div>
            {uploadStatuses.map((s, idx) => (
              <div key={`${s.fileName}-${idx}`} className="flex items-center gap-2 text-sm">
                {s.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                {s.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                {s.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-purple-500 shrink-0" />}
                {s.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />}
                <span className="truncate flex-1 text-gray-700">{s.fileName}</span>
                {s.error && <span className="text-xs text-red-500 shrink-0">{s.error}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Document list */}
        {documents.length === 0 ? (
          <p className="text-center text-sm text-gray-400 pt-4">No documents yet.</p>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id === selectedDocId ? null : doc.id)}
                className={`flex items-center gap-3 rounded-lg p-3 cursor-pointer transition ${
                  selectedDocId === doc.id
                    ? 'bg-purple-50 border border-purple-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {doc.type === 'audio' ? (
                  <Headphones className="h-4 w-4 text-violet-500 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-purple-500 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400">
                    {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                  </p>
                </div>
                <DocumentStatusBadge docId={doc.id} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Document Insight */}
      {selectedDocId && (
        <div className="flex-1 overflow-auto rounded-lg border bg-white">
          <DocumentInsight
            documentId={selectedDocId}
            document={documents.find((d) => d.id === selectedDocId) ?? null}
          />
        </div>
      )}
    </div>
  )
}

/* ─── Chat Tab ─── */

interface ChatTabProps {
  hasReadyDocs: boolean
  messages: any[]
  chatLoading: boolean
  chatInput: string
  setChatInput: (v: string) => void
  handleSendMessage: () => void
  chatEndRef: React.RefObject<HTMLDivElement | null>
}

function ChatTab({
  hasReadyDocs,
  messages,
  chatLoading,
  chatInput,
  setChatInput,
  handleSendMessage,
  chatEndRef,
}: ChatTabProps) {
  if (!hasReadyDocs) {
    return (
      <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center">
        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-gray-500">Upload and process documents first to start chatting</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col">
      <div className="flex-1 space-y-4 overflow-auto pb-4">
        {messages.length === 0 && (
          <div className="text-center pt-12">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-purple-400" />
            <p className="text-sm text-gray-500">Ask anything about your documents</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          msg.content ? (
            <div key={msg.id || `msg-${idx}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white border text-gray-800'
              }`}>
                {msg.role === 'assistant' ? (
                  <Markdown content={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ) : null
        ))}
        {chatLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-white border px-4 py-3 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-[bounce_1.4s_ease-in-out_infinite]" />
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <Input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
          placeholder="Ask about your documents..."
          disabled={chatLoading}
        />
        <Button onClick={handleSendMessage} disabled={chatLoading || !chatInput.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

