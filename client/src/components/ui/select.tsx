import * as React from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-md border border-[#3730A3]/15 px-3.5 py-2.5 text-sm text-[#111827] bg-white',
            'focus:outline-none focus:border-[#3730A3]/60 focus:ring-2 focus:ring-[#3730A3]/15',
            'disabled:bg-[#F8F7FF] disabled:cursor-not-allowed transition-all duration-150',
            error && 'border-[#DC2626]',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-[#DC2626]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
