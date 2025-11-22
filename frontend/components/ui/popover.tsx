import * as React from 'react';

export function Popover({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block">{children}</div>;
}

export function PopoverTrigger({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="inline-flex items-center" {...props}>
      {children}
    </button>
  );
}

export function PopoverContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`absolute z-50 mt-2 rounded-md border border-gray-200 bg-white p-2 shadow-lg ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
