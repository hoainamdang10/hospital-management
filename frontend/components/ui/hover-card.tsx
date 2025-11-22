import * as React from 'react';

export function HoverCard({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block">{children}</div>;
}

export function HoverCardTrigger({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="inline-flex items-center" {...props}>
      {children}
    </div>
  );
}

export function HoverCardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`absolute z-50 mt-2 rounded-md border border-gray-200 bg-white p-3 shadow-lg ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
