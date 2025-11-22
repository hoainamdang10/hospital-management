import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
      default: 'bg-primary text-white',
      secondary: 'bg-gray-100 text-gray-700 border border-gray-200',
      outline: 'border border-gray-300 text-gray-700',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';
