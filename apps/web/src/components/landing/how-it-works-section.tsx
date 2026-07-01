import { FileText, Check } from 'lucide-react'
import { FadeUp } from './fade-up'

export function HowItWorksSection() {
  return (
    <section className="px-6 py-24 md:py-32 border-y border-white/[0.06]">
      <div className="mx-auto max-w-[1200px]">
        <FadeUp className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#8052ff] mb-3">How it works</p>
          <h2 className="text-3xl font-extralight tracking-tight md:text-5xl text-white" style={{ letterSpacing: '-0.04em' }}>
            3 steps to better grades
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-[#8052ff]/40 via-[#8052ff]/60 to-[#8052ff]/40" />

          {/* Step 1 */}
          <FadeUp className="text-center relative">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8052ff]/20 text-[#8052ff] text-xl font-bold border border-[#8052ff]/50 relative z-10">
              1
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Upload your materials</h3>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
              Drop PDFs, lecture slides, textbooks, or notes. Any format, any subject, any language.
            </p>
            <div className="mt-4 rounded-2xl border border-white/[0.15] bg-white/[0.04] p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#8052ff]/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#8052ff]" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-white">Chapter_5_Biology.pdf</p>
                  <p className="text-xs text-[#9a9a9a]">2.4 MB • Uploaded</p>
                </div>
                <Check className="h-4 w-4 text-[#15846e] ml-auto" />
              </div>
            </div>
          </FadeUp>

          {/* Step 2 */}
          <FadeUp delay={0.1} className="text-center relative">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8052ff]/20 text-[#8052ff] text-xl font-bold border border-[#8052ff]/50 relative z-10">
              2
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI reads & understands</h3>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
              Athora parses, chunks, and indexes your content. Creates a personal knowledge base in seconds.
            </p>
            <div className="mt-4 rounded-2xl border border-white/[0.15] bg-white/[0.04] p-4">
              <div className="space-y-2">
                {['Summary generated', '24 flashcards created', 'Exam questions ready', 'Mind map built'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#15846e]" />
                    <span className="text-xs text-[#bdbdbd]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Step 3 */}
          <FadeUp delay={0.2} className="text-center relative">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8052ff]/20 text-[#8052ff] text-xl font-bold border border-[#8052ff]/50 relative z-10">
              3
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Study & ace your exam</h3>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto">
              Chat with your docs, review flashcards, take practice exams. All grounded in YOUR materials.
            </p>
            <div className="mt-4 rounded-2xl border border-white/[0.15] bg-white/[0.04] p-4">
              <div className="space-y-2">
                <div className="rounded-xl bg-[#8052ff]/10 px-3 py-2">
                  <p className="text-xs font-medium text-white">"Explain mitosis in simple terms"</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] px-3 py-2">
                  <p className="text-xs text-[#bdbdbd]">Based on your Chapter 5 notes: Mitosis is cell division in 4 phases...</p>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
