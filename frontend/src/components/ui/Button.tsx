import React from 'react'
import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {

    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shrink-0'

    const variants: Record<string, string> = {
      primary:   'bg-[#00b4d8] text-[#0f1c2e] hover:bg-[#0ea5c9] shadow-lg shadow-[#00b4d8]/20',
      secondary: 'bg-transparent border border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] hover:text-white',
      ghost:     'bg-transparent text-[#94a3b8] hover:bg-[#1e293b] hover:text-white',
      danger:    'bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10',
      success:   'bg-[#22c55e] text-white hover:bg-[#16a34a] shadow-lg shadow-[#22c55e]/20',
    }

    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-sm',
    }

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
