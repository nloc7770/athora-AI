export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: string
  userId: string
  name: string
  code?: string
  color: string
  description?: string
  documentsCount?: number
  progress?: number
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  userId: string
  courseId?: string
  courseName?: string
  name: string
  type: 'pdf' | 'audio' | 'note' | 'video'
  fileUrl?: string
  fileSize?: number
  pages?: number
  duration?: number
  status: 'ready' | 'processing' | 'error'
  createdAt: string
  updatedAt: string
}

export interface FlashcardSet {
  id: string
  userId: string
  courseId?: string
  documentId?: string
  name: string
  description?: string
  cardCount?: number
  createdAt: string
}

export interface Flashcard {
  id: string
  setId: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  streak: number
  lastReviewed?: string
  nextReview?: string
  createdAt: string
}

export interface Exam {
  id: string
  userId: string
  courseId?: string
  name: string
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
  timeLimit?: number
  createdAt: string
}

export interface ExamQuestion {
  id: string
  examId: string
  question: string
  type: 'multiple_choice' | 'short_answer' | 'true_false'
  options?: string[]
  correctAnswer: string
  explanation?: string
  orderIndex: number
}

export interface ExamAttempt {
  id: string
  examId: string
  userId: string
  answers: Record<string, string>
  score?: number
  timeSpent?: number
  completedAt: string
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken?: string
}
