'use client'

import { useRef, useState, useCallback, type TouchEvent } from 'react'

type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null

interface SwipeState {
  offsetX: number
  offsetY: number
  isSwiping: boolean
}

interface UseSwipeOptions {
  threshold?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

interface UseSwipeReturn {
  swipeState: SwipeState
  handlers: {
    onTouchStart: (e: TouchEvent) => void
    onTouchMove: (e: TouchEvent) => void
    onTouchEnd: (e: TouchEvent) => void
  }
}

export function useSwipe(options: UseSwipeOptions = {}): UseSwipeReturn {
  const { threshold = 50, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = options

  const startX = useRef(0)
  const startY = useRef(0)
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null)

  const [swipeState, setSwipeState] = useState<SwipeState>({
    offsetX: 0,
    offsetY: 0,
    isSwiping: false,
  })

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
    directionLocked.current = null
    setSwipeState({ offsetX: 0, offsetY: 0, isSwiping: true })
  }, [])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!swipeState.isSwiping && startX.current === 0) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - startX.current
    const deltaY = touch.clientY - startY.current

    // Lock direction after 10px of movement
    if (!directionLocked.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      directionLocked.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
    }

    // Prevent vertical scroll during horizontal swipe
    if (directionLocked.current === 'horizontal') {
      e.preventDefault()
    }

    setSwipeState({
      offsetX: directionLocked.current === 'vertical' ? 0 : deltaX,
      offsetY: directionLocked.current === 'horizontal' ? 0 : deltaY,
      isSwiping: true,
    })
  }, [swipeState.isSwiping])

  const onTouchEnd = useCallback(() => {
    const { offsetX, offsetY } = swipeState
    const direction = directionLocked.current

    let detected: SwipeDirection = null

    if (direction === 'horizontal') {
      if (offsetX < -threshold) detected = 'left'
      else if (offsetX > threshold) detected = 'right'
    } else if (direction === 'vertical') {
      if (offsetY < -threshold) detected = 'up'
      else if (offsetY > threshold) detected = 'down'
    }

    if (detected === 'left') onSwipeLeft?.()
    else if (detected === 'right') onSwipeRight?.()
    else if (detected === 'up') onSwipeUp?.()
    else if (detected === 'down') onSwipeDown?.()

    setSwipeState({ offsetX: 0, offsetY: 0, isSwiping: false })
    directionLocked.current = null
  }, [swipeState, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return {
    swipeState,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  }
}
