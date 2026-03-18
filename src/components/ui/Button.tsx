import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90 shadow-lg shadow-violet-200 dark:shadow-violet-900/30':
            variant === 'primary',
          'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800':
            variant === 'ghost',
          'bg-gradient-to-r from-red-500 to-rose-500 text-white hover:opacity-90':
            variant === 'danger',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-6 py-3 text-base': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
