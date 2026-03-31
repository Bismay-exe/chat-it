import React, { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export interface MessageComposerProps {
  onSendMessage: (content: string) => void;
  onSendFile: (file: File, type: 'image' | 'video' | 'file') => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ 
  onSendMessage, 
  onSendFile, 
  disabled, 
  placeholder = "Type a message..." 
}) => {
  const [text, setText] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Size Limit Check (50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File too large. Max size is 50MB.');
      return;
    }

    setIsUploading(true);
    try {
      let fileToSend = file;
      let type: 'image' | 'video' | 'file' = 'file';

      if (file.type.startsWith('image/')) {
        type = 'image';
        // 2. Image Compression
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        toast.info('Compressing image...');
        fileToSend = await imageCompression(file, options);
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      }

      // 3. Send File
      await onSendFile(fileToSend, type);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast.error('Error processing file: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEmojiClick = () => {
    toast.info('Emoji picker coming soon! (Stub)');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-3 bg-background border-t border-border mt-auto">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,video/*,video/mp4,.pdf,.doc,.docx"
      />
      <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
        <button 
          type="button" 
          onClick={handleFileClick}
          className={cn(
            "p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full premium-transition shrink-0 mb-0.5",
            isUploading && "animate-pulse text-primary"
          )}
          disabled={disabled || isUploading}
        >
          <Paperclip className={cn("w-5 h-5", isUploading && "animate-spin")} />
        </button>

        <div className="flex-1 bg-secondary/50 border border-border rounded-2xl flex items-center pr-1 premium-transition">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent border-none outline-none resize-none py-3 px-4 max-h-30 min-h-11 text-[15px]"
            rows={1}
            style={{ height: 'auto' }}
            // A dynamic height logic would go here in production
          />
          <button 
            type="button" 
            onClick={handleEmojiClick}
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
