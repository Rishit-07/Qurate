import React from 'react'

/**
 * React Component Composition: Compound Card Component
 * Uses containment (children prop) and sub-components (Card.Header, Card.Body, Card.Footer)
 * to provide a flexible and composable card interface.
 */
export function Card({ children, className = '', hoverable = true, ...props }) {
  const baseClasses = 'rounded-2xl border border-[#1A1A18]/10 bg-white p-6 shadow-[0_4px_20px_rgba(26,26,24,0.03)] transition-all duration-300'
  const hoverClasses = hoverable ? 'hover:-translate-y-0.5 hover:border-[#2D6A4F]/30 hover:shadow-[0_12px_32px_rgba(26,26,24,0.08)]' : ''

  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} {...props}>
      {children}
    </div>
  )
}

Card.Header = function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`mb-4 flex items-center justify-between border-b border-[#1A1A18]/6 pb-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

Card.Body = function CardBody({ children, className = '', ...props }) {
  return (
    <div className={`space-y-3 ${className}`} {...props}>
      {children}
    </div>
  )
}

Card.Footer = function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={`mt-5 flex items-center justify-between border-t border-[#1A1A18]/6 pt-4 text-xs text-[#1A1A18]/60 ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card
