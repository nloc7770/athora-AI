import Image from 'next/image'

export function FooterSection() {
  return (
    <footer className="px-6 py-12 border-t border-[#ffffff14]">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/images/logo.png" alt="Nrop-on" width={28} height={28} className="h-7 w-7 rounded-lg" />
              <span className="font-semibold text-[#f3f3fb]">Nrop-on</span>
            </div>
            <p className="mt-3 text-sm text-[#9a9ab6]">Made for students, by students.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#9a9ab6]">Product</p>
            <ul className="mt-3 space-y-2">
              <li><a href="#features" className="text-sm text-[#9a9ab6] hover:text-[#f3f3fb] transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-sm text-[#9a9ab6] hover:text-[#f3f3fb] transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#9a9ab6]">Legal</p>
            <ul className="mt-3 space-y-2">
              <li><a href="/privacy" className="text-sm text-[#9a9ab6] hover:text-[#f3f3fb] transition-colors">Privacy</a></li>
              <li><a href="/terms" className="text-sm text-[#9a9ab6] hover:text-[#f3f3fb] transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-[#ffffff14] pt-6 text-center">
          <p className="text-xs text-[#9a9ab6]">&copy; {new Date().getFullYear()} Nrop-on. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
