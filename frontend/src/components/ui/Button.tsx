import React from 'react'
import type { ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning_outline' | 'danger'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'default', children, ...props }, ref) => {
    
    // Clases base basadas directamente en el CSS de Uiverse (e-coders)
    const baseStyles = 'shrink-0 inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform active:shadow-none active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 tracking-wide'
    
    // Variantes aplicando la lógica the Uiverse: border grueso transparente -> fondo macizo en hover con traducción
    const variants = {
      primary: 'bg-transparent border-[2.5px] border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white hover:shadow-[0_8px_15px_rgba(30,58,95,0.3)] hover:-translate-y-[2px]',
      secondary: 'bg-transparent border-[2.5px] border-[#1A1A1A] text-[#3B3B3B] hover:bg-[#1A1A1A] hover:text-white hover:shadow-[0_8px_15px_rgba(0,0,0,0.25)] hover:-translate-y-[2px]',
      success: 'bg-transparent border-[2.5px] border-[#6b9b37] text-[#6b9b37] hover:bg-[#6b9b37] hover:text-white hover:shadow-[0_8px_15px_rgba(107,155,55,0.3)] hover:-translate-y-[2px]',
      warning_outline: 'bg-transparent border-[2.5px] border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white hover:shadow-[0_8px_15px_rgba(249,115,22,0.3)] hover:-translate-y-[2px]',
      danger: 'bg-transparent border-[2.5px] border-red-500 text-red-600 hover:bg-red-500 hover:text-white hover:shadow-[0_8px_15px_rgba(239,68,68,0.3)] hover:-translate-y-[2px]',
    }

    // Tamaños proporcionados para un dashboard (conservando el espíritu Uiverse pero sin ser gigantes)
    const sizes = {
      default: 'min-h-[44px] px-6 py-2.5 text-[15px]',
      sm: 'min-h-[36px] px-4 py-1.5 text-[13px]',
      lg: 'min-h-[54px] px-8 py-3.5 text-base',
      icon: 'min-h-[44px] w-[44px] p-0 rounded-full',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
