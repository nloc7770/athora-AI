import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ToastContainer } from "@/components/ui/toast-container";
import { ErrorBoundary } from "@/components/error-boundary";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { PostHogProvider } from "@/components/posthog-provider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#7c3aed",
};

export const metadata: Metadata = {
  title: {
    default: "Nrop-on — AI Study Tool for Exam Prep & Flashcards",
    template: "%s | Nrop-on",
  },
  description:
    "AI-powered study assistant that helps students pass exams faster with smart flashcards, practice tests, mind maps, and AI tutoring from your own materials.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://nrop-on.com"
  ),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Nrop-on — AI Study Tool for Exam Prep & Flashcards",
    description:
      "Upload your lectures and textbooks. Get AI-generated flashcards, practice exams, and smart summaries in seconds.",
    type: "website",
    locale: "en_US",
    siteName: "Nrop-on",
    images: [
      {
        url: "/images/og-default.png",
        width: 1200,
        height: 630,
        alt: "Nrop-on - AI-Powered Study Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nrop-on — AI Study Tool for Exam Prep & Flashcards",
    description:
      "Upload your lectures and textbooks. Get AI-generated flashcards, practice exams, and smart summaries in seconds.",
    images: ["/images/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/images/apple-icon.png",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nrop-on",
  url: "https://nrop-on.com",
  logo: "https://nrop-on.com/images/icon-192.png",
  description:
    "AI-powered study platform helping students pass exams faster with smart flashcards, practice tests, and AI tutoring.",
  sameAs: [],
};

// Only acts when the user picked a theme in /settings; unset keeps the current light default
const themeScript = `try{var t=localStorage.getItem('athora-theme');if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;

  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Apply saved theme before paint so every page honours it without a flash */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <link rel="preconnect" href="https://api.dicebear.com" />
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="h-full font-sans antialiased">
        <ErrorBoundary>
          <PostHogProvider>
            <TooltipProvider>
              <AuthProvider>
                {children}
                <ToastContainer />
                <CookieConsent />
              </AuthProvider>
            </TooltipProvider>
          </PostHogProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
