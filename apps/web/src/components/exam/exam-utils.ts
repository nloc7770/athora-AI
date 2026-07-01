export const SESSION_STORAGE_PREFIX = 'exam-progress-'

export interface SubmitResponse {
  score: number
  totalQuestions: number
  correctAnswers: number
  results: {
    questionId: string
    questionText?: string
    correct: boolean
    correctAnswer: string
    userAnswer: string
    explanation?: string
  }[]
}

export type ExamState = 'list' | 'active' | 'results'

export function getSessionKey(examId: string): string {
  return `${SESSION_STORAGE_PREFIX}${examId}`
}

export function saveProgress(
  examId: string,
  answers: Record<number, number>,
  currentQuestion: number
): void {
  try {
    sessionStorage.setItem(
      getSessionKey(examId),
      JSON.stringify({ answers, currentQuestion, savedAt: Date.now() })
    )
  } catch {
    // sessionStorage may be unavailable
  }
}

export function loadProgress(
  examId: string
): { answers: Record<number, number>; currentQuestion: number } | null {
  try {
    const raw = sessionStorage.getItem(getSessionKey(examId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.answers === 'object') {
      return { answers: parsed.answers, currentQuestion: parsed.currentQuestion ?? 0 }
    }
  } catch {
    // ignore parse errors
  }
  return null
}

export function clearProgress(examId: string): void {
  try {
    sessionStorage.removeItem(getSessionKey(examId))
  } catch {
    // ignore
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function getDifficultyColor(difficulty?: string): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    case 'medium':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    case 'hard':
      return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
    default:
      return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export function getScoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-500'
  if (score >= 60) return 'stroke-amber-500'
  return 'stroke-red-500'
}

export function getScoreMessage(score: number): string {
  if (score >= 90) return 'Outstanding!'
  if (score >= 70) return 'Great job!'
  if (score >= 50) return 'Good effort!'
  return 'Keep practicing'
}
