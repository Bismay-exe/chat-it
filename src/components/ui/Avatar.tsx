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
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden bg-muted shrink-0',
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
