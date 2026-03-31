import React from 'react';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, AlertCircle, RefreshCw, Download, FileText, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toast } from 'sonner';

export interface MessageBubbleProps {
  id: string; // Used for keying or tracing
  chatId?: string; // Optional: used for deletion logic
  content: string;
  type?: 'text' | 'image' | 'video' | 'file';
  media_url?: string | null;
  file_name?: string | null;
  timestamp: string;
  isSentByMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  senderName?: string; // For group chats
  isSequence?: boolean; // If part of a sequence of messages from same sender
  highlight?: string | boolean;
  isCurrentHighlight?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  chatId,
  content,
  type = 'text',
  media_url,
  file_name,
  timestamp,
  isSentByMe,
  status,
  senderName,
  isSequence = false,
  highlight,
  isCurrentHighlight = false,
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    if (!media_url || isDownloading) return;
    setIsDownloading(true);

    try {
      // 1. Fetch file as blob
      const response = await fetch(media_url);
      const blob = await response.blob();
      
      // 2. Convert to base64 for Capacitor
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // 3. Save to device
      const fileName = file_name || `file_${Date.now()}`;
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
      });

      toast.success(`Saved to Documents: ${fileName}`);

      // 4. Delete from Supabase (Only if we are the recipient)
      if (!isSentByMe && chatId) {
        // Path matches the one used in useMessages.ts
        const fileNameInStorage = media_url.split('/').pop();
        if (fileNameInStorage) {
          await supabase.storage
            .from('chat-attachments')
            .remove([`${chatId}/${fileNameInStorage}`]);
          
          toast.info('File cleared from cloud storage.');
        }
      }
    } catch (error: any) {
      toast.error('Failed to download: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };
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
        {type === 'text' ? (
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
        ) : (
          <div className="flex flex-col gap-2 min-w-50">
            {type === 'image' && media_url && (
              <div className="relative group rounded-lg overflow-hidden border border-primary/20 bg-black/5">
                <img src={media_url} alt="Shared" className="max-w-full h-auto object-cover max-h-60" />
              </div>
            )}
            {type === 'video' && media_url && (
              <div className="relative group rounded-lg overflow-hidden border border-primary/20 bg-black/5 aspect-video flex items-center justify-center">
                <video src={media_url} className="max-w-full h-auto" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            )}
            {type === 'file' && (
              <div className="flex items-center gap-3 p-2 bg-black/5 rounded-lg border border-primary/10">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold truncate">{file_name || 'Document'}</span>
                  <span className="text-[10px] opacity-60 uppercase">Click to download</span>
                </div>
              </div>
            )}
            
            {media_url && !isSentByMe && (
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className={cn(
                  "flex items-center gap-2 mt-1 py-2 px-3 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all",
                  isDownloading ? "bg-secondary text-muted-foreground" : "bg-primary/20 text-primary hover:bg-primary/30"
                )}
              >
                {isDownloading ? (
                   <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                {isDownloading ? 'Downloading...' : 'Download & Delete'}
              </button>
            )}

            {media_url && isSentByMe && (
               <div className="text-[9px] font-bold text-primary-foreground/50 uppercase tracking-tighter mt-1">
                 Cloud Storage - Encrypted
               </div>
            )}
          </div>
        )}
        
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
