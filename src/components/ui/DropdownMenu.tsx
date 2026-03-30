import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';

interface DropdownItem {
  label?: string;
  onClick?: () => void;
  textClass?: string;
  icon?: React.ReactNode;
  divider?: boolean;
  subItems?: DropdownItem[];
}

interface DropdownMenuProps {
  items: DropdownItem[];
  icon?: React.ReactNode;
  align?: 'right' | 'left';
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ items, icon, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubIndex, setOpenSubIndex] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
        setOpenSubIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderItem = (item: DropdownItem, index: number) => {
    if (item.divider) {
      return <div key={`div-${index}`} className="my-1 border-t border-border/50" />;
    }

    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={index} className="relative group/sub">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasSubItems) {
              setOpenSubIndex(openSubIndex === index ? null : index);
            } else if (item.onClick) {
              item.onClick();
              setIsOpen(false);
              setOpenSubIndex(null);
            }
          }}
          onMouseEnter={() => hasSubItems && setOpenSubIndex(index)}
          className={cn(
            'w-full text-left px-4 py-3 text-sm hover:bg-secondary/60 premium-transition flex items-center justify-between gap-3',
            item.textClass || 'text-foreground',
            openSubIndex === index && hasSubItems && 'bg-secondary/40'
          )}
        >
          <div className="flex items-center gap-3">
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            {item.label}
          </div>
          {hasSubItems && (
            <svg className={cn("w-4 h-4 transition-transform", openSubIndex === index ? "rotate-90 md:rotate-0" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {hasSubItems && openSubIndex === index && (
          <div className={cn(
            "md:absolute md:top-0 h-full md:h-auto bg-background rounded-xl shadow-xl border border-border overflow-hidden z-60 animate-in md:slide-in-from-left-2 fade-in duration-200",
            align === 'right' ? "md:right-full md:mr-1" : "md:left-full md:ml-1",
            "w-full md:w-56"
          )}>
            <div className="py-1">
              {item.subItems!.map((sub, sIdx) => renderItem(sub, sIdx))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); setOpenSubIndex(null); }} 
        className="p-2 hover:bg-secondary rounded-full premium-transition text-muted-foreground hover:text-foreground"
      >
        {icon || <MoreVertical className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className={cn(
          "absolute right-0 mt-2 w-56 origin-top-right bg-background rounded-2xl shadow-2xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden border border-border animate-in slide-in-from-top-2 fade-in duration-200",
          align === 'right' ? "right-0" : "left-0"
        )}>
          <div className="py-1">
            {items.map((item, index) => renderItem(item, index))}
          </div>
        </div>
      )}
    </div>
  );
};
