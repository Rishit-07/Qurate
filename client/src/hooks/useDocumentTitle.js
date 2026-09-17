import { useEffect } from 'react'

/**
 * Side effects with useEffect: useDocumentTitle
 * Synchronizes the HTML document title with the current page view,
 * and restores the original title when the component unmounts.
 */
export function useDocumentTitle(title, retainOnUnmount = false) {
  useEffect(() => {
    const previousTitle = document.title
    if (title) {
      document.title = `${title} — Qurate`
    }

    return () => {
      if (!retainOnUnmount) {
        document.title = previousTitle
      }
    }
  }, [title, retainOnUnmount])
}

export default useDocumentTitle
