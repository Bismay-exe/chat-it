import React, { useState, useRef, useEffect, type UIEvent } from 'react';
import { cn } from '@/lib/utils';

interface GradualScrollProps {
  children: React.ReactNode;
  className?: string; // For the outer wrapper
  scrollClassName?: string; // For the scrollable div
  showGradients?: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * GradualScroll provides dynamic top/bottom fading gradients 
 * based on scroll position, exactly like modern premium list interfaces.
 */
export const GradualScroll: React.FC<GradualScrollProps> = ({ 
  children, 
  className, 
  scrollClassName,
  showGradients = true,
  scrollRef: externalRef
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalRef || internalRef;
  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(1);

  const calculateGradients = (target: HTMLElement) => {
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // Top gradient: fully opaque after 50px of scrolling
    setTopOpacity(Math.min(scrollTop / 50, 1));
    
    // Bottom gradient: fully opaque 50px away from the bottom
    const bottomDist = scrollHeight - (scrollTop + clientHeight);
    // If no scroll is needed, hide bottom gradient
    if (scrollHeight <= clientHeight) {
      setBottomOpacity(0);
    } else {
      setBottomOpacity(Math.min(bottomDist / 50, 1));
    }
  };

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    calculateGradients(e.currentTarget);
  };

  // Initial calculation
  useEffect(() => {
    if (scrollRef.current) {
      calculateGradients(scrollRef.current);
    }
    // Re-check on window resize or potential children changes
    const observer = new ResizeObserver(() => {
      if (scrollRef.current) calculateGradients(scrollRef.current);
    });
    if (scrollRef.current) observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div className={cn("relative overflow-hidden flex flex-col", className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn("flex-1 overflow-y-auto no-scrollbar scroll-smooth", scrollClassName)}
      >
        {children}
      </div>

      {showGradients && (
        <>
          {/* Top Fade Gradient */}
          <div
            className="absolute top-0 left-0 right-0 h-10 pointer-events-none z-10 transition-opacity duration-300 ease-in-out"
            style={{ 
              opacity: topOpacity,
              background: 'linear-gradient(to bottom, hsl(var(--secondary)), transparent)' 
            }}
          />
          {/* Bottom Fade Gradient */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10 transition-opacity duration-300 ease-in-out"
            style={{ 
              opacity: bottomOpacity,
              background: 'linear-gradient(to top, hsl(var(--secondary)), transparent)' 
            }}
          />
        </>
      )}
    </div>
  );
};
