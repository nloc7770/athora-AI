import { FadeUp } from './fade-up'

export function MobileAppSection() {
  return (
    <section className="px-6 py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ff7a3c]/10 via-transparent to-transparent" />
      <div className="mx-auto max-w-[1200px] relative">
        <FadeUp>
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ff7a3c]/20 border border-[#ff7a3c]/40 px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff7a3c] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff7a3c]" />
              </span>
              <span className="text-xs font-semibold text-[#ffab81] uppercase tracking-[0.05em]">Coming Soon</span>
            </div>
            <h2
              className="text-3xl font-extralight tracking-tight md:text-5xl lg:text-6xl text-balance text-[#f3f3fb]"
              style={{ letterSpacing: '-0.04em' }}
            >
              Study anywhere with the <span className="text-[#ff7a3c]">Nrop-on app</span>
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#9a9ab6] tracking-[0.025em]">
              Flashcards on the bus. Exams during lunch break. Your AI tutor in your pocket. Available soon on iOS and Android.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
              <button className="inline-flex items-center gap-3 rounded-full border border-[#36364c] bg-[#181822] px-6 py-3.5 text-[#f3f3fb] transition hover:border-[#ff7a3c]/50 hover:bg-[#ff7a3c]/10">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.99 2.97 12.5 4.7 9.48C5.57 7.97 7.13 7.01 8.82 6.99C10.1 6.97 11.32 7.87 12.11 7.87C12.89 7.87 14.37 6.78 15.92 6.95C16.57 6.98 18.39 7.21 19.56 8.91C19.47 8.97 17.39 10.16 17.41 12.69C17.44 15.73 20.06 16.73 20.09 16.74C20.06 16.81 19.67 18.17 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/></svg>
                <div className="text-left">
                  <p className="text-[10px] leading-none text-[#9a9ab6]">Download on the</p>
                  <p className="text-sm font-semibold leading-tight text-[#f3f3fb]">App Store</p>
                </div>
              </button>
              <button className="inline-flex items-center gap-3 rounded-full border border-[#36364c] bg-[#181822] px-6 py-3.5 text-[#f3f3fb] transition hover:border-[#ff7a3c]/50 hover:bg-[#ff7a3c]/10">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z"/></svg>
                <div className="text-left">
                  <p className="text-[10px] leading-none text-[#9a9ab6]">Get it on</p>
                  <p className="text-sm font-semibold leading-tight text-[#f3f3fb]">Google Play</p>
                </div>
              </button>
            </div>

            <p className="mt-6 text-xs text-[#9a9ab6]">Join 2,000+ students on the waitlist</p>

            {/* Phone mockup */}
            <div className="mt-12 flex items-center justify-center gap-4">
              <div className="relative w-48 h-96 rounded-[2.5rem] border-[6px] border-[#36364c] bg-gradient-to-b from-[#ff7a3c]/10 to-[#0e0e16] overflow-hidden shadow-[0_0_60px_rgba(255,122,60,0.15)]">
                <div className="absolute top-0 inset-x-0 h-6 flex justify-center">
                  <div className="w-20 h-4 bg-[#0e0e16] rounded-b-xl border-b border-[#ffffff14]" />
                </div>
                <div className="mt-10 px-3 space-y-2">
                  <div className="h-3 w-16 rounded bg-[#ff7a3c]/30" />
                  <div className="h-6 w-32 rounded bg-[#36364c]" />
                  <div className="mt-4 rounded-xl bg-[#ff7a3c]/15 p-3 border border-[#ff7a3c]/30">
                    <div className="h-3 w-full rounded bg-[#ff7a3c]/30" />
                    <div className="mt-2 h-3 w-3/4 rounded bg-[#ff7a3c]/20" />
                  </div>
                  <div className="rounded-xl bg-[#181822] p-3 border border-[#ffffff14]">
                    <div className="h-3 w-full rounded bg-[#36364c]" />
                    <div className="mt-2 h-3 w-2/3 rounded bg-[#22222e]" />
                  </div>
                  <div className="rounded-xl bg-[#181822] p-3 border border-[#ffffff14]">
                    <div className="h-3 w-full rounded bg-[#36364c]" />
                    <div className="mt-2 h-3 w-5/6 rounded bg-[#22222e]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
