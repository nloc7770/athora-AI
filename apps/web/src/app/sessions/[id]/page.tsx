'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  MessageSquare,
  Brain,
  ClipboardList,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Send,
  Sparkles,
} from 'lucide-react'
import { useSession } from '@/hooks/use-sessions'
import { useDocuments, useDocumentStatus } from '@/hooks/use-documents'
import { useChatSessions, useChatMessages } from '@/hooks/use-chat'
import { useAiGeneration } from '@/hooks/use-ai-generation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'

type TabValue = 'documents' | 'chat' | 'flashcards' | 'exam' | 'summary'

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

export default function SessionWorkspace() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const { session, documents, isLoading, refresh } = useSession(sessionId)
  const { uploadDocument } = useDocuments({ sessionId })
  const [activeTab, setActiveTab] = useState<TabValue>('documents')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chat state
  const { sessions: chatSessions, createSession: createChatSession } = useChatSessions(sessionId)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const { messages, sendMessage, isLoading: chatLoading } = useChatMessages(chatSessionId)
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // AI generation
  const { generations, generate, isLoading: genLoading } = useAiGeneration(sessionId)

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
    setUploading(true)
    for (const file of Array.from(files)) {
      await uploadDocument(file, { sessionId })
    }
    setUploading(false)
    refresh()
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleUpload(e.dataTransfer.files)
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    if (!chatSessionId) {
      const newSession = await createChatSession({ documentId: undefined, type: 'document_chat' })
      setChatSessionId(newSession.id)
    }
    const msg = chatInput
    setChatInput('')
    await sendMessage(msg)
  }

  const handleGenerate = async (type: 'summary' | 'flashcards' | 'exam' | 'mindmap') => {
    await generate(type)
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    )
  }

  const readyDocs = documents.filter((d) => d.status === 'ready')
  const hasReadyDocs = readyDocs.length > 0

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white px-6 py-4">
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
        <div className="border-b bg-white px-6">
          <div className="flex gap-1">
            {([
              { key: 'documents', icon: FileText, label: 'Documents' },
              { key: 'chat', icon: MessageSquare, label: 'Chat' },
              { key: 'flashcards', icon: Brain, label: 'Flashcards' },
              { key: 'exam', icon: ClipboardList, label: 'Exam' },
              { key: 'summary', icon: BookOpen, label: 'Summary' },
            ] as const).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                  activeTab === key
                    ? 'border-indigo-600 text-indigo-600'
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
            <div className="mx-auto max-w-3xl space-y-4">
              {/* Upload zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50"
              >
                <Upload className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">
                  {uploading ? 'Uploading...' : 'Drop PDF files here or click to upload'}
                </p>
                <p className="mt-1 text-xs text-gray-400">PDF files up to 50MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
              </div>

              {/* Document list */}
              {documents.length === 0 ? (
                <p className="text-center text-sm text-gray-400 pt-4">No documents yet. Upload PDFs to get started.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-indigo-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                            <p className="text-xs text-gray-400">
                              {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                            </p>
                          </div>
                        </div>
                        <DocumentStatusBadge docId={doc.id} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="mx-auto flex h-full max-w-3xl flex-col">
              {!hasReadyDocs ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                    <p className="text-gray-500">Upload and process documents first to start chatting</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-4 overflow-auto pb-4">
                    {messages.length === 0 && (
                      <div className="text-center pt-12">
                        <Sparkles className="mx-auto mb-3 h-8 w-8 text-indigo-400" />
                        <p className="text-sm text-gray-500">Ask anything about your documents</p>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${
                          msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-800'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-xl bg-white border px-4 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
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
                </>
              )}
            </div>
          )}

          {activeTab === 'flashcards' && (
            <div className="mx-auto max-w-3xl text-center">
              {!hasReadyDocs ? (
                <div className="pt-16">
                  <Brain className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-gray-500">Upload documents first to generate flashcards</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => handleGenerate('flashcards')} disabled={genLoading} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    {genLoading ? 'Generating...' : 'Generate Flashcards'}
                  </Button>
                  {generations.filter((g) => g.type === 'flashcards').map((gen) => (
                    <Card key={gen.id}>
                      <CardContent className="p-4 text-left">
                        <Badge className="mb-2">{gen.status}</Badge>
                        {gen.status === 'completed' && gen.result?.cards && (
                          <div className="space-y-2 mt-2">
                            {gen.result.cards.slice(0, 5).map((card: any, i: number) => (
                              <div key={i} className="rounded-lg border p-3">
                                <p className="text-sm font-medium">{card.front}</p>
                                <p className="mt-1 text-sm text-gray-500">{card.back}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'exam' && (
            <div className="mx-auto max-w-3xl text-center">
              {!hasReadyDocs ? (
                <div className="pt-16">
                  <ClipboardList className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-gray-500">Upload documents first to generate exams</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => handleGenerate('exam')} disabled={genLoading} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    {genLoading ? 'Generating...' : 'Generate Exam'}
                  </Button>
                  {generations.filter((g) => g.type === 'exam').map((gen) => (
                    <Card key={gen.id}>
                      <CardContent className="p-4 text-left">
                        <Badge className="mb-2">{gen.status}</Badge>
                        {gen.status === 'completed' && gen.result?.questions && (
                          <div className="space-y-3 mt-2">
                            {gen.result.questions.map((q: any, i: number) => (
                              <div key={i} className="rounded-lg border p-3">
                                <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                                {q.options && (
                                  <ul className="mt-1 space-y-1 pl-4">
                                    {q.options.map((opt: string, j: number) => (
                                      <li key={j} className="text-sm text-gray-600">{opt}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="mx-auto max-w-3xl text-center">
              {!hasReadyDocs ? (
                <div className="pt-16">
                  <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-gray-500">Upload documents first to generate summary</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => handleGenerate('summary')} disabled={genLoading} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    {genLoading ? 'Generating...' : 'Generate Summary'}
                  </Button>
                  {generations.filter((g) => g.type === 'summary').map((gen) => (
                    <Card key={gen.id}>
                      <CardContent className="p-4 text-left">
                        <Badge className="mb-2">{gen.status}</Badge>
                        {gen.status === 'completed' && gen.result && (
                          <div className="mt-2 space-y-2">
                            {gen.result.overview && <p className="text-sm text-gray-700">{gen.result.overview}</p>}
                            {gen.result.chapters?.map((ch: any, i: number) => (
                              <div key={i}>
                                <p className="text-sm font-medium">{ch.title}</p>
                                <ul className="pl-4">
                                  {ch.keyPoints?.map((kp: string, j: number) => (
                                    <li key={j} className="text-sm text-gray-600">• {kp}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
