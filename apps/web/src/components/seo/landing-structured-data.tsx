import { JsonLd } from './json-ld'

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Athora",
  url: "https://athora.app",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  description:
    "AI-powered study assistant that helps students pass exams faster with smart flashcards, practice tests, mind maps, and AI tutoring.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "12",
    priceCurrency: "USD",
    offerCount: 2,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "127",
    bestRating: "5",
    worstRating: "1",
  },
}

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does Athora help students study?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Athora uses AI to process your uploaded lectures, textbooks, and notes. It generates smart flashcards, practice exams, mind maps, and summaries grounded in your own materials — not internet content.",
      },
    },
    {
      "@type": "Question",
      name: "What file formats does Athora support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Athora supports PDF, DOCX, lecture slides, and plain text notes. Any format, any subject, any language.",
      },
    },
    {
      "@type": "Question",
      name: "Is Athora free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Athora offers a free plan with 5 document uploads, basic AI chat, and 10 flashcard sets. The Pro plan at $12/month unlocks unlimited documents, advanced AI features, exam generation, and more.",
      },
    },
    {
      "@type": "Question",
      name: "How is Athora different from ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unlike ChatGPT, Athora answers are grounded in YOUR specific materials. It cites exact paragraphs from your documents, generates study tools tailored to your content, and never hallucinates from internet data.",
      },
    },
  ],
}

export function LandingStructuredData({ nonce }: { nonce?: string }) {
  return (
    <>
      <JsonLd data={webApplicationSchema} nonce={nonce} />
      <JsonLd data={faqSchema} nonce={nonce} />
    </>
  )
}
