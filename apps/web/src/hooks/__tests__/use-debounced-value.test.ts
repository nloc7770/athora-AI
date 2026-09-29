import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebouncedValue } from '../use-debounced-value'

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a'))
    expect(result.current).toBe('a')
  })

  it('only settles on the last value after the delay', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 250), {
      initialProps: { v: 'a' },
    })

    rerender({ v: 'ab' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ v: 'abc' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(50))
    expect(result.current).toBe('abc')
  })
})
