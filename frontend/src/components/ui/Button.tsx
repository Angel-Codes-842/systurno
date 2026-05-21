import React from 'react'
import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {

    const base =
      'inline-flex items-center justify-center gap-2.5 font-bold rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] shrink-0 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

    const variants: Record<string, string> = {
      primary:   'bg-primary text-white hover:bg-[#0ea5c9] shadow-sm',
      secondary: 'bg-surface border border-border-2 text-text hover:bg-surface-2 hover:border-border',
      ghost:     'bg-transparent text-text-muted hover:text-text hover:bg-surface-2',
      danger:    'bg-surface border border-canceled/30 text-canceled hover:bg-canceled/10',
      success:   'bg-attended text-white hover:bg-[#16a34a] shadow-sm',
    }

    const sizes: Record<string, string> = {
      sm: 'px-6 py-2.5 text-[13px] min-h-[42px]',
      md: 'px-8 py-3 text-[14px] min-h-[50px]',
      lg: 'px-10 py-4 text-[16px] min-h-[60px]',
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
