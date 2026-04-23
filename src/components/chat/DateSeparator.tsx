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
    <div className="flex items-center justify-center my-3 w-full sticky top-0 z-10 pointer-events-none select-none">
      <div className="bg-background/50 border border-border/10 backdrop-blur-xl rounded-lg px-3 py-0.5 shadow-[0_1px_20px_rgba(0,0,0,0.08)]">
        <span className="text-[11px] font-bold text-muted-foreground/80 tracking-wide">
          {date}
        </span>
      </div>
    </div>
  );
};
