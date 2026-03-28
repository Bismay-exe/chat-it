import React from 'react';

export const DateSeparator: React.FC<{ date: string }> = ({ date }) => {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="bg-background/80 backdrop-blur-sm text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-full border border-border shadow-sm uppercase tracking-wider">
        {date}
      </span>
    </div>
  );
};
