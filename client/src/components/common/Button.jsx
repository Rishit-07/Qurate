import React from 'react'

/**
 * React Component Composition: Button Component
 * Encapsulates variants, sizes, icon slots, and loading states through prop composition.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon = null,
  rightIcon = null,
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const variantStyles = {
    primary: 'bg-[#2D6A4F] text-white hover:bg-[#22543d] active:scale-[0.98] shadow-sm',
    secondary: 'bg-white text-[#1A1A18] border border-[#1A1A18]/15 hover:bg-[#F7F5F0] hover:border-[#1A1A18]/30',
    outline: 'bg-transparent text-[#2D6A4F] border border-[#2D6A4F]/30 hover:bg-[#2D6A4F]/10',
    ghost: 'bg-transparent text-[#1A1A18]/75 hover:bg-[#1A1A18]/5 hover:text-[#1A1A18]',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
  }

  const sizeStyles = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant] || variantStyles.primary} ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  )
}

export default Button
