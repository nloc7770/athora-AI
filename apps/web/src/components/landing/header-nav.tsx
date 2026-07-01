'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { NavAuthSection, MobileNavAuthSection } from './nav-auth-section'

export function HeaderNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/[0.06]">
      <nav aria-label="Main navigation">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo.png" alt="Athora" width={28} height={28} className="h-7 w-7 rounded-lg" />
            <span className="text-lg font-semibold tracking-tight text-white">Athora</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-[#9a9a9a] hover:text-white transition-colors tracking-[0.021em]">Features</a>
            <a href="#pricing" className="text-sm text-[#9a9a9a] hover:text-white transition-colors tracking-[0.021em]">Pricing</a>
            <a href="#testimonials" className="text-sm text-[#9a9a9a] hover:text-white transition-colors tracking-[0.021em]">Reviews</a>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <NavAuthSection />
          </div>
          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-white/[0.06] bg-black px-6 py-4 md:hidden">
            <div className="space-y-3">
              <a href="#features" className="block text-sm text-[#bdbdbd]">Features</a>
              <a href="#pricing" className="block text-sm text-[#bdbdbd]">Pricing</a>
              <div className="flex items-center gap-3 pt-2">
                <MobileNavAuthSection />
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
