import React, { useEffect } from 'react'

/**
 * React Component Composition: Compound Modal Component
 * Demonstrates:
 * 1. Component Composition (children containment, Header, Body, Footer)
 * 2. Side effects with useEffect (Escape key listener + cleanup)
 */
export function Modal({ isOpen, onClose, children, maxWidth = 'max-w-2xl', className = '' }) {
  // Side effect: Handle keyboard Escape key to close modal + proper cleanup
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Clean up event listener and restore body scroll on unmount / close
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1A1A18]/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} rounded-2xl border border-[#1A1A18]/10 bg-[#FBF9F5] shadow-2xl overflow-hidden transition-all transform animate-scaleUp ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

Modal.Header = function ModalHeader({ children, onClose, className = '' }) {
  return (
    <div className={`flex items-center justify-between border-b border-[#1A1A18]/10 px-6 py-4 bg-white/80 ${className}`}>
      <div className="font-semibold text-lg text-[#1A1A18]">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-[#1A1A18]/50 hover:bg-[#1A1A18]/5 hover:text-[#1A1A18] transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

Modal.Body = function ModalBody({ children, className = '' }) {
  return (
    <div className={`px-6 py-5 max-h-[75vh] overflow-y-auto space-y-4 ${className}`}>
      {children}
    </div>
  )
}

Modal.Footer = function ModalFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-end gap-3 border-t border-[#1A1A18]/10 px-6 py-4 bg-[#F7F5F0]/80 ${className}`}>
      {children}
    </div>
  )
}

export default Modal
