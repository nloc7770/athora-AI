'use client'

import { useEffect, useRef } from 'react'

const COLORS = ['#8052ff', '#ffb829', '#15846e', '#ffffff']
const SHAPES = ['circle', 'triangle', 'diamond', 'square'] as const

interface Particle {
  x: number
  y: number
  size: number
  color: string
  shape: typeof SHAPES[number]
  vx: number
  vy: number
  opacity: number
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save()
  ctx.globalAlpha = p.opacity
  ctx.fillStyle = p.color
  ctx.translate(p.x, p.y)

  switch (p.shape) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, p.size, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(0, -p.size)
      ctx.lineTo(p.size * 0.87, p.size * 0.5)
      ctx.lineTo(-p.size * 0.87, p.size * 0.5)
      ctx.closePath()
      ctx.fill()
      break
    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(0, -p.size)
      ctx.lineTo(p.size * 0.7, 0)
      ctx.lineTo(0, p.size)
      ctx.lineTo(-p.size * 0.7, 0)
      ctx.closePath()
      ctx.fill()
      break
    case 'square':
      ctx.fillRect(-p.size * 0.7, -p.size * 0.7, p.size * 1.4, p.size * 1.4)
      break
  }

  ctx.restore()
}

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const animRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()

    // Generate particles — cluster toward right half
    const count = Math.min(300, Math.floor(window.innerWidth * 0.2))
    const w = canvas.getBoundingClientRect().width
    const h = canvas.getBoundingClientRect().height

    particles.current = Array.from({ length: count }, () => {
      const biasX = 0.4 + Math.random() * 0.6 // bias right
      const biasY = 0.1 + Math.random() * 0.8
      return {
        x: biasX * w,
        y: biasY * h,
        size: 1.5 + Math.random() * 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.1,
        opacity: 0.15 + Math.random() * 0.5,
      }
    })

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      for (const p of particles.current) {
        p.x += p.vx
        p.y += p.vy

        // Soft wrap
        if (p.x < -10) p.x = rect.width + 10
        if (p.x > rect.width + 10) p.x = -10
        if (p.y < -10) p.y = rect.height + 10
        if (p.y > rect.height + 10) p.y = -10

        drawParticle(ctx, p)
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
