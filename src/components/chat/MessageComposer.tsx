import React, { useState } from 'react';
import { Send, Paperclip, Smile, X, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

export interface MessageComposerProps {
  onSendMessage: (content: string) => void;
  onSendFile: (file: File, type: 'image' | 'video' | 'file', onProgress?: (p: number) => void) => Promise<any> | void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ 
  onSendMessage, 
  onSendFile, 
  onTyping,
  disabled, 
  placeholder = "Type a message..." 
}) => {
  const [text, setText] = useState('');
  const typingTimeoutRef = React.useRef<any>(null);

  const handleTextChange = (value: string) => {
    setText(value);
    
    if (onTyping) {
      if (!typingTimeoutRef.current) {
        onTyping(true);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sendHD, setSendHD] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    // Clear input so selecting the same file again works
    if (e.target) {
      e.target.value = '';
    }
  };

  const confirmSendFiles = async () => {
    setIsUploading(true);
    try {
      for (const file of selectedFiles) {
        // Size Limit Check (50MB)
        const MAX_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name} is too large. Max size is 50MB.`);
          continue;
        }

        let fileToSend = file;
        let type: 'image' | 'video' | 'file' = 'file';

        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';

        if (type === 'image' && !sendHD) {
          const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
          fileToSend = await imageCompression(file, options);
        }

        await onSendFile(fileToSend, type, (progress) => {
          setFileProgresses(prev => ({ ...prev, [file.name]: progress }));
        });
      }
      setSelectedFiles([]);
      setFileProgresses({});
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
        multiple
      />

      {selectedFiles.length > 0 && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-lg">Send {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}</h3>
              <button onClick={() => setSelectedFiles([])} className="p-2 hover:bg-secondary rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-wrap gap-4 justify-center bg-black/5 dark:bg-white/5 min-h-60 items-center">
              {selectedFiles.map((f, i) => (
                  <div key={i} className="relative group w-32 h-32 rounded-xl overflow-hidden shadow-sm bg-background border border-border flex items-center justify-center">
                    {f.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(f)} className="w-full h-full object-cover"/>
                    ) : f.type.startsWith('video/') ? (
                      <video src={URL.createObjectURL(f)} className="w-full h-full object-cover"/>
                    ) : (
                      <div className="p-2 text-center break-all"><p className="text-xs font-medium opacity-80">{f.name}</p></div>
                    )}
                    <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4"/>
                    </button>
                    {/* Size tag */}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white">
                      {Math.round(f.size / 1024 / 1024 * 10) / 10} MB
                    </div>
                    {/* Progress overlay */}
                    {fileProgresses[f.name] !== undefined && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2 backdrop-blur-sm">
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${fileProgresses[f.name]}%` }} />
                        </div>
                        <span className="text-[10px] text-white mt-2 font-bold">{fileProgresses[f.name]}%</span>
                      </div>
                    )}
                  </div>
              ))}
              
              {/* Add more button */}
              <button onClick={handleFileClick} className="w-32 h-32 rounded-xl flex items-center justify-center border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary">
                 <div className="flex flex-col items-center">
                    <span className="text-2xl mb-1">+</span>
                    <span className="text-xs font-medium">Add Files</span>
                 </div>
              </button>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between bg-card">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={sendHD} onChange={(e) => setSendHD(e.target.checked)} className="w-4 h-4 rounded text-primary"/>
                <span className="text-sm font-medium opacity-90">Send without compression (Original)</span>
              </label>
              
              <button 
                onClick={confirmSendFiles} 
                disabled={isUploading} 
                className={cn(
                  "px-6 py-2.5 rounded-full flex items-center gap-2 font-medium transition-colors cursor-pointer", 
                  isUploading ? "bg-secondary text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                )}
              >
                  {isUploading ? <><RefreshCw className="w-4 h-4 animate-spin"/> Sending...</> : <><Send className="w-4 h-4 ml-1"/> Send</>}
              </button>
            </div>
          </div>
        </div>
      )}
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
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent border-none outline-none resize-none py-3 px-4 max-h-30 min-h-11 text-[15px]"
            rows={1}
            style={{ height: 'auto' }}
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
