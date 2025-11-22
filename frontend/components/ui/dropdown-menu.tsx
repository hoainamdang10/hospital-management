import * as React from 'react';
import { cn } from '@/lib/utils';

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block">{children}</div>;
}

export function DropdownMenuTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn('inline-flex items-center', className)} {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-gray-50', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Additional helpers for compatibility
export function DropdownMenuLabel({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-3 py-2 text-xs font-semibold text-gray-500', className)} {...props}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-gray-200" />;
}
