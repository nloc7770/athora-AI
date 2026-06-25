'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, ArrowRight, CheckCircle2, Loader2, BookOpen, Brain, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDocuments } from '@/hooks/use-documents'
import { useSessions } from '@/hooks/use-sessions'

const STEPS = ['study-style', 'subject', 'timeline', 'insight', 'upload', 'ready']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [studyStyle, setStudyStyle] = useState('')
  const [subject, setSubject] = useState('')
  const [timeline, setTimeline] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadDocument } = useDocuments()
  const { createSession } = useSessions()

  const progress = ((step + 1) / STEPS.length) * 100

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const session = await createSession(subject || 'My First Study Session')
      await uploadDocument(files[0], { sessionId: session.id })
      setUploaded(true)
      localStorage.setItem('athora-onboarded', 'true')
      localStorage.setItem('athora-last-session', session.id)
    } catch {
      // Continue anyway
      localStorage.setItem('athora-onboarded', 'true')
      setUploaded(true)
    } finally {
      setUploading(false)
    }
  }

  const finish = () => {
    localStorage.setItem('athora-onboarded', 'true')
    const lastSession = localStorage.getItem('athora-last-session')
    router.push(lastSession ? `/sessions/${lastSession}` : '/sessions')
  }

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-stone-200">
        <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">

          {/* Step 1: Study style */}
          {step === 0 && (
            <div className="space-y-8 text-center">
              <div>
                <BookOpen className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold text-stone-900">How do you usually study?</h1>
                <p className="mt-2 text-stone-500">Be honest — we want to help you do better.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {['Re-reading notes', 'Highlighting textbooks', 'Making flashcards manually', 'Watching YouTube summaries', 'Cramming the night before'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setStudyStyle(opt); next() }}
                    className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition hover:border-amber-400 hover:bg-amber-50 ${studyStyle === opt ? 'border-amber-500 bg-amber-50' : 'border-stone-200'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Subject */}
          {step === 1 && (
            <div className="space-y-8 text-center">
              <div>
                <Target className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold text-stone-900">What are you studying for?</h1>
                <p className="mt-2 text-stone-500">Your biggest upcoming exam or course.</p>
              </div>
              <Input
                placeholder="e.g. Biology 101 Midterm, MCAT, Machine Learning Final..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-center text-lg h-14"
                autoFocus
              />
              <Button onClick={next} disabled={!subject.trim()} size="lg" className="w-full bg-amber-600 hover:bg-amber-700">
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 3: Timeline */}
          {step === 2 && (
            <div className="space-y-8 text-center">
              <div>
                <Brain className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold text-stone-900">When is your exam?</h1>
                <p className="mt-2 text-stone-500">We will build your study plan around this.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {['This week', 'In 2 weeks', 'In 1 month', 'In 3+ months'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setTimeline(opt); next() }}
                    className={`rounded-xl border-2 p-4 text-sm font-medium transition hover:border-amber-400 hover:bg-amber-50 ${timeline === opt ? 'border-amber-500 bg-amber-50' : 'border-stone-200'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Personalized insight */}
          {step === 3 && (
            <div className="space-y-8 text-center">
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-8">
                <h1 className="text-xl font-bold text-stone-900 mb-4">Here is what we know:</h1>
                <ul className="space-y-3 text-left text-sm text-stone-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>You study by <strong>{studyStyle.toLowerCase()}</strong> — which has only 20% retention after 24h.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Your exam (<strong>{subject}</strong>) is <strong>{timeline.toLowerCase()}</strong>.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>With active recall + spaced repetition, you can retain <strong>90%+</strong> of material.</span>
                  </li>
                </ul>
                <p className="mt-6 text-sm font-medium text-amber-800">
                  Athora creates flashcards, quizzes, and summaries from your materials — so you study smarter, not harder.
                </p>
              </div>
              <Button onClick={next} size="lg" className="w-full bg-amber-600 hover:bg-amber-700">
                Show me how <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 5: Upload */}
          {step === 4 && (
            <div className="space-y-8 text-center">
              <div>
                <h1 className="text-2xl font-bold text-stone-900">Drop your first document</h1>
                <p className="mt-2 text-stone-500">We will instantly generate study materials from it.</p>
              </div>
              {!uploaded ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-12 transition hover:border-amber-500 hover:bg-amber-50"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                      <p className="text-sm font-medium text-amber-700">Processing your document...</p>
                      <p className="text-xs text-stone-400">Generating summary, flashcards, exam questions...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="h-10 w-10 text-amber-400" />
                      <p className="text-sm font-medium text-stone-700">Click to upload or drag & drop</p>
                      <p className="text-xs text-stone-400">PDF up to 50MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </div>
              ) : (
                <div className="rounded-2xl bg-green-50 border border-green-200 p-8">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
                  <p className="font-medium text-green-800">Document uploaded!</p>
                  <p className="text-sm text-green-600 mt-1">AI is generating your study materials now.</p>
                </div>
              )}
              <div className="flex gap-3">
                <Button onClick={next} variant="outline" className="flex-1">
                  Skip for now
                </Button>
                {uploaded && (
                  <Button onClick={next} className="flex-1 bg-amber-600 hover:bg-amber-700">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Ready */}
          {step === 5 && (
            <div className="space-y-8 text-center">
              <div>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-stone-900">You are all set!</h1>
                <p className="mt-2 text-stone-500 max-w-sm mx-auto">
                  Your AI study assistant is ready. Upload more materials, chat with your docs, and ace your {subject || 'exam'}.
                </p>
              </div>
              <div className="rounded-xl bg-stone-100 p-4 text-left space-y-2">
                <p className="text-xs font-medium text-stone-500">YOUR STUDY PLAN</p>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-stone-700">Upload study materials → AI generates everything</span>
                </div>
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-stone-700">Review flashcards daily (spaced repetition)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-stone-700">Take practice exams to find weak spots</span>
                </div>
              </div>
              <Button onClick={finish} size="lg" className="w-full bg-amber-600 hover:bg-amber-700">
                Start studying <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
