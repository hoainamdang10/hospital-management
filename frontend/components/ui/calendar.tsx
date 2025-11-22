import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CalendarProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// Simplified calendar stub using native date input to unblock build
export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <input
      type="date"
      className={cn(
        'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
        className
      )}
      {...props}
    />
  );
}
