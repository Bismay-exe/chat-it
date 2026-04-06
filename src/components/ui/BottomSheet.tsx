import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex items-end justify-center sm:items-center",
        // CRITICAL: Prevent invisible barrier blocking clicks when closed
        !isOpen && "pointer-events-none" 
      )}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sheet */}
      <div 
        className={cn(
          "relative w-full max-w-lg bg-background rounded-t-4xl sm:rounded-4xl shadow-2xl transition-all duration-500 mx-auto flex flex-col max-h-[90dvh]",
          // Custom spring-like easing for a native feel
          "ease-[cubic-bezier(0.32,0.72,0,1)]",
          // Mobile: Slide up | Desktop (sm): Fade and scale
          isOpen 
            ? "translate-y-0 sm:scale-100 opacity-100" 
            : "translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0"
        )}
      >
        {/* Mobile Drag Handle (Visual Indicator) */}
        <div className="absolute top-0 inset-x-0 flex justify-center py-3 sm:hidden z-20">
          <div className="w-12 h-1.5 bg-foreground rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4 sm:pt-6 sm:pb-4 z-10 shrink-0">
          <h3 className="text-3xl font-bricolage-semi-condensed font-bold tracking-tighter leading-[0.8] text-foreground">
            {title || 'Options'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-full transition-all active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="overflow-y-auto overscroll-contain px-6 pb-safe sm:pb-6 pt-2">
          {/* pb-safe ensures it doesn't get hidden behind the iPhone home indicator */}
          <div className="pb-8"> 
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
