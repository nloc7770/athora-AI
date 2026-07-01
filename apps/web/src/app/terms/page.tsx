import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Athora.',
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-stone-500">Last updated: June 24, 2026</p>

      <div className="mt-10 space-y-10 text-stone-700 leading-relaxed text-[15px]">
        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">1. Acceptable Use</h2>
          <p>By using Athora you agree to:</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>Upload only materials you own or have permission to use.</li>
            <li>Not share AI-generated content in ways that violate academic integrity policies.</li>
            <li>Not attempt to reverse-engineer, scrape, or overload our systems.</li>
            <li>Not upload illegal, harmful, or infringing content.</li>
            <li>Not use the service to generate content for others in exchange for payment without written permission.</li>
          </ul>
          <p className="mt-3">
            We reserve the right to suspend accounts that violate these terms without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">2. Subscription Terms</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Free tier: limited features, no payment required.</li>
            <li>Pro plan: billed monthly or annually via Stripe. Prices may change with 30 days notice.</li>
            <li>You may cancel at any time; access continues until the end of the billing period.</li>
            <li>Refunds are available within 14 days of initial purchase if no substantial usage occurred.</li>
            <li>We may modify plan features with reasonable notice. Material downgrades entitle you to cancel without penalty.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">3. AI Content Disclaimer</h2>
          <p>
            Athora uses AI to generate study materials including flashcards, quizzes, summaries,
            and chat responses. While we strive for accuracy:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>AI-generated content may contain errors, omissions, or misinterpretations.</li>
            <li>Generated content should not replace professional advice (medical, legal, financial).</li>
            <li>Always verify AI outputs against your original source materials and instructor guidance.</li>
            <li>We do not guarantee that AI-generated study materials will lead to specific academic outcomes.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">4. Intellectual Property</h2>
          <p>
            You retain ownership of all content you upload. By uploading, you grant Athora a
            limited license to process your content solely for providing the service. AI-generated
            outputs derived from your materials belong to you. Athora&apos;s branding, UI, and
            proprietary technology remain our property.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">5. Limitation of Liability</h2>
          <p>
            Athora is provided &quot;as is&quot; without warranty of any kind. To the maximum extent
            permitted by law:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>We are not liable for academic outcomes, lost data, or service interruptions.</li>
            <li>Our total liability is limited to the amount you paid in the 12 months preceding the claim.</li>
            <li>We are not responsible for third-party service failures (hosting, AI providers, payment processors).</li>
            <li>You acknowledge that AI-generated content may be inaccurate and use it at your own risk.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">6. Account Termination</h2>
          <p>
            We may terminate or suspend your account for violation of these terms. Upon
            termination, you may request export of your uploaded materials within 30 days.
            After 30 days, data is permanently deleted per our{' '}
            <a href="/privacy" className="text-purple-700 underline hover:text-purple-900">
              Privacy Policy
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">7. Changes to Terms</h2>
          <p>
            We may update these terms with 30 days notice via email or in-app notification.
            Continued use after the notice period constitutes acceptance. Material changes
            (pricing, data use) require explicit consent.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">8. Governing Law</h2>
          <p>
            These terms are governed by the laws of the State of California, United States.
            Disputes will be resolved through binding arbitration unless prohibited by local law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900 mb-3">9. Contact</h2>
          <p>
            Questions about these terms? Email{' '}
            <a href="mailto:legal@athora.app" className="text-purple-700 underline hover:text-purple-900">
              legal@athora.app
            </a>.
          </p>
        </section>
      </div>
    </main>
  )
}
