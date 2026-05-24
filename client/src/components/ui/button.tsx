import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:   'bg-[#3730A3] text-white hover:bg-[#2E27A3] shadow-sm active:scale-[0.98]',
  gold:      'bg-[#F59E0B] text-[#111827] font-bold hover:bg-[#D97706] shadow-sm active:scale-[0.98]',
  secondary: 'bg-[#EEF2FF] text-[#3730A3] hover:bg-[#E0E7FF] active:scale-[0.98]',
  danger:    'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm active:scale-[0.98]',
  ghost:     'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] active:scale-[0.98]',
  outline:   'border border-[#3730A3]/20 bg-white text-[#3730A3] hover:bg-[#EEF2FF] hover:border-[#3730A3]/40 active:scale-[0.98]',
};

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-all duration-150 rounded-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3730A3] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
