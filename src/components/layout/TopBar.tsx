import React from 'react';
import { cn } from '@/lib/utils';
import GradualBlur from '../ui/GradualBlur';

interface TopBarProps {
  title?: React.ReactNode;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, leftElement, rightElement, className }) => {
  return (
    <div className={cn(
      'min-h-20 flex flex-col justify-end px-4 py-4 pt-safe sticky top-0 z-40 bg-background/0',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="pointer-events-none">
          <GradualBlur position="top" className="z-10" height="5rem" opacity={1} curve="ease-in-out" />
        </div>
        <div className="flex items-center flex-1 z-10">
          <div className="flex items-center">
            {leftElement}
          </div>
          <div className="flex-1 flex justify-start font-semibold text-lg text-foreground truncate px-2 z-10">
            {title}
          </div>
        </div>
        <div className="flex items-center justify-end flex-1 gap-1 z-10">
          {rightElement}
        </div>
      </div>
    </div>
  );
};
