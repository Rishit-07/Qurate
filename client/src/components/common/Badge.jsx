import React from 'react'

/**
 * React Component Composition: Variant-driven Badge
 * Reusable composite badge that supports different semantic states and children.
 */
export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  ...props
}) {
  const variantStyles = {
    beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    intermediate: 'bg-amber-50 text-amber-700 border-amber-200/60',
    advanced: 'bg-purple-50 text-purple-700 border-purple-200/60',
    success: 'bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/25',
    warning: 'bg-amber-50 text-amber-800 border-amber-300/50',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-[#1A1A18]/5 text-[#1A1A18]/70 border-[#1A1A18]/10',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  }

  const selectedVariant = variantStyles[variant.toLowerCase()] || variantStyles.neutral
  const selectedSize = sizeStyles[size] || sizeStyles.md

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
