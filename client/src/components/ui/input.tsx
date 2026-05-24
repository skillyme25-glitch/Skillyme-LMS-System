import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-md border border-[#3730A3]/15 px-3.5 py-2.5 text-sm text-[#111827] bg-white',
            'placeholder:text-[#9CA3AF]',
            'focus:outline-none focus:border-[#3730A3]/60 focus:ring-2 focus:ring-[#3730A3]/15',
            'disabled:bg-[#F8F7FF] disabled:text-[#6B7280] disabled:cursor-not-allowed',
            'transition-all duration-150',
            error && 'border-[#DC2626] focus:ring-[#DC2626]/15',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
        {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-md border border-[#3730A3]/15 px-3.5 py-2.5 text-sm text-[#111827] bg-white',
            'placeholder:text-[#9CA3AF] resize-none',
            'focus:outline-none focus:border-[#3730A3]/60 focus:ring-2 focus:ring-[#3730A3]/15',
            'transition-all duration-150',
            error && 'border-[#DC2626]',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
        {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
