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
    <div className="fixed inset-0 z-100 flex items-end">
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={cn(
          "relative w-full md:w-95 bg-background rounded-t-3xl shadow-xl transition-transform duration-300 ease-out mx-auto",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">{title || 'Options'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full premium-transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="max-h-[80vh] overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};
