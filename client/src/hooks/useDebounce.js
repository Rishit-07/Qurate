import { useEffect, useState } from 'react'

/**
 * Side effects with useEffect: useDebounce
 * Delays updating the debounced value until after delay milliseconds have passed.
 * Demonstrates cleanup function to prevent memory leaks and outdated state updates.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Schedule the side effect
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up timer if value or delay changes before timeout fires
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default useDebounce
