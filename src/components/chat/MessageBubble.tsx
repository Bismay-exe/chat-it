import React from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

export interface MessageBubbleProps {
  id: string;
  content: string;
  timestamp: string;
  isSentByMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
  senderName?: string; // For group chats
  isSequence?: boolean; // If part of a sequence of messages from same sender
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  timestamp,
  isSentByMe,
  status,
  senderName,
  isSequence = false,
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
            : "bg-card border border-border text-foreground rounded-2xl rounded-tl-sm"
        )}
      >
        <p className="whitespace-pre-wrap wrap-break-word">{content}</p>
        
        <div className={cn(
          "flex items-center gap-1 mt-1 text-[11px] justify-end",
          isSentByMe ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span>{timestamp}</span>
          {isSentByMe && status && (
            <span>
              {status === 'read' ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
              ) : status === 'delivered' ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
