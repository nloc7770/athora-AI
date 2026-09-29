import { JsonLd } from './json-ld'

const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Nrop-on",
  url: "https://nrop-on.com",
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
      name: "How does Nrop-on help students study?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nrop-on uses AI to process your uploaded lectures, textbooks, and notes. It generates smart flashcards, practice exams, mind maps, and summaries grounded in your own materials — not internet content.",
      },
    },
    {
      "@type": "Question",
      name: "What file formats does Nrop-on support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nrop-on supports PDF, DOCX, lecture slides, and plain text notes. Any format, any subject, any language.",
      },
    },
    {
      "@type": "Question",
      name: "Is Nrop-on free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Nrop-on offers a free plan with 5 document uploads, basic AI chat, and 10 flashcard sets. The Pro plan at $12/month unlocks unlimited documents, advanced AI features, exam generation, and more.",
      },
    },
    {
      "@type": "Question",
      name: "How is Nrop-on different from ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unlike ChatGPT, Nrop-on answers are grounded in YOUR specific materials. It cites exact paragraphs from your documents, generates study tools tailored to your content, and never hallucinates from internet data.",
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
