import type { Metadata } from "next"
import { headers } from "next/headers"
import LandingPage from "@/components/landing/landing-page"

export const metadata: Metadata = {
  title: "Athora — AI Study Tool for Exam Prep, Flashcards & Practice Tests",
  description:
    "Upload your lectures and textbooks. Athora generates AI flashcards, practice exams, mind maps, and smart summaries in seconds. Study less, remember everything.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Athora — AI Study Tool for Exam Prep, Flashcards & Practice Tests",
    description:
      "Upload your lectures and textbooks. Get AI-generated flashcards, practice exams, and smart summaries in seconds. Join students who stopped grinding and started learning.",
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "Athora - Pass Exams Faster with AI",
      },
    ],
  },
}

export default async function Home() {
  const headersList = await headers()
  const nonce = headersList.get("x-nonce") ?? undefined

  return <LandingPage nonce={nonce} />
}
