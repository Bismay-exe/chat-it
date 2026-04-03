import React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar: React.FC<AvatarProps> = ({ src, fallback, size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'w-13 h-13 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl overflow-hidden bg-muted/20 border border-black/10 shrink-0',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={fallback || 'Avatar'}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="font-medium text-muted-foreground uppercase flex items-center justify-center">
          {fallback ? fallback.slice(0, 2) : <User className="w-1/2 h-1/2" />}
        </span>
      )}
    </div>
  );
};
