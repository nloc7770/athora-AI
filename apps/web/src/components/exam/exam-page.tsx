'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap,
  Clock,
  Target,
  Brain,
  ChevronRight,
  Check,
  X,
  BarChart3,
} from 'lucide-react'
import { courses } from '@/data/mock'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type ExamState = 'setup' | 'active'
type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed'
type QuestionType = 'multiple-choice' | 'short-answer' | 'true-false'
type TimeLimit = 0 | 15 | 30 | 60

interface MockQuestion {
  id: number
  text: string
  options: string[]
  correct: number
}

const mockQuestions: MockQuestion[] = [
  {
    id: 1,
    text: 'What is the time complexity of merge sort in the worst case?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    correct: 1,
  },
  {
    id: 2,
    text: 'Which data structure uses LIFO (Last In, First Out) ordering?',
    options: ['Queue', 'Stack', 'Linked List', 'Hash Table'],
    correct: 1,
  },
  {
    id: 3,
    text: 'What is the space complexity of a recursive Fibonacci implementation without memoization?',
    options: ['O(1)', 'O(n)', 'O(n²)', 'O(2^n)'],
    correct: 1,
  },
  {
    id: 4,
    text: 'Which traversal visits the root node first?',
    options: ['In-order', 'Post-order', 'Pre-order', 'Level-order'],
    correct: 2,
  },
  {
    id: 5,
    text: 'What is the average case time complexity of quicksort?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    correct: 1,
  },
  {
    id: 6,
    text: 'Which sorting algorithm is stable by default?',
    options: ['Quicksort', 'Heap sort', 'Merge sort', 'Selection sort'],
    correct: 2,
  },
  {
    id: 7,
    text: 'A balanced BST has a height of:',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correct: 1,
  },
  {
    id: 8,
    text: 'Which operation is O(1) for a hash table on average?',
    options: ['Sorting', 'Lookup', 'Finding min', 'Traversal'],
    correct: 1,
  },
  {
    id: 9,
    text: 'What does BFS use as its underlying data structure?',
    options: ['Stack', 'Queue', 'Priority Queue', 'Deque'],
    correct: 1,
  },
  {
    id: 10,
    text: 'In a min-heap, the smallest element is always at:',
    options: ['A leaf node', 'The last level', 'The root', 'Index n/2'],
    correct: 2,
  },
]

const courseImages: Record<string, string> = {
  cs101: '/images/course-cs.png',
  math201: '/images/course-math.png',
  bio150: '/images/course-bio.png',
  phil100: '/images/course-phil.png',
}

const weakTopics = [
  { label: 'Sorting Algorithms', course: 'CS 101' },
  { label: 'Eigenvalues', course: 'MATH 201' },
  { label: 'DNA Replication', course: 'BIO 150' },
  { label: 'Categorical Imperative', course: 'PHIL 100' },
]

const questionCountSteps = [5, 10, 15, 20, 25]
const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'mixed']
const questionTypes: { value: QuestionType; label: string }[] = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'true-false', label: 'True/False' },
]
const timeLimits: { value: TimeLimit; label: string }[] = [
  { value: 0, label: 'No limit' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
]

export default function ExamPage() {
  const [examState, setExamState] = useState<ExamState>('setup')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([
    'multiple-choice',
  ])
  const [timeLimit, setTimeLimit] = useState<TimeLimit>(30)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  function toggleQuestionType(type: QuestionType) {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    )
  }

  function handleStartExam() {
    if (!selectedCourse || selectedTypes.length === 0) return
    setExamState('active')
    setCurrentQuestion(0)
    setAnswers({})
    setElapsedSeconds(0)
  }

  function handleSelectAnswer(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }))
  }

  function handleNext() {
    if (currentQuestion < questionCount - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  function handlePrevious() {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  function handleSubmit() {
    setExamState('setup')
  }

  const activeQuestions = mockQuestions.slice(0, questionCount)
  const answeredCount = Object.keys(answers).length
  const progressPercent = (answeredCount / questionCount) * 100
  const selectedCourseData = courses.find((c) => c.id === selectedCourse)

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Timer effect would go here in production
  // useEffect with setInterval for elapsedSeconds

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50/50">
      <AnimatePresence mode="wait">
        {examState === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"
          >
            {/* Header */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                  Exam Mode
                </h1>
                <p className="text-sm text-zinc-500">
                  Test your knowledge with AI-generated questions
                </p>
              </div>
            </div>

            {/* Course Selector */}
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-medium text-zinc-700">
                Select Course
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    className={`cursor-pointer border p-4 transition-all ${
                      selectedCourse === course.id
                        ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedCourse(course.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="overflow-hidden rounded-lg ring-1 ring-zinc-200">
                          <img
                            src={courseImages[course.id] ?? '/images/course-cs.png'}
                            alt={`${course.code} thumbnail`}
                            className="h-10 w-10 object-cover opacity-80"
                          />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              selectedCourse === course.id
                                ? 'text-white'
                                : 'text-zinc-900'
                            }`}
                          >
                            {course.code}
                          </p>
                          <p
                            className={`text-xs ${
                              selectedCourse === course.id
                                ? 'text-zinc-300'
                                : 'text-zinc-500'
                            }`}
                          >
                            {course.name}
                          </p>
                        </div>
                      </div>
                      {selectedCourse === course.id && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Configuration */}
            <Card className="mb-6 border-zinc-200 bg-white p-6">
              <h2 className="mb-5 text-sm font-medium text-zinc-700">
                Configuration
              </h2>

              {/* Question Count */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Questions
                  </label>
                  <span className="text-sm font-semibold text-zinc-900">
                    {questionCount}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={4}
                  value={[questionCountSteps.indexOf(questionCount)]}
                  onValueChange={(val) => {
                    const values = Array.isArray(val) ? val : [val]
                    setQuestionCount(questionCountSteps[values[0]])
                  }}
                />
                <div className="mt-2 flex justify-between text-xs text-zinc-400">
                  {questionCountSteps.map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Difficulty */}
              <div className="mb-6">
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Difficulty
                </label>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all ${
                        difficulty === d
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Question Types */}
              <div className="mb-6">
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Question Types
                </label>
                <div className="flex flex-wrap gap-2">
                  {questionTypes.map((qt) => (
                    <button
                      key={qt.value}
                      onClick={() => toggleQuestionType(qt.value)}
                      className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        selectedTypes.includes(qt.value)
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {selectedTypes.includes(qt.value) && (
                        <Check className="h-3 w-3" />
                      )}
                      {qt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Time Limit */}
              <div className="mb-6">
                <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Time Limit
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeLimits.map((tl) => (
                    <button
                      key={tl.value}
                      onClick={() => setTimeLimit(tl.value)}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        timeLimit === tl.value
                          ? 'bg-zinc-900 text-white shadow-sm'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {tl.value > 0 && <Clock className="h-3.5 w-3.5" />}
                      {tl.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Weak Topics */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-zinc-400" />
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Suggested Weak Areas
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {weakTopics.map((topic) => (
                    <Badge
                      key={topic.label}
                      variant="secondary"
                      className="cursor-pointer bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      <Target className="mr-1 h-3 w-3" />
                      {topic.label}
                      <span className="ml-1.5 text-amber-500">
                        {topic.course}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Start Button */}
            <Button
              onClick={handleStartExam}
              disabled={!selectedCourse || selectedTypes.length === 0}
              className="w-full bg-zinc-900 py-6 text-base font-medium text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl disabled:opacity-40"
            >
              Start Exam
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6 sm:px-6"
          >
            {/* Top Bar */}
            <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <span className="font-mono font-medium">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-5" />
                <span className="text-sm font-medium text-zinc-700">
                  Question {currentQuestion + 1} of {questionCount}
                </span>
              </div>
              {selectedCourseData && (
                <Badge
                  variant="secondary"
                  className="bg-zinc-100 text-xs font-medium text-zinc-600"
                >
                  {selectedCourseData.code}
                </Badge>
              )}
            </div>

            {/* Progress */}
            <div className="mb-6">
              <Progress value={progressPercent} className="h-1.5" />
            </div>

            {/* Question Card */}
            <Card className="mb-6 border-zinc-200 bg-white p-8 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Question {currentQuestion + 1}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-zinc-100 text-xs text-zinc-500"
                >
                  Multiple Choice
                </Badge>
              </div>
              <p className="text-lg font-medium leading-relaxed text-zinc-900">
                {activeQuestions[currentQuestion]?.text}
              </p>
            </Card>

            {/* Answer Options */}
            <div className="mb-8 grid gap-3">
              {activeQuestions[currentQuestion]?.options.map(
                (option, index) => {
                  const isSelected =
                    answers[currentQuestion] === index
                  const letter = String.fromCharCode(65 + index)

                  return (
                    <Card
                      key={index}
                      onClick={() =>
                        handleSelectAnswer(currentQuestion, index)
                      }
                      className={`cursor-pointer border p-4 transition-all ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {letter}
                        </div>
                        <span
                          className={`text-sm font-medium ${
                            isSelected ? 'text-white' : 'text-zinc-700'
                          }`}
                        >
                          {option}
                        </span>
                      </div>
                    </Card>
                  )
                }
              )}
            </div>

            {/* Question Dots */}
            <div className="mb-6 flex flex-wrap items-center justify-center gap-1.5">
              {Array.from({ length: questionCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQuestion(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    i === currentQuestion
                      ? 'scale-125 bg-zinc-900'
                      : answers[i] !== undefined
                        ? 'bg-zinc-400'
                        : 'bg-zinc-200'
                  }`}
                  aria-label={`Go to question ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="border-zinc-200 text-zinc-600"
              >
                Previous
              </Button>

              <div className="flex items-center gap-3">
                {answeredCount === questionCount && (
                  <Button
                    onClick={handleSubmit}
                    className="bg-zinc-900 text-white shadow-lg hover:bg-zinc-800"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Submit Exam
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={currentQuestion === questionCount - 1}
                  className="bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Exit button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setExamState('setup')}
                className="flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
                Exit Exam
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
