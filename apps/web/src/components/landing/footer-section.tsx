export function FooterSection() {
  return (
    <footer className="px-6 py-12 border-t border-white/[0.1]">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src="/images/logo.png" alt="Athora" width={28} height={28} className="h-7 w-7 rounded-lg" />
              <span className="font-semibold text-white">Athora</span>
            </div>
            <p className="mt-3 text-sm text-white/50">Made for students, by students.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-white/40">Product</p>
            <ul className="mt-3 space-y-2">
              <li><a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-white/40">Legal</p>
            <ul className="mt-3 space-y-2">
              <li><a href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">Privacy</a></li>
              <li><a href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/[0.08] pt-6 text-center">
          <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} Athora. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
