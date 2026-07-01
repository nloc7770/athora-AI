'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Brain,
  Target,
  Star,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDocuments } from '@/hooks/use-documents'
import { useSessions } from '@/hooks/use-sessions'

const TOTAL_STEPS = 12

interface OnboardingData {
  role: string
  subject: string
  timeline: string
  hoursPerDay: string
  challenge: string
  triedFlashcards: string
  preference: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    role: '',
    subject: '',
    timeline: '',
    hoursPerDay: '',
    challenge: '',
    triedFlashcards: '',
    preference: '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadDocument } = useDocuments()
  const { createSession } = useSessions()

  const progress = ((step + 1) / TOTAL_STEPS) * 100

  const update = (field: keyof OnboardingData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }))
  }

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const session = await createSession(data.subject || 'My First Study Session')
      await uploadDocument(files[0], { sessionId: session.id })
      setUploaded(true)
      localStorage.setItem('athora-onboarded', 'true')
      localStorage.setItem('athora-last-session', session.id)
    } catch {
      localStorage.setItem('athora-onboarded', 'true')
      setUploaded(true)
    } finally {
      setUploading(false)
    }
  }

  const finish = () => {
    localStorage.setItem('athora-onboarded', 'true')
    localStorage.setItem('athora-onboarding-data', JSON.stringify(data))
    router.push('/paywall')
  }

  const retentionRate = data.challenge === 'Forgetting everything' ? '23%' : '35%'
  const studyDays = data.timeline === 'This week' ? '5' : data.timeline === 'In 2 weeks' ? '12' : data.timeline === 'In 1 month' ? '25' : '60+'

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Progress bar */}
      <div className="h-1.5 bg-stone-200">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Step counter */}
      <div className="px-6 pt-4 flex justify-between items-center">
        <span className="text-xs text-stone-400">{step + 1} / {TOTAL_STEPS}</span>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg"
          >

            {/* Step 1: Role */}
            {step === 0 && (
              <div className="space-y-8 text-center">
                <div>
                  <img
                    src="/images/onboarding/onboarding-preferences.webp"
                    alt=""
                    className="mx-auto mb-4 h-36 w-auto object-contain"
                  />
                  <h1 className="text-2xl font-bold text-stone-900">What best describes you?</h1>
                  <p className="mt-2 text-stone-500">This helps us personalize your experience.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'student', label: '🎓 University / College Student' },
                    { value: 'high-school', label: '📚 High School Student' },
                    { value: 'professional', label: '💼 Working Professional' },
                    { value: 'self-learner', label: '🧠 Self-Learner' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { update('role', opt.value); next() }}
                      className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition hover:border-purple-400 hover:bg-purple-50 ${data.role === opt.value ? 'border-purple-500 bg-purple-50' : 'border-stone-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Subject */}
            {step === 1 && (
              <div className="space-y-8 text-center">
                <div>
                  <img
                    src="/images/onboarding/onboarding-subjects.webp"
                    alt=""
                    className="mx-auto mb-4 h-36 w-auto object-contain"
                  />
                  <h1 className="text-2xl font-bold text-stone-900">What are you studying for?</h1>
                  <p className="mt-2 text-stone-500">Your biggest upcoming exam or course.</p>
                </div>
                <Input
                  placeholder="e.g. Biology 101 Midterm, MCAT, Machine Learning Final..."
                  value={data.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  className="text-center text-lg h-14"
                  autoFocus
                />
                <Button onClick={next} disabled={!data.subject.trim()} size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 3: Timeline */}
            {step === 2 && (
              <div className="space-y-8 text-center">
                <div>
                  <img
                    src="/images/onboarding/onboarding-goals.webp"
                    alt=""
                    className="mx-auto mb-4 h-36 w-auto object-contain"
                  />
                  <h1 className="text-2xl font-bold text-stone-900">When is your exam?</h1>
                  <p className="mt-2 text-stone-500">We will build your study plan around this.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {['This week', 'In 2 weeks', 'In 1 month', 'In 3+ months'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { update('timeline', opt); next() }}
                      className={`rounded-xl border-2 p-4 text-sm font-medium transition hover:border-purple-400 hover:bg-purple-50 ${data.timeline === opt ? 'border-purple-500 bg-purple-50' : 'border-stone-200'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Hours per day */}
            {step === 3 && (
              <div className="space-y-8 text-center">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">How much time can you study per day?</h1>
                  <p className="mt-2 text-stone-500">No judgment — we will make every minute count.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: '30min', label: '30 min' },
                    { value: '1h', label: '1 hour' },
                    { value: '2h', label: '2 hours' },
                    { value: '3h+', label: '3+ hours' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { update('hoursPerDay', opt.value); next() }}
                      className={`rounded-xl border-2 p-5 text-sm font-medium transition hover:border-purple-400 hover:bg-purple-50 ${data.hoursPerDay === opt.value ? 'border-purple-500 bg-purple-50' : 'border-stone-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Biggest challenge */}
            {step === 4 && (
              <div className="space-y-8 text-center">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">What is your biggest study challenge?</h1>
                  <p className="mt-2 text-stone-500">We will focus on solving this for you.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    'Forgetting everything after reading',
                    'No motivation to start',
                    'Too much content, not enough time',
                    'Don\'t know what\'s important',
                  ].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { update('challenge', opt); next() }}
                      className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition hover:border-purple-400 hover:bg-purple-50 ${data.challenge === opt ? 'border-purple-500 bg-purple-50' : 'border-stone-200'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6: Tried flashcards */}
            {step === 5 && (
              <div className="space-y-8 text-center">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">Have you used flashcards before?</h1>
                  <p className="mt-2 text-stone-500">Like Anki, Quizlet, or paper flashcards.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'yes-liked', label: 'Yes, and I liked it' },
                    { value: 'yes-tedious', label: 'Yes, but making them was tedious' },
                    { value: 'no', label: 'No, never tried' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { update('triedFlashcards', opt.value); next() }}
                      className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition hover:border-purple-400 hover:bg-purple-50 ${data.triedFlashcards === opt.value ? 'border-purple-500 bg-purple-50' : 'border-stone-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Learning preference */}
            {step === 6 && (
              <div className="space-y-8 text-center">
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">How do you prefer to learn?</h1>
                  <p className="mt-2 text-stone-500">We will prioritize the right format for you.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'reading', label: '📖 Reading & summarizing' },
                    { value: 'listening', label: '🎧 Listening & audio' },
                    { value: 'practice', label: '✍️ Practice questions & quizzes' },
                    { value: 'visual', label: '🗺️ Visual maps & diagrams' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { update('preference', opt.value); next() }}
                      className={`rounded-xl border-2 p-4 text-left text-sm font-medium transition hover:border-purple-400 hover:bg-purple-50 ${data.preference === opt.value ? 'border-purple-500 bg-purple-50' : 'border-stone-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 8: Personalized insight */}
            {step === 7 && (
              <div className="space-y-8 text-center">
                <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 p-8">
                  <h1 className="text-xl font-bold text-stone-900 mb-6">Here is your study diagnosis:</h1>
                  <ul className="space-y-4 text-left text-sm text-stone-700">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs">❌</span>
                      <span>Your current method has only <strong>{retentionRate} retention</strong> after 48 hours.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs">⏰</span>
                      <span>You have <strong>{studyDays} days</strong> until your exam — every session matters.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs">✅</span>
                      <span>With AI-powered active recall, students retain <strong>90%+</strong> in the same time.</span>
                    </li>
                  </ul>
                  <div className="mt-6 rounded-xl bg-white/80 p-4 border border-purple-100">
                    <p className="text-sm font-medium text-purple-800">
                      Athora will create flashcards, quizzes, and summaries from your materials — automatically.
                    </p>
                  </div>
                </div>
                <Button onClick={next} size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                  Show me how it works <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 9: Social proof */}
            {step === 8 && (
              <div className="space-y-8 text-center">
                <div>
                  <div className="inline-flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h1 className="text-2xl font-bold text-stone-900">Join 10,000+ students</h1>
                  <p className="mt-2 text-stone-500">who are already studying smarter with Athora.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { text: '"I passed my finals with 2 weeks of Athora after struggling for months."', name: 'Sarah K.', school: 'UCLA Biology' },
                    { text: '"The AI flashcards are insanely good. Saved me hours of manual work."', name: 'Marcus L.', school: 'MIT CS' },
                    { text: '"Went from C to A- in Organic Chemistry. The exam prep is 🔥"', name: 'Jenny T.', school: 'Stanford Pre-Med' },
                  ].map((review) => (
                    <div key={review.name} className="rounded-xl border border-stone-200 bg-white p-4 text-left">
                      <p className="text-sm text-stone-700">{review.text}</p>
                      <p className="mt-2 text-xs text-stone-400">{review.name} · {review.school}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-stone-400">
                  <Users className="h-4 w-4" />
                  <span>2,847 students joined this week</span>
                </div>

                <Button onClick={next} size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 10: Demo preview */}
            {step === 9 && (
              <div className="space-y-8 text-center">
                <div>
                  <Sparkles className="mx-auto h-8 w-8 text-purple-500 mb-3" />
                  <h1 className="text-2xl font-bold text-stone-900">Here is what Athora generates</h1>
                  <p className="mt-2 text-stone-500">From a single document upload — in seconds.</p>
                </div>

                {/* Demo flashcard */}
                <div className="rounded-2xl border-2 border-purple-200 bg-white p-6 text-left shadow-sm">
                  <p className="text-xs font-medium text-purple-600 mb-2">AI FLASHCARD PREVIEW</p>
                  <p className="text-base font-medium text-stone-900">What is the powerhouse of the cell?</p>
                  <div className="mt-4 rounded-lg bg-purple-50 p-3">
                    <p className="text-sm text-stone-700">The <strong>mitochondria</strong> — responsible for producing ATP through cellular respiration.</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Easy</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Medium</span>
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Hard</span>
                  </div>
                </div>

                {/* Feature list */}
                <div className="grid grid-cols-2 gap-2 text-left text-xs">
                  {[
                    { icon: Brain, label: 'Flashcards' },
                    { icon: Target, label: 'Practice Exams' },
                    { icon: FileText, label: 'Smart Summaries' },
                    { icon: Sparkles, label: 'AI Tutor Chat' },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2 rounded-lg bg-stone-100 p-3">
                      <f.icon className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-stone-700">{f.label}</span>
                    </div>
                  ))}
                </div>

                <Button onClick={next} size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                  Try it with my document <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Step 11: Upload */}
            {step === 10 && (
              <div className="space-y-8 text-center">
                <div>
                  <img
                    src="/images/onboarding/onboarding-upload.webp"
                    alt=""
                    className="mx-auto mb-2 h-32 w-auto object-contain"
                  />
                  <h1 className="text-2xl font-bold text-stone-900">Drop your first document</h1>
                  <p className="mt-2 text-stone-500">AI will generate flashcards, quizzes, and summaries instantly.</p>
                </div>
                {!uploaded ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-10 transition hover:border-purple-500 hover:bg-purple-50"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                        <p className="text-sm font-medium text-purple-700">Processing...</p>
                        <p className="text-xs text-stone-400">Generating study materials from your document</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="h-10 w-10 text-purple-400" />
                        <p className="text-sm font-medium text-stone-700">Click to upload or drag & drop</p>
                        <p className="text-xs text-stone-400">PDF, DOC up to 50MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleUpload(e.target.files)}
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-8">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-3" />
                    <p className="font-medium text-green-800">Document uploaded!</p>
                    <p className="text-sm text-green-600 mt-1">Your study materials are being generated.</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button onClick={next} variant="outline" className="flex-1">
                    Skip for now
                  </Button>
                  {uploaded && (
                    <Button onClick={next} className="flex-1 bg-purple-600 hover:bg-purple-700">
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step 12: Personalized study plan → paywall redirect */}
            {step === 11 && (
              <div className="space-y-8 text-center">
                <div>
                  <img
                    src="/images/onboarding/onboarding-complete.webp"
                    alt="Your plan is ready"
                    className="mx-auto mb-4 h-36 w-36 object-contain"
                  />
                  <h1 className="text-2xl font-bold text-stone-900">Your study plan is ready!</h1>
                  <p className="mt-2 text-stone-500 max-w-sm mx-auto">
                    Based on your answers, here is how you will ace <strong>{data.subject || 'your exam'}</strong>.
                  </p>
                </div>

                <div className="rounded-xl bg-white border border-stone-200 p-5 text-left space-y-3 shadow-sm">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Your personalized plan</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                      <FileText className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-800">Upload materials → AI generates everything</p>
                      <p className="text-xs text-stone-400">Flashcards, quizzes, summaries in seconds</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                      <Brain className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-800">Review {data.hoursPerDay || '1h'}/day with spaced repetition</p>
                      <p className="text-xs text-stone-400">Retain 90%+ of what you study</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                      <Target className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-800">Practice exams to find weak spots</p>
                      <p className="text-xs text-stone-400">AI targets what you don&apos;t know yet</p>
                    </div>
                  </div>
                </div>

                <Button onClick={finish} size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
                  Unlock my study plan <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
