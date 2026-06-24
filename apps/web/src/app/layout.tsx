import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ToastContainer } from "@/components/ui/toast-container";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Athora",
    template: "%s | Athora",
  },
  description:
    "AI-powered study assistant that helps students pass exams faster with flashcards, quizzes, and smart document processing.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "https://athora.app"
  ),
  openGraph: {
    title: "Athora",
    description:
      "AI-powered study assistant that helps students pass exams faster.",
    type: "website",
    locale: "en_US",
    siteName: "Athora",
  },
  twitter: {
    card: "summary_large_image",
    title: "Athora",
    description:
      "AI-powered study assistant that helps students pass exams faster.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full font-sans antialiased">
        <ErrorBoundary>
          <TooltipProvider>
            <AuthProvider>
              {children}
              <ToastContainer />
            </AuthProvider>
          </TooltipProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
