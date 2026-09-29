import type { Metadata } from "next"
import { headers } from "next/headers"
import LandingPage from "@/components/landing/landing-page"

export const metadata: Metadata = {
  title: "Nrop-on — AI Study Tool for Exam Prep, Flashcards & Practice Tests",
  description:
    "Upload your lectures and textbooks. Nrop-on generates AI flashcards, practice exams, mind maps, and smart summaries in seconds. Study less, remember everything.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Nrop-on — AI Study Tool for Exam Prep, Flashcards & Practice Tests",
    description:
      "Upload your lectures and textbooks. Get AI-generated flashcards, practice exams, and smart summaries in seconds. Join students who stopped grinding and started learning.",
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "Nrop-on - Pass Exams Faster with AI",
      },
    ],
  },
}

export default async function Home() {
  const headersList = await headers()
  const nonce = headersList.get("x-nonce") ?? undefined

  return <LandingPage nonce={nonce} />
}
