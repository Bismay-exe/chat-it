import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
}

export const Badge: React.FC<BadgeProps> = ({ count, className, ...props }) => {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-1.5 py-0.5 min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold leading-none',
        className
      )}
      {...props}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
