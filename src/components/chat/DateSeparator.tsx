import React from 'react';
import { isToday, isYesterday, isThisYear, format } from 'date-fns';

export function formatChatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isThisYear(d)) return format(d, 'MMM d, EEEE');
  return format(d, 'MMM d, yyyy');
}

export const DateSeparator: React.FC<{ date: string }> = ({ date }) => {
  return (
    <div className="flex items-center justify-center my-3 w-full sticky top-2 z-10 pointer-events-none select-none">
      <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <span className="text-[11px] font-semibold text-muted-foreground/80 tracking-wide">
          {date}
        </span>
      </div>
    </div>
  );
};
