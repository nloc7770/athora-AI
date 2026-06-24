import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Athora collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: June 24, 2026</p>

      <div className="mt-10 space-y-10 text-stone-700 leading-relaxed text-[15px]">
        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">1. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Account information: email address, hashed password, display name.</li>
            <li>Uploaded documents: PDFs, slides, notes, and audio files you provide for processing.</li>
            <li>Generated content: flashcards, quizzes, summaries, and chat history created from your materials.</li>
            <li>Usage data: pages visited, features used, timestamps, and device/browser metadata.</li>
            <li>Payment information: processed by Stripe; we never store full card numbers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">2. AI Processing</h2>
          <p>
            Your uploaded documents are processed by AI models to generate study materials.
            Document content is sent to our AI providers solely for the purpose of generating
            flashcards, quizzes, summaries, and chat responses. We do not use your content to
            train AI models. AI-generated outputs may contain inaccuracies and should be verified
            against your source materials.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">3. Third-Party Services</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Supabase</strong> — authentication and database hosting.</li>
            <li><strong>OpenAI / Anthropic</strong> — AI processing for document understanding and content generation.</li>
            <li><strong>Stripe</strong> — payment processing.</li>
            <li><strong>Vercel</strong> — application hosting and analytics.</li>
          </ul>
          <p className="mt-3">
            Each provider processes data under their own privacy policies and data processing agreements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">4. Data Retention</h2>
          <p>
            We retain your account data and uploaded materials for as long as your account is active.
            Generated study materials are kept until you delete them or close your account.
            Usage analytics are retained in anonymized form for up to 24 months.
            Backups containing your data are purged within 30 days of account deletion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">5. Your Rights (GDPR)</h2>
          <p>If you are in the EEA/UK, you have the right to:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Access a copy of all personal data we hold about you.</li>
            <li>Rectify inaccurate data.</li>
            <li>Erase your data (&quot;right to be forgotten&quot;).</li>
            <li>Restrict or object to processing.</li>
            <li>Data portability — export your materials in standard formats.</li>
            <li>Withdraw consent at any time without affecting prior processing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">6. FERPA Compliance</h2>
          <p>
            Athora does not act as a school official or agent. We do not access institutional
            education records. If your institution provides materials through Athora, data handling
            is governed by the agreement between Athora and the institution. Students control their
            own uploaded content at all times.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">7. Deletion Requests</h2>
          <p>
            You may delete your account and all associated data at any time from your account
            settings. Alternatively, email{' '}
            <a href="mailto:privacy@athora.app" className="text-amber-700 underline hover:text-amber-900">
              privacy@athora.app
            </a>{' '}
            and we will process your request within 30 days. Deletion is permanent and
            irreversible.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">8. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management. Optional analytics
            cookies help us improve the product. You can manage cookie preferences via the banner
            shown on first visit or in your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">9. Contact</h2>
          <p>
            For privacy questions or to exercise your rights, contact us at{' '}
            <a href="mailto:privacy@athora.app" className="text-amber-700 underline hover:text-amber-900">
              privacy@athora.app
            </a>.
          </p>
        </section>
      </div>
    </main>
  )
}
