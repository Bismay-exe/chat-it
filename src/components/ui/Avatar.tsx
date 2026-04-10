import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const CACHE_KEY = 'chat-it-avatar-cache';

// Load initial cache from localStorage
const getInitialCache = (): Set<string> => {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
};

const loadedAvatars = getInitialCache();

export const Avatar: React.FC<AvatarProps> = ({ src, fallback, size = 'md', className, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(() => src ? loadedAvatars.has(src) : false);

  const sizeClasses = {
    sm: 'w-13 h-13 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const handleLoad = () => {
    if (src && !loadedAvatars.has(src)) {
      loadedAvatars.add(src);
      setIsLoaded(true);
      // Persist update in background
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(loadedAvatars)));
      } catch (e) {
        console.warn('Failed to persist avatar cache', e);
      }
    } else {
      setIsLoaded(true);
    }
  };

  // If the src changes, re-evaluate isLoaded from the cache
  useEffect(() => {
    if (src) {
      const alreadyLoaded = loadedAvatars.has(src);
      setIsLoaded(alreadyLoaded);
    }
  }, [src]);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl overflow-hidden bg-muted/20 border border-black/10 shrink-0 opacity-100',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && (
        <img
          src={src}
          alt={fallback || 'Avatar'}
          onLoad={handleLoad}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      
      {!isLoaded && (
        <span className="font-medium text-muted-foreground uppercase flex items-center justify-center absolute inset-0 w-full h-full">
          {fallback ? fallback.slice(0, 2) : <User className="w-1/2 h-1/2" />}
        </span>
      )}
    </div>
  );
};
