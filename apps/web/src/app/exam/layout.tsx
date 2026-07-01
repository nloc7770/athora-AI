import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Practice Exam',
  robots: { index: false, follow: false },
}

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return children
}
