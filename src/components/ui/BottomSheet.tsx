import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const DISMISS_THRESHOLD = 120; // px dragged to auto-dismiss
const VELOCITY_THRESHOLD = 0.5; // px/ms — fast flick dismisses regardless of distance

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatedIn, setIsAnimatedIn] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const startTime = useRef(0);
  const dragStarted = useRef(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setDragY(0);
      // Trigger the slide-in on the next frame so the sheet starts off-screen
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimatedIn(true);
        });
      });
    } else {
      setIsAnimatedIn(false);
      setTimeout(() => setIsVisible(false), 500);
    }
  }, [isOpen]);

  // Calculate backdrop opacity based on drag distance
  const backdropOpacity = isDragging 
    ? Math.max(0, 1 - dragY / (DISMISS_THRESHOLD * 3))
    : isAnimatedIn ? 1 : 0;

  const handleDragStart = useCallback((clientY: number) => {
    startY.current = clientY;
    currentY.current = clientY;
    startTime.current = Date.now();
    dragStarted.current = true;
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragStarted.current) return;

    const delta = clientY - startY.current;
    currentY.current = clientY;

    // Only allow dragging downward (positive delta); apply rubber-band for upward
    if (delta < 0) {
      // Rubber-band effect when dragging up
      setDragY(delta * 0.15);
    } else {
      setDragY(delta);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragStarted.current) return;
    dragStarted.current = false;

    const delta = currentY.current - startY.current;
    const elapsed = Date.now() - startTime.current;
    const velocity = delta / Math.max(elapsed, 1); // px/ms

    // Dismiss if dragged far enough OR flicked fast enough downward
    if (delta > DISMISS_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      // Animate to bottom before calling onClose
      setDragY(window.innerHeight);
      setTimeout(() => {
        onClose();
        setDragY(0);
        setIsDragging(false);
      }, 250);
    } else {
      // Snap back
      setDragY(0);
      setIsDragging(false);
    }
  }, [onClose]);

  // Touch events for the drag handle
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events for desktop testing
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);

    const onMouseMove = (ev: MouseEvent) => handleDragMove(ev.clientY);
    const onMouseUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  if (!isVisible && !isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 p-2 pb-[calc(8px+env(safe-area-inset-bottom))] z-100 flex items-end justify-center sm:items-center",
        // CRITICAL: Prevent invisible barrier blocking clicks when closed
        !isOpen && "pointer-events-none" 
      )}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-xs",
          !isDragging && "transition-all duration-300",
        )}
        style={{ opacity: backdropOpacity }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div 
        ref={sheetRef}
        className={cn(
          "relative w-full max-w-lg bg-background/50 backdrop-blur-xl rounded-4xl sm:rounded-4xl shadow-2xl mx-auto flex flex-col max-h-[90dvh]",
          // Only apply CSS transition when NOT actively dragging
          !isDragging && "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          // When dragging, use a fast snap-back transition
          isDragging && dragY === 0 && "transition-transform duration-300 ease-out",
          // Mobile: slide from bottom. Desktop: fade + scale.
          // Use isAnimatedIn so the sheet starts off-screen, then slides up.
          !isAnimatedIn && !isDragging && "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0",
          isAnimatedIn && !isDragging && dragY === 0 && "translate-y-0 sm:scale-100 opacity-100",
        )}
        style={{
          // During drag or animated dismiss, override transform
          transform: isDragging || dragY > 0
            ? `translateY(${Math.max(dragY, -30)}px)` 
            : undefined,
        }}
      >
        {/* Mobile Drag Handle — touch target for swipe-to-dismiss */}
        <div 
          className="absolute top-0 inset-x-0 flex justify-center py-3 sm:hidden z-20 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="w-12 h-1.5 bg-foreground rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-10 pb-4 sm:pt-6 sm:pb-4 z-10 shrink-0">
          <h3 className="text-[2.5rem] font-thunder font-extrabold xtracking-wide leading-[0.8] text-foreground">
            {title || 'Options'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 mb-2 text-primary hover:text-primary/60 rounded-full transition-all active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-7 h-7" strokeWidth={3} />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="overflow-y-auto overscroll-contain px-6 pb-safe sm:pb-6 pt-2">
          {/* pb-safe ensures it doesn't get hidden behind the iPhone home indicator */}
          <div className="pb-6"> 
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
