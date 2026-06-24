// Mock data for Athora prototype

export interface Course {
  id: string
  name: string
  code: string
  color: string
  documentsCount: number
  progress: number
  lastStudied: string
}

export interface Document {
  id: string
  name: string
  type: 'pdf' | 'audio' | 'note' | 'video'
  courseId: string
  courseName: string
  size: string
  uploadedAt: string
  lastStudied: string | null
  status: 'ready' | 'processing' | 'error'
  pages?: number
  duration?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  courseId: string
  lastReviewed: string | null
  nextReview: string | null
  streak: number
}

export const courses: Course[] = [
  {
    id: 'cs101',
    name: 'Introduction to Computer Science',
    code: 'CS 101',
    color: '#6366f1',
    documentsCount: 12,
    progress: 68,
    lastStudied: '2 hours ago',
  },
  {
    id: 'math201',
    name: 'Linear Algebra',
    code: 'MATH 201',
    color: '#8b5cf6',
    documentsCount: 8,
    progress: 45,
    lastStudied: 'Yesterday',
  },
  {
    id: 'bio150',
    name: 'Molecular Biology',
    code: 'BIO 150',
    color: '#06b6d4',
    documentsCount: 15,
    progress: 82,
    lastStudied: '3 days ago',
  },
  {
    id: 'phil100',
    name: 'Ethics & Philosophy',
    code: 'PHIL 100',
    color: '#f59e0b',
    documentsCount: 6,
    progress: 30,
    lastStudied: '1 week ago',
  },
]

export const documents: Document[] = [
  {
    id: 'doc-1',
    name: 'Chapter 5 - Data Structures.pdf',
    type: 'pdf',
    courseId: 'cs101',
    courseName: 'CS 101',
    size: '2.4 MB',
    uploadedAt: '2024-01-15',
    lastStudied: '2 hours ago',
    status: 'ready',
    pages: 42,
  },
  {
    id: 'doc-2',
    name: 'Lecture 12 - Recursion.mp3',
    type: 'audio',
    courseId: 'cs101',
    courseName: 'CS 101',
    size: '45 MB',
    uploadedAt: '2024-01-14',
    lastStudied: 'Yesterday',
    status: 'ready',
    duration: '1h 15m',
  },
  {
    id: 'doc-3',
    name: 'Eigenvalues & Eigenvectors.pdf',
    type: 'pdf',
    courseId: 'math201',
    courseName: 'MATH 201',
    size: '1.8 MB',
    uploadedAt: '2024-01-13',
    lastStudied: null,
    status: 'ready',
    pages: 28,
  },
  {
    id: 'doc-4',
    name: 'DNA Replication Notes.md',
    type: 'note',
    courseId: 'bio150',
    courseName: 'BIO 150',
    size: '156 KB',
    uploadedAt: '2024-01-12',
    lastStudied: '3 days ago',
    status: 'ready',
  },
  {
    id: 'doc-5',
    name: 'Protein Synthesis Lecture.mp4',
    type: 'video',
    courseId: 'bio150',
    courseName: 'BIO 150',
    size: '320 MB',
    uploadedAt: '2024-01-11',
    lastStudied: null,
    status: 'processing',
    duration: '52m',
  },
  {
    id: 'doc-6',
    name: 'Kant - Critique of Pure Reason.pdf',
    type: 'pdf',
    courseId: 'phil100',
    courseName: 'PHIL 100',
    size: '4.1 MB',
    uploadedAt: '2024-01-10',
    lastStudied: '1 week ago',
    status: 'ready',
    pages: 96,
  },
  {
    id: 'doc-7',
    name: 'Sorting Algorithms Comparison.pdf',
    type: 'pdf',
    courseId: 'cs101',
    courseName: 'CS 101',
    size: '890 KB',
    uploadedAt: '2024-01-09',
    lastStudied: '4 days ago',
    status: 'ready',
    pages: 18,
  },
  {
    id: 'doc-8',
    name: 'Matrix Transformations.pdf',
    type: 'pdf',
    courseId: 'math201',
    courseName: 'MATH 201',
    size: '3.2 MB',
    uploadedAt: '2024-01-08',
    lastStudied: null,
    status: 'error',
    pages: 35,
  },
]

export const flashcards: Flashcard[] = [
  {
    id: 'fc-1',
    front: 'What is the time complexity of binary search?',
    back: 'O(log n) — Binary search halves the search space with each comparison, making it logarithmic.',
    difficulty: 'easy',
    courseId: 'cs101',
    lastReviewed: '2 hours ago',
    nextReview: 'Tomorrow',
    streak: 5,
  },
  {
    id: 'fc-2',
    front: 'Define an eigenvector.',
    back: 'A non-zero vector v that, when a linear transformation A is applied, only changes by a scalar factor λ: Av = λv',
    difficulty: 'hard',
    courseId: 'math201',
    lastReviewed: 'Yesterday',
    nextReview: 'In 3 days',
    streak: 2,
  },
  {
    id: 'fc-3',
    front: 'What are the three stages of DNA replication?',
    back: '1. Initiation (origin recognition)\n2. Elongation (new strand synthesis)\n3. Termination (completion signals)',
    difficulty: 'medium',
    courseId: 'bio150',
    lastReviewed: '3 days ago',
    nextReview: 'Today',
    streak: 3,
  },
  {
    id: 'fc-4',
    front: 'What is Kant\'s Categorical Imperative?',
    back: 'Act only according to that maxim whereby you can at the same time will that it should become a universal law.',
    difficulty: 'medium',
    courseId: 'phil100',
    lastReviewed: null,
    nextReview: null,
    streak: 0,
  },
  {
    id: 'fc-5',
    front: 'What is a hash table collision?',
    back: 'When two different keys hash to the same index in the array. Resolved via chaining (linked lists) or open addressing (probing).',
    difficulty: 'medium',
    courseId: 'cs101',
    lastReviewed: '1 day ago',
    nextReview: 'In 2 days',
    streak: 4,
  },
  {
    id: 'fc-6',
    front: 'What is the rank-nullity theorem?',
    back: 'For a linear map T: V → W, dim(V) = rank(T) + nullity(T). The dimension of the domain equals the rank plus the nullity.',
    difficulty: 'hard',
    courseId: 'math201',
    lastReviewed: null,
    nextReview: null,
    streak: 0,
  },
]

export const chatMessages: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Can you explain how a hash table handles collisions?',
    timestamp: '2:34 PM',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: `Great question! A hash table handles collisions using two main strategies:

**1. Chaining (Separate Chaining)**
Each bucket contains a linked list. When two keys hash to the same index, the new entry is appended to that bucket's list.

**2. Open Addressing**
When a collision occurs, the algorithm probes for the next available slot using:
- Linear probing: check next slot sequentially
- Quadratic probing: check slots at quadratic intervals
- Double hashing: use a second hash function

In your textbook (page 23), the authors focus primarily on chaining because it's simpler to implement and analyze.

Would you like me to generate flashcards on this topic?`,
    timestamp: '2:34 PM',
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'What about the load factor? When should we resize?',
    timestamp: '2:36 PM',
  },
  {
    id: 'msg-4',
    role: 'assistant',
    content: `The **load factor** (α) is the ratio of entries to buckets: α = n/m

**When to resize:**
- Typically when α > 0.75 (Java's HashMap default)
- Some implementations use α > 0.5 for better performance

**Resizing process:**
1. Create a new array (usually 2× size)
2. Rehash all existing entries
3. This is O(n) but amortized O(1) per insertion

From your lecture notes (Lecture 12, slide 8), Professor Chen mentions that the choice of threshold depends on whether you're optimizing for space or time.`,
    timestamp: '2:36 PM',
  },
]

export const suggestedQuestions = [
  'Summarize this chapter in 3 key points',
  'What are the main differences between arrays and linked lists?',
  'Create a study guide for the upcoming exam',
  'Explain this concept with a real-world analogy',
  'What prerequisites do I need to understand this?',
  'Generate practice problems for this topic',
]
