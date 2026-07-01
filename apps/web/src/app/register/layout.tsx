import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up Free',
  description: 'Create your free Athora account. Upload documents and get AI-generated flashcards, practice exams, and study summaries in seconds.',
  alternates: {
    canonical: '/register',
  },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
