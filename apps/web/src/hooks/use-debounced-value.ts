'use client'

import { useEffect, useState } from 'react'

/**
 * Returns `value` once it has stopped changing for `delayMs`. Keep the input
 * itself bound to the live value and feed only the filter/fetch from this, so
 * typing stays responsive. Not for the chat composer.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
