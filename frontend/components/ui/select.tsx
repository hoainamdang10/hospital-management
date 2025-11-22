import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'focus:ring-primary focus:border-primary w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return (
    <option className={cn('text-sm', className)} {...props}>
      {children}
    </option>
  );
}

// Shadcn-compatible aliases (simple wrappers for this stub)
export const SelectTrigger = Select;
export const SelectValue = ({ placeholder }: { placeholder?: string; defaultValue?: string }) => (
  <span>{placeholder}</span>
);
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectLabel = ({ children }: { children: React.ReactNode }) => <>{children}</>;
