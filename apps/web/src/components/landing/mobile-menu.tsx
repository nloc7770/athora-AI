'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function MobileMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <button
        className="md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 border-t border-[#ffffff14] bg-[#0e0e16] px-6 py-4 md:hidden">
          <div className="space-y-3">
            <a href="#features" className="block text-sm text-[#c0c0da]">Features</a>
            <a href="#pricing" className="block text-sm text-[#c0c0da]">Pricing</a>
            <div className="flex items-center gap-3 pt-2">
              <Link href="/login" className="text-sm text-[#9a9ab6] font-medium">Log in</Link>
              <Link href="/register">
                <Button size="sm" className="flex-1 bg-[#ff7a3c] text-[#1a1400] rounded-full">
                  Get Started <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
