import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Study Spaces',
  robots: { index: false, follow: false },
}

export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  return children
}
