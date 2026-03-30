import React from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, AlertCircle, RefreshCw } from 'lucide-react';

export interface MessageBubbleProps {
  id: string;
  content: string;
  timestamp: string;
  isSentByMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  senderName?: string; // For group chats
  isSequence?: boolean; // If part of a sequence of messages from same sender
  highlight?: string | boolean;
  isCurrentHighlight?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  content,
  timestamp,
  isSentByMe,
  status,
  senderName,
  isSequence = false,
  highlight,
  isCurrentHighlight = false,
}) => {
  return (
    <div className={cn("flex flex-col w-full px-4", isSentByMe ? "items-end" : "items-start", isSequence ? "mt-1" : "mt-4")}>
      {!isSentByMe && senderName && !isSequence && (
        <span className="text-xs text-muted-foreground ml-1 mb-1 font-medium">{senderName}</span>
      )}
      
      <div 
        className={cn(
          "relative max-w-[80%] md:max-w-[70%] px-4 py-2 text-[15px] leading-relaxed premium-transition shadow-sm",
          isSentByMe 
            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
            : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm",
          isCurrentHighlight && "ring-2 ring-accent ring-offset-2 ring-offset-background scale-[1.02]"
        )}
      >
        <p className="whitespace-pre-wrap wrap-break-word">
          {highlight && typeof highlight === 'string' ? (
            content.split(new RegExp(`(${highlight})`, 'gi')).map((part, i) => 
              part.toLowerCase() === highlight.toLowerCase() 
                ? <span key={i} className="bg-accent text-accent-foreground font-bold rounded-sm px-0.5">{part}</span> 
                : part
            )
          ) : highlight ? (
             <span className="bg-accent/30 rounded-sm">{content}</span>
          ) : (
            content
          )}
        </p>
        
        <div className={cn(
          "flex items-center gap-1 mt-1 text-[11px] justify-end",
          isSentByMe ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span>{timestamp}</span>
          {isSentByMe && status && (
            <span className="flex items-center">
              {status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-400 drop-shadow-sm" />
              ) : status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5 opacity-70" />
              ) : status === 'sent' ? (
                <Check className="w-3.5 h-3.5 opacity-70" />
              ) : status === 'sending' ? (
                <RefreshCw className="w-2.5 h-2.5 animate-spin opacity-50" />
              ) : status === 'error' ? (
                <div className="flex items-center gap-0.5 text-red-300">
                  <span className="text-[9px] font-bold">Failed</span>
                  <AlertCircle className="w-3 h-3" />
                </div>
              ) : (
                <Check className="w-3.5 h-3.5 opacity-70" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
