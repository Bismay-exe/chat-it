import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const CACHE_KEY = 'chat-it-avatar-cache';

// Load initial cache from localStorage (which URLs we've seen before)
const getInitialCache = (): Set<string> => {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
};

// Module-level set of URLs that are already in the browser HTTP image cache
const loadedAvatars = getInitialCache();

/**
 * Pre-warm the browser's HTTP image cache for a batch of avatar URLs.
 * Call this when chat list data loads so all avatars are cached before
 * the user opens any individual chat. Images load from disk = instant.
 */
export const preloadAvatarBatch = (urls: (string | null | undefined)[]) => {
  urls.forEach(url => {
    if (!url || loadedAvatars.has(url)) return;
    // Create off-screen image to trigger browser HTTP cache population
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      loadedAvatars.add(url);
      // Persist so next app session knows these are cached
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(loadedAvatars)));
      } catch { /* quota exceeded */ }
    };
  });
};

export const Avatar: React.FC<AvatarProps> = ({ src, fallback, size = 'md', className, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(() => src ? loadedAvatars.has(src) : false);

  const sizeClasses = {
    sm: 'w-13 h-13 text-xs',
    md: 'w-16 h-16 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const handleLoad = () => {
    setIsLoaded(true);
    if (src && !loadedAvatars.has(src)) {
      loadedAvatars.add(src);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(loadedAvatars)));
      } catch { /* quota exceeded */ }
    }
  };

  // Re-evaluate when src changes
  useEffect(() => {
    if (src) setIsLoaded(loadedAvatars.has(src));
  }, [src]);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl shadow-lg overflow-hidden bg-muted/20 backdrop-blur-xl border border-black/10 shrink-0 opacity-100',
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
          loading="eager"
          decoding="async"
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
