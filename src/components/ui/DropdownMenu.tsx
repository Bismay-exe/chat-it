import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';

interface DropdownMenuProps {
  items: { label: string; onClick: () => void; textClass?: string; icon?: React.ReactNode }[];
  icon?: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ items, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} 
        className="p-2 hover:bg-secondary rounded-full premium-transition text-muted-foreground hover:text-foreground"
      >
        {icon || <MoreVertical className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right bg-background rounded-xl shadow-lg ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden border border-border animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full text-left px-4 py-3 text-sm hover:bg-secondary/60 premium-transition flex items-center gap-3',
                  item.textClass || 'text-foreground'
                )}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
