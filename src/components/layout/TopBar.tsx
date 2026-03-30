import React from 'react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, leftElement, rightElement, className }) => {
  return (
    <div className={cn('h-16 flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40', className)}>
      <div className="flex items-center flex-1">
        <div className="flex items-center">
          {leftElement}
        </div>
        <div className="flex-1 flex justify-center font-semibold text-lg text-foreground truncate px-2">
          {title}
        </div>
      </div>
      <div className="flex items-center justify-end flex-1 gap-1">
        {rightElement}
      </div>
    </div>
  );
};
