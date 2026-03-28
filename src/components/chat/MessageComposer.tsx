import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MessageComposerProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-3 bg-background border-t border-border mt-auto">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
        <button 
          type="button" 
          className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full premium-transition shrink-0 mb-0.5"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 bg-secondary/50 border border-border rounded-2xl flex items-center pr-1 premium-transition">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled}
            className="w-full bg-transparent border-none outline-none resize-none py-3 px-4 max-h-30 min-h-11 text-[15px]"
            rows={1}
            style={{ height: 'auto' }}
            // A dynamic height logic would go here in production
          />
          <button 
            type="button" 
            className="p-2 text-muted-foreground hover:text-foreground rounded-full premium-transition shrink-0"
            disabled={disabled}
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <button 
          type="submit" 
          disabled={!text.trim() || disabled}
          className={cn(
            "p-3 rounded-full premium-transition shrink-0 mb-0.5 flex items-center justify-center",
            text.trim() && !disabled
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20" 
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </form>
    </div>
  );
};
